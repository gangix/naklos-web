# Driver Self-Assignment Workflow Spec

## Status Flow

```
created → in-progress → delivered → approved → invoiced
```

| Status | Meaning |
|--------|---------|
| `created` | Trip exists, no driver assigned. Visible to all drivers as "available". |
| `in-progress` | Driver self-assigned (+ truck selected). En route to destination. |
| `delivered` | POD uploaded. This IS the "pending approval" state. Waiting for fleet manager to review, fill details, and approve. |
| `approved` | Fleet manager approved. Ready for invoicing. |
| `invoiced` | Invoice created for this trip. |

**Removed statuses:** `assigned` (replaced by `in-progress`), `pending-approval` (merged into `delivered`).

---

## Driver Capabilities

### Self-Assign to Trip
- Driver sees all unassigned trips (`status === 'created'`, `driverId === null`)
- On self-assign: driver selects **themselves + a truck** from available trucks
- Trip status changes: `created` → `in-progress`
- Trip fields set: `driverId`, `driverName`, `truckId`, `truckPlate`

### Unassign from Trip
- Driver can unassign from **both** `created` and `in-progress` trips
- Cannot unassign once status is `delivered` (POD uploaded)
- On unassign: **both driver and truck are cleared**, trip reverts to `created`
- Trip fields cleared: `driverId → null`, `driverName → null`, `truckId → null`, `truckPlate → null`

### Upload POD (Proof of Delivery)
- Driver uploads delivery documents (max 3)
- Trip status changes: `in-progress` → `delivered`
- Sets `deliveredAt` timestamp

### Create Trip (POD-First / Unplanned)
- Driver can create a trip to upload POD when no pre-existing trip exists
- Goes **directly to `delivered`** status (skips created/in-progress)
- Driver provides: destination address, delivery documents
- Manager fills remaining details later (client, revenue, cargo, etc.)

### Financial Visibility
- Driver sees **expenses only** (fuel, tolls, other)
- Driver does **NOT** see revenue or profit

---

## Fleet Manager Capabilities

### Trip Management
- Can create trips (status = `created`)
- Can **always override/reassign** driver and truck regardless of driver's self-assignment
- Can fill missing details: client, cargo description, revenue, expenses
- Sees **full financial details** (revenue, expenses, profit)

### Approval
- Reviews `delivered` trips (POD + details)
- Validates all required fields before approving
- Approves: `delivered` → `approved`
- Creates invoices from `approved` trips

---

## Driver Trip Detail Page

**Separate component** (`DriverTripDetailPage`) - not the same as manager's `TripDetailPage`.

### Sections Visible to Driver:
1. **Route info** - origin/destination cities
2. **Trip info** - client name, cargo description (read-only)
3. **Truck info** - assigned truck plate (read-only after assignment)
4. **Expenses** - fuel, tolls, other (read-only, no revenue/profit)
5. **Delivery documents** - view uploaded PODs, upload new ones
6. **Timeline** - created, started, delivered timestamps

### Driver Actions on Detail Page:
- **"Seferi Al" (Take Trip)** button - visible on `created` trips with no driver
  - Opens truck selection, then assigns driver + truck, moves to `in-progress`
- **"Seferden Ayrıl" (Leave Trip)** button - visible on `created`/`in-progress` trips assigned to this driver
  - Clears driver + truck, reverts to `created`
- **"Teslimat Belgesi Yükle" (Upload POD)** button - visible on `in-progress` trips assigned to this driver
  - Upload documents, mark as `delivered`

---

## UI Changes Required

### Type Updates (`types/index.ts`)
- Update `TripStatus` to: `'created' | 'in-progress' | 'delivered' | 'approved' | 'invoiced' | 'cancelled'`
- Remove `'assigned'` and `'pending-approval'` from TripStatus

### DataContext Updates
- Add `addTrip` function for driver-created trips
- Update `updateTrip` to handle status transitions

### Pages to Create
- `DriverTripDetailPage` - new separate detail page for drivers

### Pages to Update
- `DriverDashboardPage` - update status references
- `DriverTripsPage` - update status references, add self-assign action
- `DriverTripCreatePage` - status should be `'delivered'` not `'pending-approval'`
- `TripDetailPage` (manager) - update status references, remove `pending-approval`
- `TripsPage` (manager) - update tab filters and status labels
- `DashboardPage` - update status references

### Mock Data Updates
- Update mock trips to use new statuses (`in-progress` instead of `assigned`/`in-transit`)
