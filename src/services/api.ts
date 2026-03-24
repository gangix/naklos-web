import keycloak from '../auth/keycloak';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

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

// Fleet API
export const fleetApi = {
  create: (data: any) =>
    apiCall('/fleets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getById: (id: string) => apiCall(`/fleets/${id}`),
};

// Trip API
export const tripApi = {
  // Trip Creation
  createPlanned: (data: any, fleetId: string) =>
    apiCall(`/trips/planned?fleetId=${fleetId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createPodFirst: (data: any, fleetId: string) =>
    apiCall(`/trips/pod-first?fleetId=${fleetId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Trip Lifecycle Management
  assignDriverAndTruck: (tripId: string, data: { driverId: string; truckId: string }) =>
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
  getByFleet: (fleetId: string, status?: string) =>
    apiCall(`/trips?fleetId=${fleetId}${status ? `&status=${status}` : ''}`),
  getUnassigned: (fleetId: string) =>
    apiCall(`/trips/unassigned?fleetId=${fleetId}`),
  getPendingApproval: (fleetId: string) =>
    apiCall(`/trips/pending-approval?fleetId=${fleetId}`),
  getReadyForInvoice: (fleetId: string, clientId?: string) =>
    apiCall(`/trips/ready-for-invoice?fleetId=${fleetId}${clientId ? `&clientId=${clientId}` : ''}`),
  getByDriver: (driverId: string, fleetId: string) =>
    apiCall(`/trips/by-driver/${driverId}?fleetId=${fleetId}`),
  getByClient: (clientId: string, fleetId: string) =>
    apiCall(`/trips/by-client/${clientId}?fleetId=${fleetId}`),
};

// Client API
export const clientApi = {
  add: (data: any) =>
    apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (fleetId: string) =>
    apiCall(`/clients/fleet/${fleetId}`),
  getById: (id: string) => apiCall(`/clients/${id}`),
};

// Driver API
export const driverApi = {
  getMe: () => apiCall<any>('/drivers/me'),
  register: (data: any) =>
    apiCall('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (fleetId: string) =>
    apiCall(`/drivers/fleet/${fleetId}`),
  getAvailable: (fleetId: string) =>
    apiCall(`/drivers/fleet/${fleetId}/available`),
  getById: (id: string) => apiCall(`/drivers/${id}`),
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
  uploadDocument: async (driverId: string, file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    const headers: Record<string, string> = {};
    if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;

    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
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
};

// Truck API
export const truckApi = {
  register: (data: any) =>
    apiCall('/trucks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (fleetId: string) =>
    apiCall(`/trucks/fleet/${fleetId}`),
  getAvailable: (fleetId: string) =>
    apiCall(`/trucks/fleet/${fleetId}/available`),
  getById: (id: string) => apiCall(`/trucks/${id}`),
  updateDocuments: (id: string, data: any) =>
    apiCall(`/trucks/${id}/documents`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadDocument: async (truckId: string, file: File, documentType: string, expiryDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    const headers: Record<string, string> = {};
    if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;

    const response = await fetch(`${API_BASE_URL}/trucks/${truckId}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
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
};

// Trip Template API
export const tripTemplateApi = {
  getByFleet: (fleetId: string) =>
    apiCall(`/trip-templates?fleetId=${fleetId}`),
  create: (fleetId: string, data: {
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
    apiCall(`/trip-templates?fleetId=${fleetId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall(`/trip-templates/${id}`, { method: 'DELETE' }),
};

// Invoice API
export const invoiceApi = {
  create: (data: { clientId: string; clientName: string; tripIds: string[]; dueDate: string }, fleetId: string) =>
    apiCall('/invoices?fleetId=' + fleetId, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByFleet: (fleetId: string) =>
    apiCall(`/invoices?fleetId=${fleetId}`),
  getById: (id: string) =>
    apiCall(`/invoices/${id}`),
  markAsPaid: (id: string, paymentDate: string) =>
    apiCall(`/invoices/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paymentDate }),
    }),
};