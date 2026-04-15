import keycloak from '../auth/keycloak';
import type { Client, Driver, Fleet, Truck } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

function getUserFriendlyMessage(status: number): string {
  switch (status) {
    case 400: return 'Geçersiz istek';
    case 401: return 'Oturum süreniz doldu, lütfen tekrar giriş yapın';
    case 403: return 'Bu işlem için yetkiniz yok';
    case 404: return 'Kayıt bulunamadı';
    case 429: return 'Çok fazla istek gönderdiniz, lütfen bekleyin';
    default:  return status >= 500 ? 'Sunucu hatası, lütfen tekrar deneyin' : `İstek başarısız (${status})`;
  }
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page (0-indexed)
}

export interface BulkImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ rowNumber: number; identifier: string; message: string }>;
}

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error ${response.status} ${options?.method ?? 'GET'} ${endpoint}:`, errorBody);
    throw new Error(getUserFriendlyMessage(response.status));
  }

  // Handle empty responses (e.g., 204 No Content for DELETE)
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

/**
 * Multipart POST for file uploads. Browsers must set the Content-Type header
 * themselves so the multipart boundary is included, so we can't reuse apiCall.
 */
async function multipartCall<T>(endpoint: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error ${response.status} POST ${endpoint}:`, errorBody);
    throw new Error(getUserFriendlyMessage(response.status));
  }

  return response.json();
}

