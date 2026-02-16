# Frontend Updates for POD-First Workflow

**Date:** 2026-02-15
**Status:** In Progress (TypeScript errors need fixing)

---

## Changes Implemented

### 1. Updated Type System (`src/types/index.ts`)

#### Extended TripStatus enum:
```typescript
// Old:
export type TripStatus = 'assigned' | 'in-transit' | 'delivered';

// New:
export type TripStatus = 'created' | 'assigned' | 'in-transit' | 'delivered' | 'pending-approval' | 'approved' | 'invoiced' | 'cancelled';
```

#### Enhanced Trip interface:
Added new fields to support dual-flow POD-first workflow:
- `cargoDescription: string | null` - Nullable for unplanned trips
- `revenue: number | null` - Nullable until manager approves
- `deliveredAt: string | null` - When POD was uploaded
- `approvedByManager: boolean` - True after manager approves
- `approvedAt: string | null` - Approval timestamp
- `isPlanned: boolean` - True = Flow A (planned), False = Flow B (POD-first)
- `driverEnteredDestination: string | null` - Free-text if driver doesn't know client
- Made clientId, clientName, truckId, truckPlate, driverId, driverName nullable for unassigned/unplanned trips

#### Added TripTemplate interface:
```typescript
export interface TripTemplate {
  id: string;
  fleetId: string;
  name: string;
  clientId: string;
  clientName: string;
  originCity: string;
  destinationCity: string;
  recurrence: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: string[];
  dayOfMonth?: number;
  preferredTruckId?: string | null;
  preferredDriverId?: string | null;
  typicalCargoDescription?: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
}
```

---

### 2. Redesigned TripsPage (`src/pages/TripsPage.tsx`)

**Old workflow:** 2 tabs (Active, Fatura Hazır)

**New workflow:** 3 tabs matching the dual-flow spec:

#### Tab 1: Planlanmış (Planned Trips)
- Shows trips with `isPlanned = true` and status = created, assigned, in-transit, delivered
- Filters out trips already approved by manager
- Action buttons based on status:
  - `created` → "Sürücü Ata"
  - `assigned` → "Başlat"
  - `in-transit` → "Devam Ediyor"
  - `delivered` (no docs) → "📸 Belge Yükle"
  - `delivered` (with docs) → "✅ Onayla"

#### Tab 2: Onay Bekliyor (Pending Approval)
- Shows trips with status = `pending-approval` OR (`delivered` AND `!approvedByManager`)
- Must have `deliveryDocuments.length > 0`
- Displays:
  - POD upload count
  - Driver-entered destination (if free-text)
  - Delivery timestamp
- Action button: "👁 İncele ve Onayla"

#### Tab 3: Fatura Hazır (Ready to Invoice)
- Shows trips with status = `approved` AND `approvedByManager = true` AND `!invoiced`
- Multi-select checkboxes for same-client trips
- Bottom action bar: "📄 Fatura Oluştur"
- Creates invoice and marks trips as `invoiced` with status = `invoiced`

---

### 3. Updated Dashboard (`src/pages/DashboardPage.tsx`)

#### Added Pending Approval Banner
- Shows orange alert banner if `pendingApprovalCount > 0`
- Counts trips with:
  - `status = 'pending-approval'` OR
  - (`status = 'delivered'` AND `!approvedByManager`)
  - AND `deliveryDocuments.length > 0`
- Click navigates to Trips page (Onay Bekliyor tab)
- Banner appears between header and main cards

#### Updated Revenue Calculation
- Changed `trip.revenue` to `trip.revenue || 0` to handle nullable revenue

---

### 4. Updated Mock Data (`src/data/mock/trips.ts`)

Created comprehensive mock data covering all statuses:

#### Planned Trips (Flow A):
1. **trip-created-1** - Status: `created`, waiting for driver assignment
2. **trip-assigned-1** - Status: `assigned`, driver assigned but not started
3. **trip-1, trip-2** - Status: `in-transit`, active deliveries

#### Pending Approval Trips (Flow B):
4. **trip-pending-1** - Status: `pending-approval`, driver didn't know client (free-text destination)
5. **trip-pending-2** - Status: `pending-approval`, driver selected client
6. **trip-delivered-1** - Status: `delivered`, planned trip awaiting manager approval

#### Approved Trips (Ready to Invoice):
7. **trip-approved-1, trip-approved-2** - Status: `approved`, same client (Marmara İnşaat), ready for consolidated invoice
8. **trip-approved-3** - Status: `approved`, different client

#### Invoiced Trips:
9. **trip-invoiced-1** - Status: `invoiced`, already included in invoice

**Total:** 11 trips demonstrating all workflow states

---

## Remaining Issues (TypeScript Errors)

### Files with nullable field errors:
1. `src/pages/InvoiceCreatePage.tsx` - Needs null checks for trip.clientId, trip.clientName, trip.revenue
2. `src/pages/InvoiceDetailPage.tsx` - Needs null check for trip.revenue
3. `src/pages/TripDetailPage.tsx` - Needs null check for trip.revenue
4. `src/utils/invoicePdf.ts` - Needs null checks for trip.clientName, trip.revenue

### Required Fixes:
- Add null coalescing operators (`trip.revenue || 0`)
- Add conditional rendering for nullable fields
- Filter out trips with null required fields before invoice generation

---

## Next Steps

1. **Fix TypeScript errors** (30 minutes):
   - Update InvoiceCreatePage to handle nullable trip fields
   - Update InvoiceDetailPage to handle nullable revenue
   - Update TripDetailPage to handle nullable revenue
   - Update invoicePdf.ts to handle nullable fields

2. **Update TripDetailPage** (1 hour):
   - Add manager approval form for pending trips
   - Show cargo description, pricing, costs input fields
   - Add "Approve Trip" button
   - Update trip to `approved` status on submission

3. **Add Recurring Templates Page** (optional - 2 hours):
   - Create `/templates` route
   - List all recurring templates
   - CRUD operations for templates
   - "Generate Trip Now" button

4. **Test End-to-End Workflow** (30 minutes):
   - Create planned trip → assign driver → start → deliver → upload POD → approve → invoice
   - Create unplanned trip (POD-first) → manager reviews → approves → invoice
   - Test multi-trip invoice generation

5. **Deploy to GitHub Pages**:
   - Build and deploy updated version
   - Verify all tabs work correctly

---

## Success Criteria

- [ ] All TypeScript errors resolved
- [ ] All 3 tabs display correctly in Trips page
- [ ] Pending approval banner shows on dashboard when trips need review
- [ ] Manager can approve pending trips (need to implement approval form)
- [ ] Multi-trip invoice generation works for approved trips
- [ ] App builds and deploys successfully

---

**Last Updated:** 2026-02-15
**Status:** Types and mock data updated, TypeScript errors need fixing
