import type { Driver } from '../../types';

// Helper to calculate dates
const today = new Date();
const fiveDaysFromNow = new Date(today);
fiveDaysFromNow.setDate(today.getDate() + 5);
const nextYear = new Date(today);
nextYear.setFullYear(today.getFullYear() + 1);
const sixMonthsFromNow = new Date(today);
sixMonthsFromNow.setMonth(today.getMonth() + 6);
const twoYearsFromNow = new Date(today);
twoYearsFromNow.setFullYear(today.getFullYear() + 2);
const threeMonthsFromNow = new Date(today);
threeMonthsFromNow.setMonth(today.getMonth() + 3);
const tenDaysFromNow = new Date(today);
tenDaysFromNow.setDate(today.getDate() + 10);
const twentyDaysFromNow = new Date(today);
twentyDaysFromNow.setDate(today.getDate() + 20);
const oneYearAgo = new Date(today);
oneYearAgo.setFullYear(today.getFullYear() - 1);
const twoYearsAgo = new Date(today);
twoYearsAgo.setFullYear(today.getFullYear() - 2);

export const mockDrivers: Driver[] = [
  // On-trip drivers (8)
  {
    id: 'driver-1',
    fleetId: 'fleet-1',
    firstName: 'Mehmet',
    lastName: 'Yılmaz',
    phone: '+90 532 111 1111',
    email: 'mehmet.yilmaz@example.com',
    licenseNumber: 'M123456',
    licenseClass: 'C+E',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-1',
    assignedTruckPlate: '34 ABC 123',
    emergencyContact: {
      name: 'Ayşe Yılmaz',
      phone: '+90 532 111 2222',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-001',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2023-001',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: tenDaysFromNow.toISOString().split('T')[0], // EXPIRING SOON
      },
    ],
  },
  {
    id: 'driver-2',
    fleetId: 'fleet-1',
    firstName: 'Ali',
    lastName: 'Demir',
    phone: '+90 532 222 2222',
    email: 'ali.demir@example.com',
    licenseNumber: 'A789012',
    licenseClass: 'C',
    licenseExpiryDate: sixMonthsFromNow.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-2',
    assignedTruckPlate: '34 DEF 456',
    emergencyContact: {
      name: 'Fatma Demir',
      phone: '+90 532 222 3333',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-002',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-3',
    fleetId: 'fleet-1',
    firstName: 'Hasan',
    lastName: 'Kaya',
    phone: '+90 532 333 3333',
    email: 'hasan.kaya@example.com',
    licenseNumber: 'H345678',
    licenseClass: 'C+E',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-3',
    assignedTruckPlate: '06 GHI 789',
    emergencyContact: {
      name: 'Zeynep Kaya',
      phone: '+90 532 333 4444',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2023-003',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: fiveDaysFromNow.toISOString().split('T')[0], // EXPIRING VERY SOON
      },
      {
        type: 'CPC',
        number: 'CPC-2024-003',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-4',
    fleetId: 'fleet-1',
    firstName: 'Fatih',
    lastName: 'Özkan',
    phone: '+90 532 444 4444',
    email: 'fatih.ozkan@example.com',
    licenseNumber: 'F901234',
    licenseClass: 'C+E',
    licenseExpiryDate: fiveDaysFromNow.toISOString().split('T')[0], // EXPIRING SOON - WARNING
    status: 'on-trip',
    assignedTruckId: 'truck-4',
    assignedTruckPlate: '34 JKL 012',
    emergencyContact: {
      name: 'Elif Özkan',
      phone: '+90 532 444 5555',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-004',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2023-004',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: twentyDaysFromNow.toISOString().split('T')[0], // EXPIRING SOON
      },
    ],
  },
  {
    id: 'driver-5',
    fleetId: 'fleet-1',
    firstName: 'Emre',
    lastName: 'Şahin',
    phone: '+90 532 555 5555',
    email: 'emre.sahin@example.com',
    licenseNumber: 'E567890',
    licenseClass: 'C',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-5',
    assignedTruckPlate: '06 MNO 345',
    emergencyContact: {
      name: 'Selin Şahin',
      phone: '+90 532 555 6666',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-005',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-6',
    fleetId: 'fleet-1',
    firstName: 'Mustafa',
    lastName: 'Aydın',
    phone: '+90 532 666 6666',
    email: 'mustafa.aydin@example.com',
    licenseNumber: 'M123789',
    licenseClass: 'C+E',
    licenseExpiryDate: sixMonthsFromNow.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-6',
    assignedTruckPlate: '35 PQR 678',
    emergencyContact: {
      name: 'Merve Aydın',
      phone: '+90 532 666 7777',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2023-006',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2024-006',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-7',
    fleetId: 'fleet-1',
    firstName: 'Kemal',
    lastName: 'Arslan',
    phone: '+90 532 777 7777',
    email: 'kemal.arslan@example.com',
    licenseNumber: 'K456123',
    licenseClass: 'C+E',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-7',
    assignedTruckPlate: '16 STU 901',
    emergencyContact: {
      name: 'Ayşe Arslan',
      phone: '+90 532 777 8888',
      relationship: 'Anne',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-007',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2023-007',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-8',
    fleetId: 'fleet-1',
    firstName: 'Oğuz',
    lastName: 'Yıldırım',
    phone: '+90 532 888 8888',
    email: 'oguz.yildirim@example.com',
    licenseNumber: 'O789456',
    licenseClass: 'C',
    licenseExpiryDate: sixMonthsFromNow.toISOString().split('T')[0],
    status: 'on-trip',
    assignedTruckId: 'truck-8',
    assignedTruckPlate: '34 VWX 234',
    emergencyContact: {
      name: 'Deniz Yıldırım',
      phone: '+90 532 888 9999',
      relationship: 'Kardeş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-008',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },

  // Available drivers (3)
  {
    id: 'driver-9',
    fleetId: 'fleet-1',
    firstName: 'Serkan',
    lastName: 'Çelik',
    phone: '+90 532 999 9999',
    email: 'serkan.celik@example.com',
    licenseNumber: 'S012345',
    licenseClass: 'C+E',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'available',
    assignedTruckId: 'truck-9',
    assignedTruckPlate: '34 YZA 567',
    emergencyContact: {
      name: 'Elif Çelik',
      phone: '+90 532 999 0000',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-009',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2024-009',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-10',
    fleetId: 'fleet-1',
    firstName: 'Burak',
    lastName: 'Koç',
    phone: '+90 532 101 0101',
    email: 'burak.koc@example.com',
    licenseNumber: 'B345678',
    licenseClass: 'C',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'available',
    assignedTruckId: 'truck-10',
    assignedTruckPlate: '06 BCD 890',
    emergencyContact: {
      name: 'Ahmet Koç',
      phone: '+90 532 101 0202',
      relationship: 'Baba',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-010',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'driver-11',
    fleetId: 'fleet-1',
    firstName: 'Deniz',
    lastName: 'Güneş',
    phone: '+90 532 202 0202',
    email: 'deniz.gunes@example.com',
    licenseNumber: 'D678901',
    licenseClass: 'C+E',
    licenseExpiryDate: sixMonthsFromNow.toISOString().split('T')[0],
    status: 'available',
    assignedTruckId: 'truck-11',
    assignedTruckPlate: '35 EFG 123',
    emergencyContact: {
      name: 'Cem Güneş',
      phone: '+90 532 202 0303',
      relationship: 'Kardeş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2023-011',
        issueDate: twoYearsAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
      {
        type: 'CPC',
        number: 'CPC-2024-011',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: twoYearsFromNow.toISOString().split('T')[0],
      },
    ],
  },

  // Off-duty (1)
  {
    id: 'driver-12',
    fleetId: 'fleet-1',
    firstName: 'Can',
    lastName: 'Polat',
    phone: '+90 532 303 0303',
    email: 'can.polat@example.com',
    licenseNumber: 'C901234',
    licenseClass: 'C',
    licenseExpiryDate: nextYear.toISOString().split('T')[0],
    status: 'off-duty',
    assignedTruckId: null,
    assignedTruckPlate: undefined,
    emergencyContact: {
      name: 'Aylin Polat',
      phone: '+90 532 303 0404',
      relationship: 'Eş',
    },
    certificates: [
      {
        type: 'SRC',
        number: 'SRC-2024-012',
        issueDate: oneYearAgo.toISOString().split('T')[0],
        expiryDate: nextYear.toISOString().split('T')[0],
      },
    ],
  },
];
