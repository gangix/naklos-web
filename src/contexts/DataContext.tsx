import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { tripApi, invoiceApi } from '../services/api';
import { useFleet } from './FleetContext';
import { useAuth } from './AuthContext';
import type { Trip, Invoice, TruckAssignmentRequest } from '../types';
// Using real API - no mock data
const initialTrips: any[] = [];
const initialInvoices: any[] = [];
const initialTruckRequests: any[] = [];

interface DataContextType {
  trips: Trip[];
  invoices: Invoice[];
  truckAssignmentRequests: TruckAssignmentRequest[];
  refreshTrips: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  addTrip: (trip: Trip) => void;
  addInvoice: (invoice: Invoice) => void;
  requestTruckAssignment: (request: Omit<TruckAssignmentRequest, 'id' | 'requestedAt' | 'status' | 'reviewedAt' | 'reviewedBy' | 'assignedTruckId' | 'assignedTruckPlate'>) => void;
  approveTruckRequest: (id: string, assignedTruckId: string, assignedTruckPlate: string) => void;
  rejectTruckRequest: (id: string, note: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { fleetId } = useFleet();
  const { isFleetManager } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [truckAssignmentRequests, setTruckAssignmentRequests] = useState<TruckAssignmentRequest[]>(initialTruckRequests);

  // Load trips and invoices from backend - only for managers (drivers use their own endpoints)
  useEffect(() => {
    if (fleetId && isFleetManager) {
      loadTrips();
      loadInvoices();
    }
  }, [fleetId, isFleetManager]);

  const loadTrips = async () => {
    if (!fleetId) return;
    try {
      const page = await tripApi.getByFleet(undefined, 0, 1000);
      setTrips(page.content);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadInvoices = async () => {
    if (!fleetId) return;
    try {
      const page = await invoiceApi.getByFleet(0, 1000);
      const data: any[] = page.content;
      // Map backend response to frontend Invoice shape
      setInvoices(data.map((inv: any) => ({
        id: inv.id,
        fleetId: inv.fleetId,
        clientId: inv.clientId,
        clientName: inv.clientName,
        tripIds: inv.tripIds,
        amount: inv.amount?.amount ?? 0,
        status: inv.status?.toLowerCase() as any,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate ?? null,
      })));
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
    // Optimistic update - update local state immediately
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    );
  };

  const addTrip = (trip: Trip) => {
    setTrips((prev) => [...prev, trip]);
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
  };

  const requestTruckAssignment = (request: Omit<TruckAssignmentRequest, 'id' | 'requestedAt' | 'status' | 'reviewedAt' | 'reviewedBy' | 'assignedTruckId' | 'assignedTruckPlate'>) => {
    const newRequest: TruckAssignmentRequest = {
      ...request,
      id: `truck-req-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      assignedTruckId: null,
      assignedTruckPlate: null,
      rejectionNote: null,
    };
    setTruckAssignmentRequests((prev) => [newRequest, ...prev]);
    // TODO: Send push notification to manager
  };

  const approveTruckRequest = (id: string, assignedTruckId: string, assignedTruckPlate: string) => {
    setTruckAssignmentRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'approved' as const,
              assignedTruckId,
              assignedTruckPlate,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Fleet Manager',
            }
          : req
      )
    );
    // TODO: Update actual driver.assignedTruckId and truck.currentDriverId
    // TODO: Send push notification to driver
  };

  const rejectTruckRequest = (id: string, note: string) => {
    setTruckAssignmentRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'rejected' as const,
              rejectionNote: note,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Fleet Manager',
            }
          : req
      )
    );
    // TODO: Send push notification to driver with rejection note
  };

  return (
    <DataContext.Provider
      value={{
        trips,
        invoices,
        truckAssignmentRequests,
        refreshTrips: loadTrips,
        refreshInvoices: loadInvoices,
        updateTrip,
        addTrip,
        addInvoice,
        requestTruckAssignment,
        approveTruckRequest,
        rejectTruckRequest,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
