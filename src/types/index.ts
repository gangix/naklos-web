/**
 * Domain types for Naklos fleet management
 */

export type TruckStatus = 'available' | 'in-transit' | 'maintenance';
export type DriverStatus = 'available' | 'on-trip' | 'off-duty';
export type TripStatus = 'CREATED' | 'IN_PROGRESS' | 'DELIVERED' | 'APPROVED' | 'INVOICED' | 'CANCELLED';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type PaymentReliability = 'good' | 'moderate' | 'poor';

export interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  taxId: string;
  city: string;
  phone: string;
  email: string;
}

export interface Truck {
  id: string;
  fleetId: string;
  plateNumber: string;
  type: string;
  status: TruckStatus;
  currentDriverId: string | null;
  assignedDriverName?: string;
  currentTripId: string | null;
  lastPosition?: {
    lat: number;
    lng: number;
    city: string;
    updatedAt: string | null;
  };
  monthlyRevenue: number;
  tripCount: number;
  utilizationRate: number;
  compulsoryInsuranceExpiry: string | null;
  comprehensiveInsuranceExpiry: string | null;
  inspectionExpiry: string | null;
  /** Rolling L/100km average auto-computed from recent fuel entries. Null
   *  when the truck has too little history for a stable baseline. */
  expectedLPer100KmDerived: number | null;
  /** Fleet-manager-entered L/100km target. Null = not set. */
  expectedLPer100KmManual: number | null;
}

export interface Driver {
  id: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiryDate: string;
  status: DriverStatus;
  assignedTruckId: string | null;
  assignedTruckPlate?: string;
  inviteStatus?: 'NOT_INVITED' | 'PENDING' | 'SENT' | 'FAILED';
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  certificates: ProfessionalCertificate[];
}

export interface Client {
  id: string;
  fleetId: string;
  companyName: string;
  taxId: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
  avgPaymentDays: number;
  paymentReliability: PaymentReliability;
}

export interface Trip {
  id: string;
  fleetId: string;
  clientId: string | null; // nullable for unplanned trips initially
  clientName: string | null;
  truckId: string | null; // nullable for unassigned trips
  truckPlate: string | null;
  driverId: string | null; // nullable for unassigned trips
  driverName: string | null;
  originCity: string;
  destinationCity: string;
  cargoDescription: string | null; // nullable for unplanned trips
  status: TripStatus;
  revenue: Money | null; // nullable until manager approves
  expenses: TripExpenses;
  netProfit: Money | null; // calculated by backend
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  deliveredAt: string | null; // when POD was uploaded
  estimatedArrival: string | null;
  deliveryDocuments: Document[];
  documentsConfirmed: boolean;
  approvedAt: string | null;
  invoiceId: string | null;
  isPlanned: boolean; // true = Flow A (planned), false = Flow B (POD-first)
  driverEnteredDestination: string | null; // free-text if driver doesn't know client
}

export interface Money {
  amount: number;
  currency: string;
}

export interface TripExpenses {
  fuel: Money;
  tolls: Money;
  other: Money;
  otherReason?: string;
  total: Money;
}

export interface Invoice {
  id: string;
  fleetId: string;
  clientId: string;
  clientName: string;
  tripIds: string[];
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
}

export interface DashboardStats {
  monthlyRevenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  monthlyProfit: number;
  activeTrips: number;
  availableTrucks: number;
  availableDrivers: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'delivery-confirmation' | 'other';
  mimeType: string;
  dataUrl: string; // base64 encoded — used for previews
  uploadedAt: string;
  size: number;
  rawFile?: File; // original File handle, used when uploading multipart to the backend
}

export interface ProfessionalCertificate {
  id: string;
  type: 'SRC' | 'CPC';
  number: string;
  issueDate: string;
  expiryDate: string;
}

export interface Warning {
  id: string;
  type: 'overdue-invoice' | 'license-expiring' | 'document-expiring'
       | 'insurance-expiring' | 'inspection-expiring' | 'certificate-expiring';
  message: string;
  severity: 'info' | 'warning' | 'error';
  relatedId: string;
  relatedType: 'client' | 'driver' | 'truck';
}

export interface TripTemplate {
  id: string;
  fleetId: string;
  name: string; // e.g., "Weekly Istanbul Delivery to Client-A"
  clientId: string;
  clientName: string;
  originCity: string;
  destinationCity: string;
  recurrence: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: string[]; // ['MON', 'WED', 'FRI']
  dayOfMonth?: number;
  preferredTruckId?: string | null;
  preferredDriverId?: string | null;
  typicalCargoDescription?: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
}

// Document Management Types
export type DocumentSubmissionStatus = 'pending' | 'approved' | 'rejected';
export type DocumentCategory = 'license' | 'src' | 'cpc' | 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';

export interface DocumentSubmission {
  id: string;
  category: DocumentCategory;
  relatedType: 'driver' | 'truck';
  relatedId: string; // driverId or truckId
  relatedName: string; // driver name or truck plate
  submittedBy: 'driver' | 'manager';
  submittedByName: string;
  imageDataUrl: string; // base64 photo
  suggestedExpiryDate: string;
  confirmedExpiryDate: string | null; // set by manager on approval
  status: DocumentSubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null; // predefined code
  rejectionNote: string | null; // free text (required for 'other')
  previousImageDataUrl: string | null; // for side-by-side comparison
  previousExpiryDate: string | null;
}

// Truck Assignment Request Types
export type AssignmentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TruckAssignmentRequest {
  id: string;
  driverId: string;
  driverName: string;
  preferredTruckId: string;
  preferredTruckPlate: string;
  assignedTruckId: string | null; // may differ from preferred
  assignedTruckPlate: string | null;
  status: AssignmentRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionNote: string | null;
}