// Fleet API
export const fleetApi = {
  create: (data: any) =>
    apiCall('/fleets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMy: () => apiCall<Fleet>('/fleets/my'),
  getById: (id: string) => apiCall<Fleet>(`/fleets/${id}`),
  update: (id: string, data: { name: string; address: any; email: string; phone: string }) =>
    apiCall(`/fleets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeCurrency: (id: string, currency: string) =>
    apiCall(`/fleets/${id}/currency`, { method: 'PUT', body: JSON.stringify({ currency }) }),
};

// Trip API — fleet is derived from JWT on the backend
export const tripApi = {
  getByFleet: (status?: string, page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    return apiCall<PageResponse<any>>(`/trips?${params}`);
  },
};

// Client API — fleet is derived from JWT
export const clientApi = {
  add: (data: any) =>
    apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<Client>>(`/clients?page=${page}&size=${size}`),
  getById: (id: string) => apiCall<Client>(`/clients/${id}`),
  update: (id: string, data: { email: string; phone: string; address: any }) =>
    apiCall<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePaymentTerms: (id: string, paymentTerms: string) =>
    apiCall<Client>(`/clients/${id}/payment-terms`, { method: 'PUT', body: JSON.stringify({ paymentTerms }) }),
  delete: (id: string) =>
    apiCall(`/clients/${id}`, { method: 'DELETE' }),
};

// Driver API — fleet is derived from JWT
export const driverApi = {
  getMe: () => apiCall<any>('/drivers/me'),
  updateMyContact: (data: { phone?: string; email?: string }) =>
    apiCall('/drivers/me/contact', { method: 'PUT', body: JSON.stringify(data) }),
  updateLocale: (locale: string) =>
    apiCall('/drivers/me/locale', { method: 'PUT', body: JSON.stringify({ locale }) }),
  getMyDocuments: () => apiCall<any[]>('/drivers/me/documents'),
  uploadMyDocument: (file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    return multipartCall<any>('/drivers/me/documents/upload', formData);
  },
  register: (data: any) =>
    apiCall('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<Driver>>(`/drivers?page=${page}&size=${size}`),
  getAvailable: (page = 0, size = 20) =>
    apiCall<PageResponse<Driver>>(`/drivers?status=AVAILABLE&page=${page}&size=${size}`),
  bulkImport: (rows: any[]) =>
    apiCall<BulkImportResult>('/drivers/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    }),
  getById: (id: string) => apiCall<Driver>(`/drivers/${id}`),
  update: (id: string, data: { firstName?: string; lastName?: string; phone?: string; email?: string; status?: string }) =>
    apiCall<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateEmergencyContact: (id: string, data: { name: string; phone: string; relationship: string }) =>
    apiCall<Driver>(`/drivers/${id}/emergency-contact`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLicense: (id: string, expiryDate: string) =>
    apiCall<Driver>(`/drivers/${id}/license`, {
      method: 'PUT',
      body: JSON.stringify({ expiryDate }),
    }),
  addCertificate: (id: string, data: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
  }) =>
    apiCall<Driver>(`/drivers/${id}/certificates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeCertificate: (driverId: string, certificateId: string) =>
    apiCall<Driver>(`/drivers/${driverId}/certificates/${certificateId}`, {
      method: 'DELETE',
    }),
  uploadDocument: (driverId: string, file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    return multipartCall<any>(`/drivers/${driverId}/documents/upload`, formData);
  },
  getDocuments: (driverId: string) =>
    apiCall(`/drivers/${driverId}/documents`),
  updateDocumentExpiry: (documentId: string, expiryDate: string) =>
    apiCall(`/drivers/documents/${documentId}/expiry?expiryDate=${expiryDate}`, {
      method: 'PUT',
    }),
  downloadDocument: async (documentId: string) => {
    const headers: Record<string, string> = {};
    if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;

    const response = await fetch(`${API_BASE_URL}/drivers/documents/${documentId}/download`, { headers });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  deleteDocument: (documentId: string) =>
    apiCall(`/drivers/documents/${documentId}`, {
      method: 'DELETE',
    }),
  resendInvite: (id: string) =>
    apiCall(`/drivers/${id}/resend-invite`, { method: 'POST' }),
  delete: (id: string) =>
    apiCall(`/drivers/${id}`, {
      method: 'DELETE',
    }),
};

// Truck API — fleet is derived from JWT
export const truckApi = {
  register: (data: any) =>
    apiCall('/trucks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<Truck>>(`/trucks?page=${page}&size=${size}`),
  getAvailable: (page = 0, size = 20) =>
    apiCall<PageResponse<Truck>>(`/trucks?status=AVAILABLE&page=${page}&size=${size}`),
  bulkImport: (rows: any[]) =>
    apiCall<BulkImportResult>('/trucks/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    }),
  getById: (id: string) => apiCall<Truck>(`/trucks/${id}`),
  updateDocuments: (id: string, data: any) =>
    apiCall<Truck>(`/trucks/${id}/documents`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadDocument: (truckId: string, file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    return multipartCall<any>(`/trucks/${truckId}/documents/upload`, formData);
  },
  getDocuments: (truckId: string) =>
    apiCall(`/trucks/${truckId}/documents`),
  updateDocumentExpiry: (documentId: string, expiryDate: string) =>
    apiCall(`/trucks/documents/${documentId}/expiry?expiryDate=${expiryDate}`, {
      method: 'PUT',
    }),
  downloadDocument: async (documentId: string) => {
    const headers: Record<string, string> = {};
    if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;

    const response = await fetch(`${API_BASE_URL}/trucks/documents/${documentId}/download`, { headers });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  deleteDocument: (documentId: string) =>
    apiCall(`/trucks/documents/${documentId}`, {
      method: 'DELETE',
    }),
  assignDriver: (truckId: string, driverId: string) =>
    apiCall<Truck>(`/trucks/${truckId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    }),
  unassignDriver: (truckId: string) =>
    apiCall<Truck>(`/trucks/${truckId}/unassign-driver`, {
      method: 'POST',
    }),
  updateStatus: (id: string, status: string) =>
    apiCall<Truck>(`/trucks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getMyTruck: () => apiCall<any>('/trucks/my-truck'),
  getMyTruckDocuments: () => apiCall<any[]>('/trucks/my-truck/documents'),
  uploadMyTruckDocument: (file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    return multipartCall<any>('/trucks/my-truck/documents/upload', formData);
  },
  updateMyTruckLocation: (latitude: number, longitude: number, city: string) =>
    apiCall('/trucks/my-truck/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude, city }),
    }),
  delete: (id: string) =>
    apiCall(`/trucks/${id}`, { method: 'DELETE' }),
};

// Admin API — platform-level admin endpoints
export const adminApi = {
  getStats: () => apiCall<any>('/admin/stats'),
  getFleets: () => apiCall<any[]>('/admin/fleets'),
  getFleetDetails: (fleetId: string) => apiCall<any>(`/admin/fleets/${fleetId}/details`),
  changePlan: (fleetId: string, plan: string) =>
    apiCall(`/admin/fleets/${fleetId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
};

// Fuel import format API — UC-1a (admin-only during pilot).
// fleetId is in the path so admins can operate on any fleet.
export const fuelFormatApi = {
  list: (fleetId: string) =>
    apiCall<import('../types/fuel').FuelImportFormatDto[]>(`/fleets/${fleetId}/fuel-formats`),
  suggestMapping: (fleetId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return multipartCall<import('../types/fuel').SuggestedMappingDto>(
      `/fleets/${fleetId}/fuel-formats/suggest-mapping`, formData);
  },
  clone: (fleetId: string, starterId: string, name: string) =>
    apiCall<import('../types/fuel').FuelImportFormatDto>(
      `/fleets/${fleetId}/fuel-formats/clone`,
      { method: 'POST', body: JSON.stringify({ starterId, name }) }),
  create: (
    fleetId: string,
    payload: {
      provider: import('../types/fuel').FuelProvider;
      name: string;
      columnMapping: Record<string, string>;
      sampleHeaders: string[];
    },
  ) =>
    apiCall<import('../types/fuel').FuelImportFormatDto>(
      `/fleets/${fleetId}/fuel-formats`,
      { method: 'POST', body: JSON.stringify(payload) }),
  newVersion: (
    fleetId: string,
    formatId: string,
    payload: { columnMapping: Record<string, string>; sampleHeaders: string[] },
  ) =>
    apiCall<import('../types/fuel').FuelImportFormatDto>(
      `/fleets/${fleetId}/fuel-formats/${formatId}/new-version`,
      { method: 'POST', body: JSON.stringify(payload) }),
  deactivate: (fleetId: string, formatId: string) =>
    apiCall<void>(
      `/fleets/${fleetId}/fuel-formats/${formatId}/deactivate`,
      { method: 'PUT' }),
};

// Fuel import API — UC-1b preview/commit (admin-only during pilot).
export const fuelImportApi = {
  preview: (fleetId: string, formatId: string, file: File) => {
    const formData = new FormData();
    formData.append('formatId', formatId);
    formData.append('file', file);
    return multipartCall<import('../types/fuel').DraftPreview>(
      `/fleets/${fleetId}/fuel-imports/preview`, formData);
  },
  commit: (
    fleetId: string,
    draftId: string,
    overrides: import('../types/fuel').CommitOverride[],
  ) =>
    apiCall<import('../types/fuel').FuelImportBatchDto>(
      `/fleets/${fleetId}/fuel-imports/commit/${draftId}`,
      { method: 'POST', body: JSON.stringify({ overrides }) }),
  getBatch: (fleetId: string, batchId: string) =>
    apiCall<import('../types/fuel').FuelImportBatchDto>(
      `/fleets/${fleetId}/fuel-imports/${batchId}`),
};

// Fuel review API — UC-2 unmatched plates and duplicate detection.
export const fuelReviewApi = {
  counts: (fleetId: string) =>
    apiCall<import('../types/fuel').ReviewCounts>(
      `/fleets/${fleetId}/fuel-review/counts`),

  listUnmatched: (fleetId: string, batchId?: string) =>
    apiCall<import('../types/fuel').UnmatchedPlateGroup[]>(
      `/fleets/${fleetId}/fuel-review/unmatched-plates${batchId ? `?batchId=${batchId}` : ''}`),

  createTruck: (fleetId: string, normalizedPlate: string, body: {
    plateNumber: string; type: string; capacityKg: number; cargoVolumeM3: number;
  }) =>
    apiCall<{ truck: unknown; relinkedFuelEntryCount: number }>(
      `/fleets/${fleetId}/fuel-review/unmatched-plates/${encodeURIComponent(normalizedPlate)}/create-truck`,
      { method: 'POST', body: JSON.stringify({ ...body, fleetId }) }),

  alias: (fleetId: string, normalizedPlate: string, canonicalPlate: string) =>
    apiCall<{ relinkedCount: number }>(
      `/fleets/${fleetId}/fuel-review/unmatched-plates/${encodeURIComponent(normalizedPlate)}/alias`,
      { method: 'POST', body: JSON.stringify({ canonicalPlate }) }),

  subcontractor: (fleetId: string, normalizedPlate: string) =>
    apiCall<{ affectedCount: number }>(
      `/fleets/${fleetId}/fuel-review/unmatched-plates/${encodeURIComponent(normalizedPlate)}/subcontractor`,
      { method: 'POST' }),

  dismiss: (fleetId: string, normalizedPlate: string, batchId: string) =>
    apiCall<{ affectedCount: number }>(
      `/fleets/${fleetId}/fuel-review/unmatched-plates/${encodeURIComponent(normalizedPlate)}/dismiss?batchId=${batchId}`,
      { method: 'POST' }),

  listDuplicates: (fleetId: string, batchId?: string) =>
    apiCall<import('../types/fuel').PossibleDuplicatePair[]>(
      `/fleets/${fleetId}/fuel-review/possible-duplicates${batchId ? `?batchId=${batchId}` : ''}`),

  confirmDuplicate: (fleetId: string, entryId: string) =>
    apiCall<void>(
      `/fleets/${fleetId}/fuel-review/possible-duplicates/${entryId}/confirm`,
      { method: 'POST' }),

  dismissDuplicate: (fleetId: string, entryId: string) =>
    apiCall<void>(
      `/fleets/${fleetId}/fuel-review/possible-duplicates/${entryId}/dismiss`,
      { method: 'POST' }),
};

// Invoice API — fleet is derived from JWT
export const invoiceApi = {
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/invoices?page=${page}&size=${size}`),
};
