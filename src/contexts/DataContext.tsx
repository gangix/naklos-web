import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Trip, Invoice } from '../types';
import { mockTrips as initialTrips, mockInvoices as initialInvoices } from '../data/mock';

interface DataContextType {
  trips: Trip[];
  invoices: Invoice[];
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  addTrip: (trip: Trip) => void;
  addInvoice: (invoice: Invoice) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
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

  return (
    <DataContext.Provider value={{ trips, invoices, updateTrip, addTrip, addInvoice }}>
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
