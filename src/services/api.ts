import keycloak from '../auth/keycloak';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

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
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
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
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
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
  getMy: () => apiCall<any>('/fleets/my'),
  getById: (id: string) => apiCall(`/fleets/${id}`),
  update: (id: string, data: { name: string; address: any; email: string; phone: string }) =>
    apiCall(`/fleets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeCurrency: (id: string, currency: string) =>
    apiCall(`/fleets/${id}/currency`, { method: 'PUT', body: JSON.stringify({ currency }) }),
};

// Trip API — fleet is derived from JWT on the backend
export const tripApi = {
  // Trip Creation
  createPlanned: (data: any) =>
    apiCall('/trips/planned', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createPodFirst: (data: any) =>
    apiCall('/trips/pod-first', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Trip Lifecycle Management
  assignDriverAndTruck: (tripId: string, data: { driverId: string; driverName: string; truckId: string; truckPlate: string }) =>
    apiCall(`/trips/${tripId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  markInProgress: (tripId: string) =>
    apiCall(`/trips/${tripId}/start`, {
      method: 'PUT',
    }),
  markDelivered: (tripId: string, data: { deliveryLocation?: string; deliveryNotes?: string }) =>
    apiCall(`/trips/${tripId}/deliver`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approveTrip: (tripId: string, data: {
    clientId: string;
    clientName: string;
    cargoDescription?: string;
    revenueAmount: number;
    revenueCurrency: string;
  }) =>
    apiCall(`/trips/${tripId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancelTrip: (tripId: string, reason?: string) =>
    apiCall(`/trips/${tripId}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'DELETE',
    }),

  // Detail Updates
  updateDetails: (tripId: string, data: {
    originCity?: string;
    destinationCity?: string;
    cargoDescription?: string;
    revenueAmount?: number;
    revenueCurrency?: string;
  }) =>
    apiCall(`/trips/${tripId}/details`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Expense Management
  updateExpenses: (tripId: string, data: {
    fuelAmount: number;
    fuelCurrency: string;
    tollsAmount: number;
    tollsCurrency: string;
    otherAmount: number;
    otherCurrency: string;
    otherReason?: string;
  }) =>
    apiCall(`/trips/${tripId}/expenses`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Query Endpoints
  getById: (id: string) => apiCall(`/trips/${id}`),
  getByFleet: (status?: string, page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    return apiCall<PageResponse<any>>(`/trips?${params}`);
  },
  getUnassigned: () =>
    apiCall('/trips/unassigned'),
  getPendingApproval: () =>
    apiCall('/trips/pending-approval'),
  getReadyForInvoice: (clientId?: string) =>
    apiCall(`/trips/ready-for-invoice${clientId ? `?clientId=${clientId}` : ''}`),
  getByDriver: (driverId: string) =>
    apiCall(`/trips/by-driver/${driverId}`),
  getByClient: (clientId: string) =>
    apiCall(`/trips/by-client/${clientId}`),
};

// Client API — fleet is derived from JWT
export const clientApi = {
  add: (data: any) =>
    apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/clients?page=${page}&size=${size}`),
  getById: (id: string) => apiCall(`/clients/${id}`),
  update: (id: string, data: { email: string; phone: string; address: any }) =>
    apiCall(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePaymentTerms: (id: string, paymentTerms: string) =>
    apiCall(`/clients/${id}/payment-terms`, { method: 'PUT', body: JSON.stringify({ paymentTerms }) }),
  delete: (id: string) =>
    apiCall(`/clients/${id}`, { method: 'DELETE' }),
};

// Driver API — fleet is derived from JWT
export const driverApi = {
  getMe: () => apiCall<any>('/drivers/me'),
  register: (data: any) =>
    apiCall('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/drivers?page=${page}&size=${size}`),
  getAvailable: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/drivers?status=AVAILABLE&page=${page}&size=${size}`),
  bulkImport: (rows: any[]) =>
    apiCall<BulkImportResult>('/drivers/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    }),
  getById: (id: string) => apiCall(`/drivers/${id}`),
  update: (id: string, data: { firstName?: string; lastName?: string; phone?: string; email?: string; status?: string }) =>
    apiCall(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateEmergencyContact: (id: string, data: { name: string; phone: string; relationship: string }) =>
    apiCall(`/drivers/${id}/emergency-contact`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLicense: (id: string, expiryDate: string) =>
    apiCall(`/drivers/${id}/license`, {
      method: 'PUT',
      body: JSON.stringify({ expiryDate }),
    }),
  addCertificate: (id: string, data: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
  }) =>
    apiCall(`/drivers/${id}/certificates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeCertificate: (driverId: string, certificateId: string) =>
    apiCall(`/drivers/${driverId}/certificates/${certificateId}`, {
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
  downloadDocument: (documentId: string) => {
    window.open(`${API_BASE_URL}/drivers/documents/${documentId}/download`, '_blank');
  },
  deleteDocument: (documentId: string) =>
    apiCall(`/drivers/documents/${documentId}`, {
      method: 'DELETE',
    }),
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
    apiCall<PageResponse<any>>(`/trucks?page=${page}&size=${size}`),
  getAvailable: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/trucks?status=AVAILABLE&page=${page}&size=${size}`),
  bulkImport: (rows: any[]) =>
    apiCall<BulkImportResult>('/trucks/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    }),
  getById: (id: string) => apiCall(`/trucks/${id}`),
  updateDocuments: (id: string, data: any) =>
    apiCall(`/trucks/${id}/documents`, {
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
  downloadDocument: (documentId: string) => {
    window.open(`${API_BASE_URL}/trucks/documents/${documentId}/download`, '_blank');
  },
  deleteDocument: (documentId: string) =>
    apiCall(`/trucks/documents/${documentId}`, {
      method: 'DELETE',
    }),
  assignDriver: (truckId: string, driverId: string) =>
    apiCall(`/trucks/${truckId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    }),
  unassignDriver: (truckId: string) =>
    apiCall(`/trucks/${truckId}/unassign-driver`, {
      method: 'POST',
    }),
  updateStatus: (id: string, status: string) =>
    apiCall(`/trucks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
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

// Trip Template API — fleet is derived from JWT
export const tripTemplateApi = {
  getByFleet: () =>
    apiCall('/trip-templates'),
  create: (data: {
    name: string;
    originCity: string;
    destinationCity: string;
    clientId?: string;
    clientName?: string;
    cargoDescription?: string;
    typicalRevenueAmount?: number;
    typicalRevenueCurrency?: string;
    preferredTruckId?: string;
    preferredTruckPlate?: string;
    preferredDriverId?: string;
    preferredDriverName?: string;
  }) =>
    apiCall('/trip-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall(`/trip-templates/${id}`, { method: 'DELETE' }),
};

// Invoice API — fleet is derived from JWT
export const invoiceApi = {
  create: (data: { clientId: string; clientName: string; tripIds: string[]; dueDate: string }) =>
    apiCall('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (page = 0, size = 20) =>
    apiCall<PageResponse<any>>(`/invoices?page=${page}&size=${size}`),
  getById: (id: string) =>
    apiCall(`/invoices/${id}`),
  markAsPaid: (id: string, paymentDate: string) =>
    apiCall(`/invoices/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paymentDate }),
    }),
};
