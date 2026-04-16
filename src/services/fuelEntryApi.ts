import keycloak from '../auth/keycloak';
import type { ManualFuelEntryInput, TruckFuelEntryDto, TruckFuelSummary } from '../types/fuel';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

/**
 * Thrown when the backend returns 409 for a duplicate fuel entry.
 * The caller can inspect `collidingEntryId` to render an inline link.
 */
export class FuelEntryDuplicateError extends Error {
  readonly collidingEntryId: string;

  constructor(collidingEntryId: string, message: string) {
    super(message);
    this.name = 'FuelEntryDuplicateError';
    this.collidingEntryId = collidingEntryId;
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;
  return headers;
}

async function handleErrorResponse(response: Response, endpoint: string): Promise<never> {
  const body = await response.text();

  if (response.status === 409) {
    try {
      const parsed = JSON.parse(body) as { collidingEntryId?: string; message?: string };
      if (parsed.collidingEntryId) {
        throw new FuelEntryDuplicateError(
          parsed.collidingEntryId,
          parsed.message ?? 'Mükerrer yakıt girişi',
        );
      }
    } catch (e) {
      if (e instanceof FuelEntryDuplicateError) throw e;
      // JSON parse failed — fall through to generic error
    }
  }

  console.error(`API Error ${response.status} ${endpoint}:`, body);
  throw new Error(`İstek başarısız (${response.status})`);
}

async function fuelApiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) await handleErrorResponse(response, endpoint);

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function fuelMultipartCall<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) await handleErrorResponse(response, endpoint);

  return response.json() as Promise<T>;
}

export const fuelEntryApi = {
  /**
   * POST /api/fleets/{fleetId}/trucks/{truckId}/fuel-entries
   * Multipart: `data` (JSON blob) + `photo` (File).
   * Throws FuelEntryDuplicateError on 409 with collidingEntryId attached.
   */
  addManual: (
    fleetId: string,
    truckId: string,
    input: ManualFuelEntryInput,
    photo: File,
  ): Promise<TruckFuelEntryDto> => {
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(input)], { type: 'application/json' }));
    fd.append('photo', photo);
    return fuelMultipartCall<TruckFuelEntryDto>(
      `/fleets/${fleetId}/trucks/${truckId}/fuel-entries`,
      fd,
    );
  },

  /**
   * PUT /api/fleets/{fleetId}/fuel-entries/{entryId}
   */
  updateManual: (
    fleetId: string,
    entryId: string,
    input: ManualFuelEntryInput,
  ): Promise<TruckFuelEntryDto> =>
    fuelApiCall<TruckFuelEntryDto>(`/fleets/${fleetId}/fuel-entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  /**
   * DELETE /api/fleets/{fleetId}/fuel-entries/{entryId}
   */
  deleteManual: (fleetId: string, entryId: string): Promise<void> =>
    fuelApiCall<void>(`/fleets/${fleetId}/fuel-entries/${entryId}`, { method: 'DELETE' }),

  /**
   * GET /api/fleets/{fleetId}/trucks/{truckId}/fuel-entries?limit=N
   */
  listForTruck: (
    fleetId: string,
    truckId: string,
    limit?: number,
  ): Promise<TruckFuelEntryDto[]> => {
    const params = limit !== undefined ? `?limit=${limit}` : '';
    return fuelApiCall<TruckFuelEntryDto[]>(
      `/fleets/${fleetId}/trucks/${truckId}/fuel-entries${params}`,
    );
  },

  /**
   * GET /api/fleets/{fleetId}/trucks/{truckId}/fuel-summary?days=N
   */
  summaryForTruck: (
    fleetId: string,
    truckId: string,
    days?: number,
  ): Promise<TruckFuelSummary> => {
    const params = days !== undefined ? `?days=${days}` : '';
    return fuelApiCall<TruckFuelSummary>(
      `/fleets/${fleetId}/trucks/${truckId}/fuel-summary${params}`,
    );
  },

  /**
   * Returns a direct URL for use in <img src="..."> — the browser sends the
   * Bearer token via the Authorization header, so the image renders as-is.
   * GET /api/fleets/{fleetId}/fuel-entries/{entryId}/receipt
   */
  receiptUrl: (fleetId: string, entryId: string): string =>
    `${API_BASE_URL}/fleets/${fleetId}/fuel-entries/${entryId}/receipt`,

  // ── Driver-side endpoints (UC-13-lite) ────────────────────────────────────
  // The server resolves the driver's assigned truck from the JWT, so callers
  // don't pass fleetId / truckId here. No edit/delete — drivers can't rewrite
  // their own history (audit safety).

  /** POST /api/driver/fuel-entries (multipart) */
  addDriverEntry: (
    input: ManualFuelEntryInput,
    photo: File,
  ): Promise<TruckFuelEntryDto> => {
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(input)], { type: 'application/json' }));
    fd.append('photo', photo);
    return fuelMultipartCall<TruckFuelEntryDto>('/driver/fuel-entries', fd);
  },

  /** GET /api/driver/fuel-entries?limit=N */
  listForDriver: (limit?: number): Promise<TruckFuelEntryDto[]> => {
    const params = limit !== undefined ? `?limit=${limit}` : '';
    return fuelApiCall<TruckFuelEntryDto[]>(`/driver/fuel-entries${params}`);
  },

  /** PUT /api/driver/fuel-entries/{entryId} */
  updateDriverEntry: (
    entryId: string,
    input: ManualFuelEntryInput,
  ): Promise<TruckFuelEntryDto> =>
    fuelApiCall<TruckFuelEntryDto>(`/driver/fuel-entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  /** DELETE /api/driver/fuel-entries/{entryId} */
  deleteDriverEntry: (entryId: string): Promise<void> =>
    fuelApiCall<void>(`/driver/fuel-entries/${entryId}`, { method: 'DELETE' }),

  /** GET /api/driver/fuel-entries/{entryId}/receipt */
  driverReceiptUrl: (entryId: string): string =>
    `${API_BASE_URL}/driver/fuel-entries/${entryId}/receipt`,
};
