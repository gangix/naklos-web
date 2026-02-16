# Dashboard and Navigation - Complete Specification

**Document Version:** 1.0
**Date:** 2026-02-15
**Status:** Approved Design Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Navigation Structure](#navigation-structure)
3. [Dashboard Layout](#dashboard-layout)
4. [Warning System](#warning-system)
5. [Statistics Display](#statistics-display)
6. [Responsive Behavior](#responsive-behavior)
7. [Edge Cases and Special States](#edge-cases-and-special-states)
8. [Performance Considerations](#performance-considerations)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Design Philosophy

The Naklos manager interface is designed as a **quick health check dashboard** with **context-aware navigation**. It prioritizes:

- **Actionable information**: Show only what needs attention
- **Minimal cognitive load**: Clean, focused interface
- **Smart contextual behavior**: Navigation adapts to user intent
- **Consistent patterns**: Same behavior across all sections

### Key Principles

1. **Mobile-first for drivers, desktop-optimized for managers**
2. **Real-time reactive updates** without manual refresh
3. **Direct navigation** to specific tabs when context is clear
4. **Progressive enhancement** - start minimal, add features as needed

---

## Navigation Structure

### Sidebar Menu Items

**Desktop (≥1024px):** Fixed left sidebar
**Mobile (<1024px):** Hamburger menu with slide-in drawer

#### Menu Structure

```
Naklos (Logo)
├─ 🏠 Ana Sayfa      (/manager/dashboard)
├─ 📦 Seferler       (/manager/trips)
├─ 🚛 Araçlar        (/manager/trucks)
├─ 👥 Sürücüler      (/manager/drivers)
├─ 📄 Faturalar      (/manager/invoices)
└─ 🏢 Müşteriler     (/manager/clients)

[User Profile] (Footer)
```

#### Removed Items

- **"Diğer" (More) menu item** - Removed entirely as main sections are already accessible

#### Responsive Widths

- **Large screens (≥1440px):** 240px sidebar (`w-60`)
- **Medium desktop (1024-1439px):** 200px sidebar (`w-50`)
- **Mobile (<1024px):** 288px drawer (`w-72`)

### Mobile Navigation Behavior

**Drawer Behavior:**
- Opens on hamburger tap
- **Closes immediately** when any menu item is tapped (standard mobile pattern)
- Closes on backdrop tap
- Closes on close button (X)
- Body scroll locked while open

---

## Dashboard Layout

### Overall Structure

```
┌─────────────────────────────────────┐
│ Ana Sayfa                           │
│ [Fleet Name]                        │
├─────────────────────────────────────┤
│                                     │
│ [Main Section Cards - with badges] │
│   - Seferler                        │
│   - Araçlar                         │
│   - Sürücüler                       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ İstatistikler (2-column grid)      │
│   - Bu Ay (Current Month)           │
│   - Geçen Ay (Last Month)          │
│                                     │
└─────────────────────────────────────┘
```

### Main Section Cards

Each card displays:

1. **Icon** (emoji with scale animation on hover)
2. **Section title** (e.g., "Seferler")
3. **Status information:**
   - If warnings exist: Show warning message (e.g., "2 sefer onay bekliyor")
   - Always show total count below (e.g., "Toplam 45 aktif sefer")
4. **Warning badge** (if applicable) - positioned absolutely at top-right

#### Card Specifications

**Desktop:**
- Full white background with shadow
- Border: `border border-gray-200`
- Padding: `p-6`
- Hover: Elevated shadow, icon scales to 110%
- Click: Navigate to respective section

**Mobile:**
- Same as desktop
- **Dynamic padding:** Add `pt-8` when warning badge exists (extra top padding)

#### Example Card States

**Seferler with warnings:**
```
┌─────────────────────────────────┐
│                            [ 2 ] │ ← Orange badge
│  📦  Seferler                    │
│                                  │
│  2 sefer onay bekliyor          │ ← Warning message (orange)
│  Toplam 45 aktif sefer          │ ← Total count (gray)
└─────────────────────────────────┘
```

**Araçlar all clear:**
```
┌─────────────────────────────────┐
│                                  │
│  🚛  Araçlar                     │
│                                  │
│  Tüm belgeler güncel            │ ← All clear message (gray)
│  Toplam 12 araç                 │ ← Total count (gray)
└─────────────────────────────────┘
```

---

## Warning System

### Warning Badge Design

#### Badge Sizes and Colors

**Small (1-9 items):**
- Size: `w-6 h-6` (24px)
- Font: `text-sm` (14px)
- Position: `absolute -top-2 -right-2`

**Medium (10-99 items):**
- Size: `w-8 h-8` (32px)
- Font: `text-sm font-bold`
- Position: `absolute -top-2 -right-2`

**Large (100+ items):**
- Size: `w-10 h-10` (40px)
- Font: `text-xs font-bold`
- Position: `absolute -top-3 -right-3`
- Shadow: `shadow-lg`

#### Badge Color Coding

- **Orange (`bg-orange-500`)**: Pending approvals (Seferler - trips awaiting review)
- **Red (`bg-red-500`)**: Critical warnings (Araçlar, Sürücüler - expired documents)

#### Badge Update Behavior

- **Real-time updates**: Badge count changes instantly when underlying data changes
- **No animation**: Numbers update instantly without transitions
- **Auto-removal**: Badge disappears when count reaches 0

### Warning Types

#### 1. Seferler (Trips)

**Counts:** Trips with `status: 'delivered'` AND `deliveryDocuments.length > 0`

**Badge:** Orange
**Message:** `{count} sefer onay bekliyor`

#### 2. Araçlar (Trucks)

**Counts:** Trucks with critical document warnings (`severity: 'error'`)
- Insurance expired or expiring within 7 days
- Inspection expired or expiring within 7 days

**Badge:** Red
**Message:** `{count} araç uyarısı var`

#### 3. Sürücüler (Drivers)

**Counts:** Drivers with critical document warnings (`severity: 'error'`)
- License expired or expiring within 7 days
- SRC certificate expired or expiring within 7 days

**Badge:** Red
**Message:** `{count} sürücü uyarısı var`

### Context-Aware Navigation

When a user clicks a section card with warnings, automatically navigate to the relevant tab:

- **Seferler card** → Navigate to `/manager/trips` with `tab=pending` query param
- **Araçlar card** → Navigate to `/manager/trucks` (warnings sorted to top, red border)
- **Sürücüler card** → Navigate to `/manager/drivers` (warnings sorted to top, red border)

---

## Statistics Display

### Layout

Two-column grid on all screen sizes:

```
┌──────────────────┬──────────────────┐
│   Bu Ay          │   Geçen Ay       │
│   (Current)      │   (Previous)     │
│                  │                  │
│   📅 Şubat Ayı   │   📅 Ocak Ayı    │
│   8 ↑            │   12             │
│   Tamamlanan     │   Tamamlanan     │
│   Sefer          │   Sefer          │
└──────────────────┴──────────────────┘
```

### Bu Ay (Current Month) Card

**Background:** `bg-gradient-to-br from-blue-50 to-blue-100`
**Border:** `border border-blue-200`

**Content:**
1. Icon: 📅
2. Month name in Turkish (e.g., "Şubat Ayı")
3. Number of completed trips (large, `text-4xl`)
4. **Trend arrow:** ↑ (green) if > last month, ↓ (gray) if < last month
5. Label: "Tamamlanan Sefer"

**Calculation:**
- Count trips where `status === 'approved'` OR `status === 'invoiced'`
- AND `deliveredAt >= monthStart`

### Geçen Ay (Last Month) Card

**Background:** `bg-gradient-to-br from-gray-50 to-gray-100`
**Border:** `border border-gray-200`

**Content:**
1. Icon: 📅
2. Previous month name in Turkish (e.g., "Ocak Ayı")
3. Number of completed trips (large, `text-4xl`)
4. Label: "Tamamlanan Sefer"

**Calculation:**
- Count trips where `status === 'approved'` OR `status === 'invoiced'`
- AND `deliveredAt` is in the previous calendar month

### Bugün (Today) Section

**Removed from main dashboard** - This was part of earlier design but removed for simplicity.

**Alternative implementation** (if needed later):
- Show in Bu Ay card as secondary line: "Bugün: 1 (Ort: 3/gün)"
- Average = `completedThisMonth / daysElapsedInMonth`

### Month Label Strategy

**Always use relative labels:**
- "Bu Ay" (This Month)
- "Geçen Ay" (Last Month)

This works consistently across all months and is more intuitive than absolute month names.

### Trend Arrows

**Position:** Next to the number, same line
**Style:**
- Up arrow (↑): `text-green-600` if current > previous
- Down arrow (↓): `text-gray-500` if current < previous
- No arrow if equal

**Size:** `text-2xl` (matches number size)

---

## Responsive Behavior

### Breakpoints

- **Mobile:** < 1024px (`max-lg`)
- **Desktop:** ≥ 1024px (`lg:`)

### Desktop Layout (≥1024px)

```
┌────────┬─────────────────────────┐
│ Side   │                         │
│ bar    │    Dashboard Content    │
│ 240px  │    (Offset by 240px)    │
│        │                         │
│ Fixed  │    Main cards           │
│ Left   │    Statistics           │
│        │                         │
└────────┴─────────────────────────┘
```

**Sidebar:** Fixed, always visible
**Content:** Left padding (`pl-60`) to account for sidebar

### Mobile Layout (<1024px)

```
┌──────────────────────────────────┐
│ ☰  Naklos Manager            [top bar]
├──────────────────────────────────┤
│                                  │
│                                  │
│    Dashboard Content             │
│    (Full width, pt-16)          │
│                                  │
│                                  │
└──────────────────────────────────┘
```

**Header:** Fixed top, height `h-16`, hamburger menu
**Content:** Full width with `pt-16` offset

**When menu opened:**
```
┌──────────┬─────────────────────┐
│ Sidebar  │█████████ Backdrop   │
│ Content  │█████████ (dark)     │
│ 288px    │█████████            │
│ [×]      │█████████            │
└──────────┴─────────────────────┘
```

### Sidebar Width by Screen Size

```css
/* Small desktop (1024-1439px) */
lg:w-50 (200px)

/* Large desktop (≥1440px) */
xl:w-60 (240px)
```

### Content Offset

```css
/* Small desktop */
lg:pl-50

/* Large desktop */
xl:pl-60
```

---

## Edge Cases and Special States

### Empty State (New Account)

**When:** Fleet has 0 trucks, 0 drivers, 0 trips

**Display:**
```
┌─────────────────────────────────────┐
│ 🎉 Hoş geldiniz Naklos'a!           │
│                                     │
│ Filonuzu kurmaya başlamak için:    │
│                                     │
│ 1. Araçlarınızı ekleyin             │
│    [+ Araç Ekle]                    │
│                                     │
│ 2. Sürücülerinizi tanımlayın        │
│    [+ Sürücü Ekle]                  │
│                                     │
│ 3. İlk seferinizi oluşturun         │
│    [+ Sefer Oluştur]                │
└─────────────────────────────────────┘
```

**Implementation:**
- Check if `trucks.length === 0 && drivers.length === 0 && trips.length === 0`
- Show onboarding card instead of main section cards
- Still show statistics section (will show 0s)

### All Clear State

**When:** All warnings are resolved (all badge counts = 0)

**Previous Design:** Showed "Her Şey Yolunda! ✨" celebration message

**New Design:** **Hide celebration, show additional statistics**

**Implementation:**
```javascript
{stats.pendingApprovalCount === 0 &&
 stats.truckWarningsCount === 0 &&
 stats.driverWarningsCount === 0 && (
  <div className="mt-8 space-y-4">
    <h3 className="text-sm font-semibold text-gray-500 uppercase">
      Ek İstatistikler
    </h3>

    {/* Additional stats cards - TBD based on future requirements */}
    {/* Examples: revenue this month, average delivery time, etc. */}
  </div>
)}
```

### First Days of New Month

**Example:** March 1st at 8 AM

**Bu Ay card:**
- Shows: "Mart Ayı"
- Number: 0 (no trips completed yet)
- Arrow: ↓ (down, since 0 < last month)
- Average: "Ort: 0/gün" (if implemented)

**Geçen Ay card:**
- Shows: "Şubat Ayı"
- Number: 28 (full month data)

This is expected behavior - relative labels make it clear.

### Mobile Badge Positioning

**When badge exists:**
- Add dynamic top padding: `pt-8` (instead of default `pt-6`)
- Badge positioned: `-top-2 -right-2` (outside card boundary)
- Ensures badge doesn't overlap content

### Approval Workflow

**User clicks Seferler card with orange badge:**

1. Navigate to `/manager/trips?tab=pending`
2. TripsPage receives query param
3. Auto-select "Onay Bekliyor" tab
4. Manager reviews trip, clicks approve
5. Trip status changes: `delivered` → `approved`
6. **Trip disappears from "Onay Bekliyor" tab** (silent removal, no toast)
7. **Badge count decreases** (real-time, instant update)
8. Trip appears in "Fatura Hazır" tab

### Document Warning Detail Flow

**User clicks Araçlar card with red badge:**

1. Navigate to `/manager/trucks`
2. TrucksPage loads with warnings
3. **Warning trucks sorted to top**
4. **Red border** on truck cards with warnings: `border-2 border-red-500`
5. Manager clicks truck → sees detail page → updates document
6. **Warning removed, badge updates**
7. **Truck moves down in sort order** (no longer at top)

### Multi-Trip Invoice Selection

**Current behavior (confirmed to keep):**

On TripsPage "Fatura Hazır" tab:
- Allow selecting multiple trips
- **Block selection** if trips have different `clientId`
- Show alert: "Farklı müşterilere ait seferleri aynı faturada birleştiremezsiniz!"
- Must select trips from same client only

---

## Performance Considerations

### Current Approach

**Decision:** Wait until performance issues appear (pragmatic MVP approach)

**Current implementation:**
- `useMemo` for statistics calculations
- Recalculates on every relevant data change
- Dependencies: `[trips, warnings]`

### Future Optimization Triggers

**Optimize when:**
- Fleet has 500+ trips
- Dashboard load time > 1 second
- User reports lag or slowness

**Optimization strategies (when needed):**
- Backend API for pre-calculated stats
- Pagination on trips list
- Virtual scrolling on long lists
- Worker threads for heavy calculations

### Badge Update Performance

**No animation = Better performance**
- Instant DOM updates
- No CSS transitions or keyframes
- Minimal re-renders

---

## Implementation Checklist

### Phase 1: Navigation Cleanup ✅

- [x] Remove "Diğer" menu item from ManagerSidebar.tsx
- [x] Update menuItems array to exclude "Diğer"
- [x] Test sidebar on desktop and mobile
- [x] Verify no broken links

### Phase 2: Dashboard Layout Updates ✅

#### 2.1 Main Section Cards

- [x] Update DashboardPage.tsx card structure
- [x] Add total count display below warning/status message
- [x] Implement dynamic top padding on mobile when badges exist
- [x] Add context-aware navigation (pass query params)

#### 2.2 Warning Badges

- [x] Implement responsive badge sizing (small/medium/large)
- [x] Add visual differentiation for 100+ counts
- [x] Badge positioning tested and working
- [x] Real-time updates verified (useMemo dependencies)

#### 2.3 Statistics Section

- [x] Add "Geçen Ay" (Last Month) card
- [x] Implement month name calculation in Turkish
- [x] Add trend arrows (↑/↓) to "Bu Ay" card
- [x] Update layout to 2-column grid (always)
- [x] Removed "Bugün" stats

#### 2.4 Empty and All-Clear States

- [x] Implement onboarding message for empty accounts
- [x] Add action buttons to empty state
- [x] Replace "Her Şey Yolunda" with additional stats placeholder
- [x] Additional stats placeholder ready for future content

### Phase 3: Responsive Sidebar ✅

- [x] Add responsive width classes to ManagerLayout
- [x] Implement `lg:w-50 xl:w-60` pattern
- [x] Update content offset classes to match (`lg:pl-50 xl:pl-60`)
- [x] Build verified successful
- [x] Mobile drawer width verified (288px / w-72)

### Phase 4: Detail Page Integrations ✅

#### 4.1 TripsPage Updates

- [x] Add query param handling for `tab`
- [x] Auto-select tab based on query param using useSearchParams
- [x] Silent removal on approval (already implemented - no toast)
- [x] Badge updates after approval (reactive via useMemo)

#### 4.2 TrucksPage Updates

- [x] Sort trucks with warnings to top
- [x] Add red border to warning truck cards (border-2 border-red-500)
- [x] Warning detection and sorting implemented
- [x] Sort order updates dynamically

#### 4.3 DriversPage Updates

- [x] Sort drivers with warnings to top
- [x] Add red border to warning driver cards (border-2 border-red-500)
- [x] Warning detection and sorting implemented
- [x] Sort order updates dynamically

### Phase 5: Testing 🧪

#### 5.1 Desktop Testing (1024px+)

- [ ] Test sidebar visibility and fixed positioning
- [ ] Test all navigation links
- [ ] Test badge display and sizing
- [ ] Test statistics calculation
- [ ] Test context-aware navigation
- [ ] Test warning flows (trips, trucks, drivers)

#### 5.2 Mobile Testing (<1024px)

- [ ] Test hamburger menu open/close
- [ ] Test drawer backdrop click
- [ ] Test navigation item tap (auto-close)
- [ ] Test badge positioning with dynamic padding
- [ ] Test two-column statistics grid on phone
- [ ] Test card touch targets (minimum 44px)

#### 5.3 Edge Cases

- [ ] Test empty account state
- [ ] Test all-clear state
- [ ] Test first day of new month
- [ ] Test large badge numbers (100+)
- [ ] Test with 0 warnings
- [ ] Test with mixed warnings (some sections, not all)

#### 5.4 Cross-Browser

- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

---

## Technical Implementation Notes

### File Changes Required

#### Primary Files

1. **src/pages/DashboardPage.tsx**
   - Remove "Diğer" references
   - Add total counts to cards
   - Implement dynamic mobile padding
   - Add context-aware navigation
   - Add "Geçen Ay" statistics card
   - Add trend arrows
   - Update all-clear state logic

2. **src/components/layout/ManagerSidebar.tsx**
   - Remove "Diğer" menu item
   - Add responsive width classes

3. **src/components/layout/ManagerLayout.tsx**
   - Update content offset classes

#### Secondary Files (Detail Pages)

4. **src/pages/TripsPage.tsx**
   - Add query param handling
   - Implement auto-tab selection
   - Remove approval toast

5. **src/pages/TrucksPage.tsx**
   - Add warning sort to top
   - Add red border for warnings

6. **src/pages/DriversPage.tsx**
   - Add warning sort to top
   - Add red border for warnings

### Utility Functions Needed

```typescript
// utils/dateHelpers.ts
export const getTurkishMonthName = (monthIndex: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthIndex];
};

export const getMonthDateRange = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
};

export const getPreviousMonth = () => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { month: prevMonth, year: prevYear };
};

// utils/badgeHelpers.ts
export const getBadgeSize = (count: number): {
  sizeClass: string;
  textClass: string;
  positionClass: string;
} => {
  if (count < 10) {
    return {
      sizeClass: 'w-6 h-6',
      textClass: 'text-sm',
      positionClass: '-top-2 -right-2'
    };
  } else if (count < 100) {
    return {
      sizeClass: 'w-8 h-8',
      textClass: 'text-sm font-bold',
      positionClass: '-top-2 -right-2'
    };
  } else {
    return {
      sizeClass: 'w-10 h-10',
      textClass: 'text-xs font-bold',
      positionClass: '-top-3 -right-3'
    };
  }
};
```

---

## Future Enhancements (Not in Current Scope)

These are explicitly **NOT** in the current implementation but documented for future reference:

### Dashboard Scope

- Additional statistics cards (revenue, average delivery time, etc.)
- Charts and graphs (if analytics hub approach is chosen)
- Quick action buttons (create trip, assign driver, etc.)

### Navigation Enhancements

- Collapsible sidebar (icons only mode)
- Sub-menus and grouped sections
- Customizable menu order
- Keyboard shortcuts

### Performance Optimizations

- Backend-calculated statistics API
- Real-time WebSocket updates
- Service worker caching
- Progressive Web App (PWA) features

### Role-Based Features

- Different dashboard views per role
- Permission-based data filtering
- Customizable widgets

### Advanced Warning System

- Warning severity levels (info, warning, error, critical)
- Custom warning thresholds
- Warning history and audit trail
- Bulk warning resolution

---

## Success Metrics

How do we know this design is successful?

### User Behavior Metrics

1. **Time to action**: How quickly can a manager identify and address warnings?
   - Target: < 30 seconds from login to viewing pending trip

2. **Navigation efficiency**: How many clicks to complete common tasks?
   - Target: 2 clicks max (dashboard → section → detail)

3. **Mobile usage**: Are managers using mobile interface?
   - Track hamburger menu usage vs direct navigation

### Technical Metrics

1. **Performance**: Dashboard load time
   - Target: < 500ms on desktop, < 1s on mobile

2. **Error rate**: Navigation errors or broken links
   - Target: 0 errors in production

3. **Responsive breakpoints**: Do all layouts work correctly?
   - Test coverage: 100% of defined breakpoints

---

## Conclusion

This specification defines a clean, focused dashboard and navigation system that prioritizes actionable information and efficient workflows. The design is intentionally minimal to start, with clear extension points for future enhancements based on actual user needs and data.

**Key Takeaways:**

1. ✅ Real-time reactive warning badges
2. ✅ Context-aware navigation
3. ✅ Consistent monthly comparison
4. ✅ Clean, scalable sidebar structure
5. ✅ Pragmatic performance approach (optimize when needed)

**Next Steps:**

1. Review and approve this specification
2. Implement Phase 1-3 changes (navigation cleanup, dashboard updates, responsive sidebar)
3. Test thoroughly across devices and edge cases
4. Deploy to production
5. Gather user feedback for future iterations

---

**Document prepared by:** Claude Sonnet 4.5
**Based on interview with:** Naklos Product Team
**Questions answered:** 16 detailed UX decision points
**Ready for implementation:** Yes ✅
