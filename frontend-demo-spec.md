# Naklos Fleet Management — Frontend Demo Spec

## Purpose
UX validation demo for a **fleet owner** operating 10-50 trucks in Turkey. The fleet owner currently manages everything with spreadsheets/paper and is mobile-first (phone, not desktop). The goal is to validate workflows, learn their billing model, and demonstrate how Naklos eliminates manual pain — especially around invoicing, payment tracking, and fleet visibility.

---

## Target User Profile
- **Role:** Fleet owner/operator (small-to-mid fleet, 10-50 trucks)
- **Location:** Turkey (domestic routes)
- **Current tools:** Spreadsheets, paper, phone calls
- **Device:** Mobile phone (primary), occasional desktop
- **Language:** Turkish (tr)
- **Tech savviness:** Low-to-moderate — app must be dead simple

---

## Technical Stack
| Choice | Decision |
|---|---|
| Framework | React 18+ with Vite |
| Language | TypeScript |
| Styling | Tailwind CSS (custom branded) |
| State management | React Context + hooks |
| Routing | React Router v6 |
| Map | Leaflet or Mapbox GL (free tier) with static pins |
| Charts | Recharts or Chart.js (lightweight) |
| i18n | All UI text in Turkish (tr), hardcoded for demo |
| PWA | Vite PWA plugin for installability |
| Auth | None — app opens directly to dashboard |
| Data | Mock JSON data, persisted in-memory (local state) |
| Repository | Separate repo (not inside naklos monorepo) |

---

## Branding (Design from Scratch)
- **App name:** Naklos
- **Visual identity:** Modern, clean, professional. Designed for trust (fleet owners handle real money).
- **Color palette:** To be defined — suggest a bold primary (navy/teal family), warm accent for CTAs, red for warnings/overdue, green for positive/paid.
- **Typography:** Clean sans-serif (Inter or similar), Turkish character support required (ğ, ş, ç, ö, ü, ı, İ).
- **Logo:** Text-based "Naklos" logotype for now (can be refined later).

---

## Navigation
**Bottom tab bar** with 5 tabs:
1. **Ana Sayfa** (Dashboard) — Financial summary + alerts
2. **Araçlar** (Trucks) — Fleet list + map view
3. **Seferler** (Trips) — Active and past trips
4. **Müşteriler** (Clients) — CRM-lite client list
5. **Daha Fazla** (More) — Drivers, settings, reports

---

## Screens & Features

### 1. Dashboard (Ana Sayfa)
**Primary focus:** Financial summary — the first thing the fleet owner sees in the morning.

**Content:**
- **Revenue card:** This month's total revenue (TRY)
- **Outstanding card:** Total unpaid invoices amount
- **Overdue card:** Overdue invoice count + total (red highlight if > 0)
- **Profit card:** This month's net profit (revenue minus expenses)
- **Quick stats row:** Active trips count, available trucks, available drivers
- **Inline warnings** (if any):
  - "2 fatura vadesi geçmiş" (2 invoices overdue) — tappable, navigates to client
  - "1 ehliyet 5 gün içinde sona eriyor" (1 license expiring in 5 days) — tappable

### 2. Trucks (Araçlar)
**List view** (default) + **Map view** (toggle).

**List view:**
- Card per truck: plate number, type icon, current status (available/in-transit/maintenance), assigned driver name
- Filter chips: Tümü (All), Müsait (Available), Yolda (In Transit), Bakımda (Maintenance)
- Tap a truck → **Truck Detail** screen

**Map view:**
- Static pins on a Turkey map showing last known position of each truck
- Pin color indicates status (green=available, blue=in-transit, orange=maintenance)
- Tap pin → mini card with plate number + status, tap card → Truck Detail

**Truck Detail screen:**
- **Header:** Plate number, truck type, status badge
- **Current trip section:** (if in-transit) Origin → Destination, ETA, driver name, client name
- **Assignment info:** Currently assigned driver, assignment date
- **Recent trips:** Last 5 trips (date, route, client, revenue)
- **Earnings summary:** This month revenue, trip count, utilization rate (%)

### 3. Trips (Seferler)
**Tab sub-navigation:** Aktif (Active) | Tamamlanan (Completed) | Tümü (All)

**Trip card:**
- Route: Origin city → Destination city
- Client name
- Truck plate + driver name
- Status badge: Atandı (Assigned) → Yolda (In Transit) → Teslim Edildi (Delivered)
- Revenue amount (TRY)

**Trip Detail screen:**
- Route with origin/destination
- Status timeline (simple linear: assigned → in-transit → delivered)
- Client, truck, driver info
- **Financial breakdown:**
  - Revenue (from client)
  - Expenses section (editable):
    - Yakıt (Fuel) — input field
    - HGS/OGS (Tolls) — input field
    - Şoför ücreti (Driver fee) — input field
    - Diğer (Other) — input field
  - **Net kâr (Net profit):** auto-calculated = revenue - sum(expenses)
