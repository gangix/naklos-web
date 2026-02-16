import type { TruckAssignmentRequest } from '../../types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

export const mockTruckAssignmentRequests: TruckAssignmentRequest[] = [
  // Pending request from driver-5
  {
    id: 'truck-req-1',
    driverId: 'driver-5',
    driverName: 'Ayşe Yıldız',
    preferredTruckId: 'truck-6',
    preferredTruckPlate: '35 XYZ 789',
    assignedTruckId: null,
    assignedTruckPlate: null,
    status: 'pending',
    requestedAt: yesterday.toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionNote: null,
  },

  // Approved request (manager assigned different truck)
  {
    id: 'truck-req-2',
    driverId: 'driver-4',
    driverName: 'Fatma Şahin',
    preferredTruckId: 'truck-5',
    preferredTruckPlate: '07 MNO 345',
    assignedTruckId: 'truck-4', // Manager assigned different truck
    assignedTruckPlate: '06 JKL 012',
    status: 'approved',
    requestedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Fleet Manager',
    rejectionNote: null,
  },
];
