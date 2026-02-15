/**
 * Domain types for Naklos fleet management
 */

export type TruckStatus = 'available' | 'in-transit' | 'maintenance';
export type DriverStatus = 'available' | 'on-trip' | 'off-duty';
export type TripStatus = 'assigned' | 'in-transit' | 'delivered';
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
  assignedDriverId: string | null;
  assignedDriverName?: string;
  currentTripId: string | null;
  lastPosition?: {
    lat: number;
    lng: number;
    city: string;
  };
  monthlyRevenue: number;
  tripCount: number;
  utilizationRate: number;
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
  clientId: string;
  clientName: string;
  truckId: string;
  truckPlate: string;
  driverId: string;
  driverName: string;
  originCity: string;
  destinationCity: string;
  status: TripStatus;
  revenue: number;
  expenses: TripExpenses;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedArrival: string | null;
}

export interface TripExpenses {
  fuel: number;
  tolls: number;
  driverFee: number;
  other: number;
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

export interface Warning {
  id: string;
  type: 'overdue-invoice' | 'license-expiring' | 'document-expiring';
  message: string;
  severity: 'info' | 'warning' | 'error';
  relatedId: string;
  relatedType: 'client' | 'driver' | 'truck';
}