- Timestamps: created, started, completed

**Key action:** "Yeni Sefer Oluştur" (Create New Trip) button → form with:
- Select client (from client list)
- Select truck (from available trucks)
- Select driver (from available drivers)
- Origin city, destination city
- Agreed price (TRY)
- Saves to local state, appears in Active trips

### 4. Clients (Müşteriler)
**CRM-lite list:**
- Client card: Company name, contact person, outstanding balance, payment reliability indicator (green/yellow/red dot)
- Search bar at top
- Sort: By name, by outstanding balance

**Client Detail screen:**
- **Header:** Company name, tax ID, contact info (phone, email)
- **Financial summary:**
  - Toplam faturalanan (Total invoiced)
  - Toplam ödenen (Total paid)
  - Bekleyen (Outstanding)
  - Vadesi geçmiş (Overdue) — red if > 0
  - Ortalama ödeme süresi (Avg days to pay)
- **Invoice list:** Recent invoices with status badges (Ödendi/Bekliyor/Gecikmiş — Paid/Pending/Overdue)
- **Trip history:** Recent trips for this client

**Key action:** "Fatura Oluştur" (Create Invoice) button → form with:
- Select trip(s) to invoice
- Amount (pre-filled from trip price)
- Due date
- Saves to local state, appears in client's invoice list

### 5. More (Daha Fazla)
- **Şoförler (Drivers):** Driver list with name, phone, status (active/on-trip/off-duty), assigned truck
  - Driver detail: contact info, license class, license expiry (inline warning if expiring soon), assigned truck, recent trips
- **Raporlar (Reports):** Placeholder screen showing "Yakında" (Coming Soon) with mock chart previews
- **Ayarlar (Settings):** Placeholder

---

## Mock Data Specification
**Volume:** Moderate (20-30 records per entity)

### Fleet
- 1 fleet: "Yıldız Nakliyat" (owner: Ahmet Yıldız), based in Istanbul, TRY currency

### Trucks (15 trucks)
- Mix of types (TIR, kamyon, frigorifik)
- Statuses: 8 in-transit, 4 available, 2 in maintenance, 1 unassigned
- Turkish plate numbers (34 XX 1234 format for Istanbul, 06 for Ankara, etc.)

### Drivers (12 drivers)
- Turkish names (Mehmet, Ali, Hasan, Fatih, Emre, etc.)
- Statuses: 8 on-trip, 3 available, 1 off-duty
- **Problem data:** 1 driver with license expiring in 5 days (warning trigger)

### Clients (8 clients)
- Turkish company names (e.g., "Anadolu Gıda A.Ş.", "Ege Tekstil Ltd.", "Marmara İnşaat")
- Mix of payment reliability: 5 good (green), 2 moderate (yellow), 1 poor (red)
- **Problem data:**
  - 1 client with 2 overdue invoices (triggers dashboard warning)
  - 1 client with high outstanding balance

### Trips (30 trips)
- Routes between Turkish cities: Istanbul↔Ankara, Istanbul↔İzmir, Ankara↔Antalya, Istanbul↔Bursa, Ankara↔Konya, etc.
- Mix: 8 active (assigned/in-transit), 22 completed
- Revenue range: 8,000 - 45,000 TRY per trip
- Some trips with expenses filled in, some without (to show editable workflow)

### Invoices (25 invoices)
- Linked to completed trips
- Statuses: 18 paid, 5 pending, 2 overdue
- Amounts matching trip revenues
- Due dates spread across last 3 months

---

## CRUD Actions (Local State Only)
These actions save to in-memory state (lost on refresh — acceptable for demo):
1. **Create Trip** — select client, truck, driver, route, price
2. **Create Invoice** — select trip(s), set amount and due date
3. **Add/Edit Expense** — on trip detail, input fuel/tolls/driver fee/other costs

All other data is read-only mock data.

---

## Inline Warnings (Not Notifications)
Warnings appear contextually within the relevant screen:
- **Dashboard:** Warning cards for overdue invoices and expiring licenses
- **Client Detail:** Red "Vadesi Geçmiş" badge on overdue invoices
- **Driver Detail:** Yellow "Ehliyet süresi doluyor" warning near license expiry date
- **Truck Detail:** Orange "Bakımda" badge for trucks in maintenance

---

## Non-Goals (Out of Scope)
- No authentication/authorization
- No real backend API integration (mock data only)
- No push notifications
- No offline support (beyond PWA shell caching)
- No multi-language (Turkish only for demo)
- No real GPS/tracking integration
- No PDF invoice generation
- No dark mode
- No driver-facing app (fleet owner view only)

---

## Future Integration Points
When connecting to the real backend later:
- Replace mock data providers with TanStack Query + fetch calls to Naklos REST API
- Add Keycloak OAuth2 authentication
- Replace static map pins with real GPS data
- Add WebSocket for real-time truck position updates
- Connect invoice creation to backend billing module
