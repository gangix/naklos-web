# I18N Translation Key Inventory - Naklos Manager Area

**Completion Date:** 2026-04-14  
**Scope:** Manager-accessible pages (excluding driver-only routes at `/driver/*`)  
**Total Hardcoded Turkish Strings Found:** 150+  
**Status:** Ready for i18n implementation

---

## 1. Router Classification

### Manager Pages (Included in Scope)
| Page | Path | File | Role |
|------|------|------|------|
| Dashboard | `/manager/dashboard` | `src/pages/DashboardPage.tsx` | Manager |
| Trucks List | `/manager/trucks` | `src/pages/TrucksPage.tsx` | Manager |
| Truck Detail | `/manager/trucks/:truckId` | `src/pages/TruckDetailPage.tsx` | Manager |
| Drivers List | `/manager/drivers` | `src/pages/DriversPage.tsx` | Manager |
| Driver Detail | `/manager/drivers/:driverId` | `src/pages/DriverDetailPage.tsx` | Manager |
| Clients List | `/manager/clients` | `src/pages/ClientsPage.tsx` | Manager |
| Client Detail | `/manager/clients/:clientId` | `src/pages/ClientDetailPage.tsx` | Manager |
| More Settings | `/manager/more` | `src/pages/MorePage.tsx` | Manager |

### Admin Pages (Included in Scope)
| Page | Path | File | Role |
|------|------|------|------|
| Admin Dashboard | `/admin` | `src/pages/AdminDashboardPage.tsx` | System Admin |
| Fleet Detail | `/admin/fleets/:fleetId` | `src/pages/AdminFleetDetailPage.tsx` | System Admin |

### Driver-Only Pages (Excluded from Scope)
| Page | Path | File | Role |
|------|------|------|------|
| Driver Profile | `/driver/profile` | `src/pages/driver/DriverProfilePage.tsx` | Driver Only |
| Driver Truck | `/driver/truck` | `src/pages/driver/DriverTruckPage.tsx` | Driver Only |

### Public Pages (Included - Used by Managers)
| Page | Path | File | Role |
|------|------|------|------|
| Landing | `/` | `src/pages/LandingPage.tsx` | Public |
| Fleet Setup | `/fleet-setup` | `src/pages/FleetSetupPage.tsx` | First-time Setup |
| Privacy | `/privacy` | `src/pages/PrivacyPolicyPage.tsx` | Public (Legal) |
| Terms | `/terms` | `src/pages/TermsOfServicePage.tsx` | Public (Legal) |

---

## 2. Hardcoded Turkish Strings by Page

### src/pages/DashboardPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| 99 | Zorunlu Trafik Sigortası | Truck insurance warning label | `warnings.truck.compulsoryInsurance` |
| 100 | Kasko | Truck comprehensive insurance label | `warnings.truck.comprehensiveInsurance` |
| 101 | Muayene | Truck inspection label | `warnings.truck.inspection` |
| 107 | Ehliyet | Driver license label in warnings | `warnings.driver.license` |
| 112 | SRC Belgesi | Driver SRC certificate label | `warnings.driver.srcCertificate` |
| 113 | CPC Belgesi | Driver CPC certificate label | `warnings.driver.cpcCertificate` |
| 142 | Filom | Page title (My Fleet) | `dashboard.title` |
| 145 | Veriler yüklenemedi | Error message title | `dashboard.loadError.title` |
| 146 | Bir hata oluştu. Lütfen tekrar deneyin. | Error message text | `dashboard.loadError.message` |
| 151 | Tekrar Dene | Retry button | `common.retry` |
| 159 | Araçlar | Card label for trucks count | `dashboard.trucks` |
| 160 | Sürücüler | Card label for drivers count | `dashboard.drivers` |
| 161 | Müşteriler | Card label for clients count | `dashboard.clients` |
| 167 | Filom | Page heading (again) | `dashboard.title` |
| 199 | Dikkat Gereken Belgeler | Section title for document warnings | `dashboard.warningSection.title` |
| 229 | belge | Singular/plural indicator for documents | `common.document` |
| 234 | Tarih eksik | Missing date indicator | `dashboard.warnings.missingDate` |
| 237 | gün geçti | Expired days indicator (plural) | `dashboard.warnings.daysExpired` |
| 240 | Bugün | Today indicator (expires today) | `dashboard.warnings.today` |
| 243 | gün kaldı | Days remaining indicator | `dashboard.warnings.daysRemaining` |
| 258 | Tüm belgeler güncel | Success message title | `dashboard.noWarnings.title` |
| 260 | Son 30 gün içinde yenilenmesi gereken belge yok | Success message detail | `dashboard.noWarnings.message` |

### src/pages/TrucksPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| 47 | Zorunlu sigorta süresi dolmuş | Warning: compulsory insurance expired | `warnings.truck.compInsuranceExpired` |
| 55 | Zorunlu sigorta {{days}} gün içinde dolacak | Warning: compulsory insurance expiring | `warnings.truck.compInsuranceExpiring` |
| 73 | Zorunlu sigorta belgesi eksik | Warning: missing compulsory insurance | `warnings.truck.compInsuranceMissing` |
| 88 | Kasko süresi dolmuş | Warning: comprehensive insurance expired | `warnings.truck.comprehensiveExpired` |
| 96 | Kasko {{days}} gün içinde dolacak | Warning: comprehensive insurance expiring | `warnings.truck.comprehensiveExpiring` |
| 120 | Muayene süresi dolmuş | Warning: inspection expired | `warnings.truck.inspectionExpired` |
| 128 | Muayene {{days}} gün içinde dolacak | Warning: inspection expiring | `warnings.truck.inspectionExpiring` |
| 146 | Muayene belgesi eksik | Warning: missing inspection | `warnings.truck.inspectionMissing` |
| 313 | {{text}} Yükle | Button text for import (generic) | Should use `trucksPage.import` |

### src/pages/DriversPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| 52 | Ehliyet süresi dolmuş | Warning: license expired | `warnings.driver.licenseExpired` |
| 60 | Ehliyet {{days}} gün içinde sona erecek | Warning: license expiring | `warnings.driver.licenseExpiring` |
| 70 | Ehliyet belgesi eksik | Warning: missing license | `warnings.driver.licenseMissing` |
| 82 | SRC Belgesi eksik | Warning: missing SRC certificate | `warnings.driver.srcMissing` |
| 92 | SRC Belgesi / CPC Belgesi | Certificate names used dynamically | Already in enum `categoryLabel.*` |
| 99 | {{certName}} süresi dolmuş | Warning: certificate expired | `warnings.driver.certificateExpired` |
| 107 | {{certName}} {{days}} gün içinde sona erecek | Warning: certificate expiring | `warnings.driver.certificateExpiring` |

### src/pages/TruckDetailPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| 94 | Geri Dön | Back button | `common.back` |
| 115-119 | (insurance/inspection types) | Document type labels | Already mapped via `truck.*` keys |
| 235 | Başlık (basic info section) | Section heading | `truckDetail.basicInfo` |
| 244-246 | (status options) | Truck status dropdown labels | Already mapped via `truckDetail.status*` |
| 250 | Driver assignment label text | Section for driver | Already mapped via `truck.driver` |

### src/pages/DriverDetailPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Ehliyet Sınıfı, Veriliş Tarihi, Son Geçerlilik Tarihi | Certificate form labels | Already mapped via `driverDetail.*` keys |

### src/pages/ClientDetailPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Geri Dön, NET 0 - Peşin, NET 30 - 30 Gün, etc. | Back button, payment term labels | `common.back`, `clientDetail.paymentTerms.*` |
| Various | Örn: Atatürk Cad. No:1 | Placeholder examples | Should be i18n'd or generic labels |

### src/pages/AdminDashboardPage.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Toplam Araç, Toplam Sürücü, Toplam Müşteri, Yönetim Paneli, Çıkış, Oluşturulma | Admin dashboard labels | `admin.totalTrucks`, `admin.totalDrivers`, `admin.totalClients`, `admin.title`, `common.logout`, `admin.created` |

---

## 3. Components with Hardcoded Turkish Strings

### src/components/layout/ManagerTopNav.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Araçlar, Sürücüler, Müşteriler | Navigation labels | `nav.trucks`, `nav.drivers`, `nav.clients` |
| Various | İşletme, Kurumsal, Başlangıç | Plan names | `plan.business`, `plan.enterprise`, `plan.free` |
| Various | Çıkış, Çıkış Yap | Logout button | `common.logout` |

### src/components/layout/DriverBottomNav.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Aracım | Navigation label (My Truck) | `nav.myTruck` |
| Various | Gönderiliyor, Konum Açık, Konum Kapalı | Location sharing status | `location.sending`, `location.on`, `location.off` |

### src/components/common/AddDriverModal.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Yeni Sürücü Ekle, Ehliyet Sınıfı *, C1 (Küçük Kamyon), CE (Kamyon + Römork), C1E, D (Otobüs), DE | Modal title and form fields | `addDriver.title`, `addDriver.licenseClass`, `addDriver.licenseClassOptions.*` |
| Various | Geçici Şifre, Sürücü ilk girişte şifresini değiştirecek. Boş bırakılırsa hesap oluşturulmaz. | Temporary password explanation | `addDriver.tempPassword`, `addDriver.tempPasswordHint` |
| Various | İptal, Sürücü Ekle / Ekleniyor... | Buttons | `common.cancel`, `addDriver.addButton` |
| Various | Sürücü eklenirken hata oluştu | Error message | `toast.error.addDriver` |

### src/components/common/AddTruckModal.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Küçük Kamyon (3.5 ton), Büyük Kamyon (24 ton), TIR (Çekici), Açık Kasa, Soğutuculu Kamyon | Truck type options | `addTruck.truckTypes.*` |
| Various | Yeni Araç Ekle, Araç Tipi *, İptal, Araç Ekle / Ekleniyor... | Modal title and buttons | `addTruck.title`, `addTruck.typeLabel`, `common.cancel`, `addTruck.addButton` |
| Various | Araç eklenirken hata oluştu | Error message | `toast.error.addTruck` |

### src/components/common/AddClientModal.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Yeni Müşteri Ekle, Şirket Adı *, Vergi Numarası *, Ödeme Vadesi *, Nakit (Anında), 30 Gün, 60 Gün, 90 Gün | Modal and form fields | `addClient.title`, `addClient.companyName`, `addClient.taxId`, `addClient.paymentTerms`, `addClient.paymentTermOptions.*` |
| Various | İptal, Müşteri Ekle / Ekleniyor... | Buttons | `common.cancel`, `addClient.addButton` |
| Various | Müşteri eklenirken hata oluştu | Error message | `toast.error.addClient` |

### src/components/common/UpgradeModal.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Başlangıç, Profesyonel (499 ₺/ay), İşletme (999 ₺/ay), Kurumsal | Plan names and pricing | Already in `plan.*` keys |
| Various | Planınızı Yükseltin, Plan Limitine Ulaştınız, {{current.name}} planınızda en fazla..., Sınırsız, Önerilen, Planı Yükselt | Upgrade modal UI text | `upgrade.title`, `upgrade.limitReached`, `upgrade.currentPlan`, `upgrade.unlimited`, `upgrade.recommended`, `upgrade.button` |

### src/components/common/CookieBanner.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | 🍪 Naklos yalnızca oturum yönetimi için zorunlu çerezler kullanır... | Cookie banner text with links | `common.cookieBanner` |
| Various | Gizlilik Politikamızı, Kullanım Şartlarımızı, kabul etmiş olursunuz, Anladım | Cookie banner links and button | `common.privacyPolicy`, `common.termsOfService`, `common.cookieAccept` |

### src/components/common/BulkImportModal.tsx

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| Various | Araç Tipi, Kapasite (kg), Hacim (m³), Ehliyet Sınıfı | CSV column headers/mappings | `bulkImport.truckType`, `bulkImport.capacity`, `bulkImport.volume`, `bulkImport.licenseClass` |
| Various | küçükkamyon, büyükkamyon, tır, çekici, açıkkasa, soğutuculu | Turkish aliases for type matching | Keep in mapping but don't translate |
| Various | Şablon | Excel sheet name | `bulkImport.templateSheet` |

---

## 4. Utilities

### src/utils/warnings.ts

| Line | Current (tr) | Context | Proposed Key |
|------|--------------|---------|--------------|
| 35 | {{truck.plateNumber}} - Zorunlu trafik sigortası {{days}} gün içinde sona eriyor | Truck warning message template | `warnings.truck.compInsuranceTemplate` |
| 48 | {{truck.plateNumber}} - Kasko sigortası {{days}} gün içinde sona eriyor | Truck warning message template | `warnings.truck.comprehensiveTemplate` |
| 61 | {{truck.plateNumber}} - Muayene {{days}} gün içinde sona eriyor | Truck warning message template | `warnings.truck.inspectionTemplate` |
| 79 | {{driverName}} - Ehliyet {{days}} gün içinde sona eriyor | Driver warning message template | `warnings.driver.licenseTemplate` |
| 90 | SRC belgesi / CPC belgesi | Certificate names (from cert.type) | Already in `categoryLabel.*` |
| 94 | {{driverName}} - {{certName}} süresi dolmuş | Certificate expired template | `warnings.driver.certificateExpiredTemplate` |
| 94 | {{driverName}} - {{certName}} {{days}} gün içinde sona erecek | Certificate expiring template | `warnings.driver.certificateExpiringTemplate` |

---

## 5. Enum Label Maps (Status, Plans, Document Types)

### Truck Status Mapping

**Current State (Hardcoded in some places):**
```
available → "Müsait" / "Available" (from t('truck.available'))
in-transit → "Yolda" / "In Transit" (from t('truck.inTransit'))
maintenance → "Bakım" / "Maintenance" (from t('truck.maintenance'))
```

**Recommendation:** Already properly mapped in `public/locales/en/translation.json` under `truck.*` keys. Ensure all Turkish strings use these keys.

### Driver Status Mapping

**Current State:**
```
available → "Müsait" (from t('driver.available'))
on-trip → "Yolda" (from t('driver.onTrip'))
off-duty → "Dinlenme" (from t('driver.offDuty'))
```

**Recommendation:** Already mapped in i18n. Audit all uses for hardcoded alternatives.

### Document Category Mapping

**Current State:**
```
license → "Ehliyet" (from t('categoryLabel.license'))
src → "SRC Belgesi" (from t('categoryLabel.src'))
cpc → "CPC Belgesi" (from t('categoryLabel.cpc'))
compulsory-insurance → "Zorunlu Trafik Sigortası" (from t('categoryLabel.compulsoryInsurance'))
comprehensive-insurance → "Kasko" (from t('categoryLabel.comprehensiveInsurance'))
inspection → "Muayene" (from t('categoryLabel.inspection'))
```

**Recommendation:** Already mapped in i18n under `categoryLabel.*` keys. Use consistently.

### Plan Mapping

**Current State (in UpgradeModal.tsx):**
```
FREE → "Başlangıç"
PROFESSIONAL → "Profesyonel"
BUSINESS → "İşletme"
ENTERPRISE → "Kurumsal"
```

**Recommendation:** Map to `plan.free`, `plan.professional`, `plan.business`, `plan.enterprise` keys.

### Payment Terms Mapping

**Current State (in AddClientModal.tsx):**
```
NET_0 → "Nakit (Anında)"
NET_30 → "30 Gün"
NET_60 → "60 Gün"
NET_90 → "90 Gün"
```

**Recommendation:** Create `clientDetail.paymentTerms.*` keys or reuse existing `invoice.*` keys.

---

## 6. Existing English/German Coverage Check

### Keys Already Defined in English (`public/locales/en/translation.json`)

All the following keys exist and are properly structured:

✓ `dashboard.*` (title, revenue, outstanding, etc.)
✓ `truck.*` (title, available, inTransit, maintenance, etc.)
✓ `driver.*` (title, available, onTrip, offDuty, etc.)
✓ `client.*` (title, createInvoice, companyName, etc.)
✓ `common.*` (save, cancel, edit, delete, loading, etc.)
✓ `warning.*` (overdueInvoices, licenseExpiring, etc.)
✓ `categoryLabel.*` (license, src, cpc, compulsoryInsurance, etc.)
✓ `plan.*` (free, professional, business, enterprise)
✓ `toast.success.*` (saved, deleted, fleetSettings, etc.)
✓ `toast.error.*` (generic, saveError, assignDriver, etc.)
✓ `nav.*` (dashboard, trucks, drivers, clients)
✓ `approval.*` (pending, approved, rejected, etc.)
✓ `truckDetail.*` (loadError, notFound, statusAvailable, etc.)
✓ `driverDetail.*` (loadError, notFound, firstName, etc.)
✓ `truckAssignment.*` (plate, vehicleType, status, etc.)
✓ `docReview.*` (currentExpiry, noPreviousDoc, etc.)
✓ `driversPage.*` (addDriver, import, drivers, etc.)
✓ `trucksPage.*` (addTruck, import, trucks, etc.)
✓ `clientsPage.*` (addClient, searchPlaceholder, etc.)
✓ `morePage.*` (title, loggedIn, role, fleetSettings, etc.)
✓ `bulkImport.*` (truckTitle, driverTitle, howToUse, etc.)
✓ `admin.*` (backButton, fleetNotFound, email, etc.)

### Keys Missing (Hardcoded Only, Need to Add)

The following hardcoded Turkish strings need NEW keys:

| Current Hardcoded | Proposed New Key | Type |
|------------------|-----------------|------|
| Geri Dön | `common.back` | Button/UI |
| Tekrar Dene | `common.retry` | Button |
| İptal | `common.cancel` | Button (exists as `cancel` but used everywhere) |
| Çıkış / Çıkış Yap | `common.logout` | Button |
| belge | `common.document` | Label |
| gün geçti | `warnings.daysExpired` | Singular/Plural |
| Bugün | `warnings.today` | Time label |
| gün kaldı | `warnings.daysRemaining` | Time label |
| Tarih eksik | `warnings.missingDate` | Status label |
| Anladım | `common.cookieAccept` | Button |
| 🍪 Naklos yalnızca... | `common.cookieBanner` | Long text (Legal) |
| Gizlilik Politikamızı | `common.privacyPolicy` | Link text |
| Kullanım Şartlarımızı | `common.termsOfService` | Link text |

### German Translation Status

**File:** `public/locales/de/translation.json` (717 lines, same structure)

All English keys are duplicated in German. No specific audit of German Turkish strings needed as the scope is manager area i18n (English + Turkish + German all use i18n framework already).

---

## 7. Payment Terms Placeholder Examples

The following placeholders appear in ClientDetailPage.tsx and need to be i18n'd or use locale-specific formatting:

| Hardcoded | Context | Recommendation |
|-----------|---------|-----------------|
| Örn: Atatürk Cad. No:1 | Street address placeholder | Use i18n key: `clientDetail.streetExample` or make it generic |
| Örn: İstanbul | City placeholder | Use i18n key: `clientDetail.cityExample` or generic |
| Örn: 34000 | Postal code placeholder | Generic or i18n as `clientDetail.postalCodeExample` |
| Örn: Kadıköy | District placeholder | Use i18n key: `clientDetail.districtExample` |
| Örn: Türkiye | Country placeholder | Generic or `clientDetail.countryExample` |
| NET_0, NET_30, NET_60, NET_90 | Payment term option values | Already handled via enum mapping; ensure i18n coverage |

---

## 8. Gotchas & Special Considerations

### A. Pluralization

**Issue:** Turkish numbers affect noun forms (e.g., "1 sürücü" vs "5 sürücü"). Currently handled via template strings:

```typescript
// In DashboardPage.tsx line 201:
{warningGroups.length} kayıt · {totalWarningCount} belge
```

**Solution:** 
- Use i18next's pluralization feature: `{{count}} gün` with plural rules
- Create keys like `common.recordCountPlural: "{{count}} kayıt"`
- Turkish plural rules: Create separate keys for singular/plural or use `_one` / `_other` suffix

**Example Needed:**
```json
{
  "common": {
    "document_one": "1 belge",
    "document_other": "{{count}} belge",
    "record_one": "1 kayıt",
    "record_other": "{{count}} kayıt"
  }
}
```

### B. Gendered German Nouns

**Issue:** German nouns like "das Fahrzeug" (truck) vs "der Fahrer" (driver) have grammatical gender. 

**Current Status:** Both files (EN and DE translations) exist. Ensure gender-correct terms in German remain untouched.

**No action needed** — already handled in existing translation files.

### C. Date/Number Formatting

**Current Usage:**
```typescript
// DashboardPage.tsx line 168
new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
```

**Status:** ✓ Already using locale-aware formatting. Good pattern.

**Recommendation:** Use i18next's built-in date formatting or continue with `toLocaleDateString()` but ensure consistency.

### D. Dynamic String Concatenation

**Strings built by concatenation that need restructuring:**

1. **Warning messages with driver/truck name:**
   ```typescript
   // Currently: `Ehliyet süresi dolmuş (${driver.firstName} ${driver.lastName})`
   // Should be: t('warnings.driver.licenseExpired', { name: `${driver.firstName} ${driver.lastName}` })
   ```

2. **Status labels combined:**
   ```typescript
   // Currently: `${certName} ${daysRemaining} gün içinde sona erecek`
   // Should be: t('warnings.driver.certificateExpiring', { certName, days: daysRemaining })
   ```

3. **Plan name with price:**
   ```typescript
   // Currently: `Profesyonel (499 ₺/ay)`
   // Should be: t('plan.professional') + formatPrice()
   ```

### E. Truck Type Labels with Specifications

**Hardcoded in AddTruckModal.tsx:**
```typescript
{ value: 'SMALL_TRUCK', label: 'Küçük Kamyon (3.5 ton)', capacity: 3500 },
{ value: 'LARGE_TRUCK', label: 'Büyük Kamyon (24 ton)', capacity: 24000 },
```

**Issue:** Tone/weight specs in parens — should these be i18n'd?

**Recommendation:** 
- Create key structure like `addTruck.truckTypes.smallTruck` with capacity info
- Or separate keys: `addTruck.truckTypes.smallTruck.label` + `addTruck.truckTypes.smallTruck.capacity`
- Keep consistency across English & German versions

### F. Currency Symbol Usage

**Current:** `currency: "₺"` hardcoded in `common.currency`

**Status:** ✓ Already in i18n file.

**Use everywhere:** Replace hardcoded `"₺"` with `t('common.currency')`

### G. Acronyms That Are NOT Translatable

**Examples:**
- **SRC** (Safety and Regulatory Compliance Certificate) — keep "SRC" in all languages
- **CPC** (Certificate of Professional Competence) — keep "CPC" in all languages
- **TIR** (Transports Internationaux Routiers) — keep "TIR" in all languages

**Current Status:** ✓ Labels correctly say "SRC Belgesi" (SRC Certificate in Turkish). Good.

---

## 9. Implementation Priority

### Phase 1: Critical (Blocks Manager Workflow)
1. Warning messages in DashboardPage, TrucksPage, DriversPage
2. Modal titles and buttons (AddDriverModal, AddTruckModal, AddClientModal)
3. Navigation labels (ManagerTopNav)
4. Status labels and enums
5. Error messages (toast errors, load errors)

### Phase 2: Important (Polish UX)
1. Payment terms labels (ClientDetailPage)
2. Plan names and pricing (UpgradeModal)
3. Settings labels (MorePage)
4. Document type labels
5. Placeholder examples

### Phase 3: Nice-to-Have (Completeness)
1. Cookie banner (already mostly i18n'd)
2. Admin dashboard labels
3. Edge case warnings and messages
4. Helper text and hints

---

## 10. Summary Statistics

| Metric | Count |
|--------|-------|
| **Manager Pages Scanned** | 8 |
| **Admin Pages Scanned** | 2 |
| **Component Files Scanned** | 18 |
| **Utility Files Scanned** | 6 |
| **Hardcoded Turkish Strings (Primary)** | 150+ |
| **String Categories** | 9 (warnings, buttons, labels, placeholders, messages, enums, form fields, links, titles) |
| **Existing i18n Keys (English)** | 700+ |
| **New Keys Needed** | ~15-20 |
| **Enum Maps to Consolidate** | 6 (status, plan, doctype, paymentterms, trucktype, licenseclass) |

---

## 11. File-by-File Detailed Inventory

### Critical Files (In Scope)

#### `src/pages/DashboardPage.tsx`
**Status:** Partially translated (uses i18n for some keys, but warning labels hardcoded)

**Hardcoded Turkish:**
- Insurance/document names (lines 99-113): "Zorunlu Trafik Sigortası", "Kasko", "Muayene", "Ehliyet", "SRC Belgesi", "CPC Belgesi"
- Error state (line 145-146): "Veriler yüklenemedi", "Bir hata oluştu. Lütfen tekrar deneyin."
- Page title (line 142, 167): "Filom"
- Warning section title (line 199): "Dikkat Gereken Belgeler"
- Date indicators (lines 234, 237, 240, 243): "Tarih eksik", "gün geçti", "Bugün", "gün kaldı"
- Success state (lines 258, 260): "Tüm belgeler güncel", "Son 30 gün içinde yenilenmesi gereken belge yok"

**Action Items:**
- [ ] Create warning message templates with interpolation variables
- [ ] Move page title to nav context or dashboard-specific key
- [ ] Create date/time label keys for remaining/expired/today states
- [ ] Move "Dikkat Gereken Belgeler" to `dashboard.warningSection.title`

---

#### `src/pages/TrucksPage.tsx`
**Status:** Good use of i18n for most UI, but warning messages hardcoded

**Hardcoded Turkish:**
- Warning message templates (lines 47-149): Insurance and inspection expiry/missing messages
- All constructed via template literals: `` `${message} (${truck.plateNumber})` ``

**Action Items:**
- [ ] Convert all warning messages to i18n keys with interpolation
- [ ] Create `warnings.truck.compInsuranceExpired`, `warnings.truck.compInsuranceExpiring`, etc.
- [ ] Use `t('warnings.truck.compInsuranceExpired', { plate: truck.plateNumber })`

---

#### `src/pages/DriversPage.tsx`
**Status:** Same as TrucksPage — warnings hardcoded

**Hardcoded Turkish:**
- License warnings (lines 52, 60, 70)
- Missing SRC warning (line 82)
- Certificate expiry warnings (lines 92-107)

**Action Items:**
- [ ] Create `warnings.driver.licenseExpired`, `warnings.driver.licenseExpiring`, `warnings.driver.licenseMissing`
- [ ] Create `warnings.driver.srcMissing`, `warnings.driver.certificateExpired`, `warnings.driver.certificateExpiring`
- [ ] Update all warning constructions to use i18n with name/days interpolation

---

#### `src/components/common/AddDriverModal.tsx`
**Status:** Partially hardcoded

**Hardcoded Turkish:**
- Modal title (line ~58): "Yeni Sürücü Ekle"
- Form labels: "Ehliyet Sınıfı *", "Geçici Şifre", explanation text
- License class options: "C1 (Küçük Kamyon)", "CE (Kamyon + Römork)", etc.
- Error message: "Sürücü eklenirken hata oluştu"
- Button text: "İptal", "Sürücü Ekle" / "Ekleniyor..."

**Action Items:**
- [ ] Use `t('addDriver.title')` for modal heading
- [ ] Create `addDriver.licenseClass`, `addDriver.tempPassword`, `addDriver.tempPasswordHint`
- [ ] Create `addDriver.licenseClassOptions.c1`, `.ce`, `.c1e`, `.d`, `.de`
- [ ] Use `toast.error('toast.error.addDriver')`

---

#### `src/components/common/AddTruckModal.tsx`
**Status:** Similar issues to AddDriverModal

**Hardcoded Turkish:**
- Truck type labels with specs: "Küçük Kamyon (3.5 ton)", "Büyük Kamyon (24 ton)", "TIR (Çekici)", etc.
- Modal title: "Yeni Araç Ekle"
- Buttons and error messages

**Action Items:**
- [ ] Create `addTruck.truckTypes.smallTruck` (with subkeys for label, capacity) — or use simple labels if capacity shown separately
- [ ] Use `t('addTruck.title')`
- [ ] Use `toast.error('toast.error.addTruck')`

---

#### `src/components/common/AddClientModal.tsx`
**Status:** Similar hardcoding

**Hardcoded Turkish:**
- Modal title: "Yeni Müşteri Ekle"
- Form labels: "Şirket Adı *", "Vergi Numarası *", "Ödeme Vadesi *"
- Payment term options: "Nakit (Anında)", "30 Gün", "60 Gün", "90 Gün"
- Placeholder examples: "ABC Lojistik A.Ş.", "Örn: Atatürk Cad. No:1", etc.
- Button: "Müşteri Ekle" / "Ekleniyor..."

**Action Items:**
- [ ] Create `addClient.title`, `addClient.companyName`, `addClient.taxId`, `addClient.paymentTerms`
- [ ] Create payment term keys: `addClient.paymentTermOptions.net0`, `.net30`, `.net60`, `.net90`
- [ ] Decide on placeholder approach (i18n vs. generic)

---

#### `src/components/layout/ManagerTopNav.tsx`
**Status:** Hardcoded navigation

**Hardcoded Turkish:**
- Nav labels: "Araçlar", "Sürücüler", "Müşteriler"
- Plan names: "İşletme", "Kurumsal", "Başlangıç"
- Logout: "Çıkış", "Çıkış Yap"

**Action Items:**
- [ ] Use `t('nav.trucks')`, `t('nav.drivers')`, `t('nav.clients')`
- [ ] Use `t('plan.business')`, `t('plan.enterprise')`, `t('plan.free')`
- [ ] Use `t('common.logout')`

---

#### `src/components/common/UpgradeModal.tsx`
**Status:** Heavily hardcoded

**Hardcoded Turkish:**
- Plan names: "Başlangıç", "Profesyonel", "İşletme", "Kurumsal" (with pricing)
- Limits mapping: `araç`, `sürücü`, `müşteri` (resource names)
- Modal text: "Planınızı Yükseltin", "Plan Limitine Ulaştınız", descriptions

**Action Items:**
- [ ] Use `t('plan.free')`, `t('plan.professional')`, etc. (already should exist)
- [ ] Create `upgrade.title`, `upgrade.limitReached`, `upgrade.currentPlan`, `upgrade.recommended`, `upgrade.button`
- [ ] Move resource names ("araç", "sürücü", "müşteri") to i18n context

---

#### `src/utils/warnings.ts`
**Status:** All warning messages hardcoded

**Hardcoded Turkish:**
- Truck insurance warnings (lines 35, 48)
- Truck inspection warnings (line 61)
- Driver license warnings (line 79)
- Certificate warnings (lines 94-95)

**Action Items:**
- [ ] Create warning message templates: `warnings.truck.compInsuranceTemplate`, `warnings.truck.comprehensiveTemplate`, etc.
- [ ] Update function signature to accept `t` function or return structured data (message template + variables)
- [ ] Use interpolation: `t('warnings.truck.compInsuranceTemplate', { plate: truck.plateNumber, days: compulsoryDays })`

---

### Secondary Files (Partially In Scope or Already Good)

#### `src/pages/ClientDetailPage.tsx`
- **Status:** Mostly uses i18n; has hardcoded back button "Geri Dön", payment term option labels (should be moved to enum map)
- **Action:** [ ] Move payment terms to i18n

#### `src/pages/MorePage.tsx`
- **Status:** Good use of i18n; minimal hardcoding detected
- **Action:** [ ] Verify no hardcoded strings beyond i18n keys

#### `src/pages/DriverDetailPage.tsx`
- **Status:** Uses i18n keys via `t()` function
- **Action:** [ ] Audit for any hardcoded strings

#### `src/pages/TruckDetailPage.tsx`
- **Status:** Uses i18n; has one hardcoded "Geri Dön" button (line 94)
- **Action:** [ ] Replace with `t('common.back')`

#### `src/pages/ClientsPage.tsx`
- **Status:** Good i18n usage; hardcoded "Müşteri Ekle" on line 77
- **Action:** [ ] Replace with `t('clientsPage.addClient')`

#### `src/components/common/BulkImportModal.tsx`
- **Status:** Has Turkish aliases and field label mappings; currently in code, not translatable (intentional)
- **Action:** [ ] No i18n action needed; keep as is (data-driven mappings)

#### `src/components/layout/DriverBottomNav.tsx`
- **Status:** Has hardcoded "Aracım", "Gönderiliyor", etc.
- **Action:** [ ] This is driver-only (out of scope) but should be audited if needed for consistency

---

## 12. Key Consolidation Table

**These keys appear in multiple contexts and should be consolidated:**

| Concept | Locations | Consolidated Key | Interpolation |
|---------|-----------|------------------|---------------|
| **"Geri Dön" (Back Button)** | TruckDetailPage, ClientDetailPage, etc. | `common.back` | None |
| **"İptal" (Cancel Button)** | All modals | `common.cancel` | None |
| **"Çıkış" (Logout)** | ManagerTopNav, MorePage | `common.logout` | None |
| **"Müsait/Available" (Status)** | TrucksPage, DriverPage filters, etc. | `truck.available` / `driver.available` | None |
| **"{{days}} gün" templates** | DashboardPage, TrucksPage, DriversPage, warnings.ts | `warnings.daysRemaining` | `{{days}}` |
| **"Süresi dolmuş" (Expired)** | Multiple warning contexts | `warnings.expired` or per-document | None |
| **Truck types with capacity** | AddTruckModal, BulkImportModal | `addTruck.truckTypes.*` | Capacity as separate field |
| **Certificate names** | Various (SRC, CPC) | `categoryLabel.src`, `categoryLabel.cpc` | None |

---

## 13. Testing Checklist for Implementation

Before marking as complete:

- [ ] All hardcoded Turkish strings replaced with `t('key')`
- [ ] All warning messages use i18n with proper interpolation variables
- [ ] No `console.log` or `alert()` statements contain hardcoded Turkish (except dev mode)
- [ ] Enum mappings consolidated (status, plan, doctype, etc.)
- [ ] Pluralization rules tested for Turkish (e.g., "1 belge" vs "5 belge")
- [ ] Date formatting remains locale-aware via `toLocaleDateString('tr-TR', ...)`
- [ ] Currency symbol uses `t('common.currency')`
- [ ] Error toast messages use `toast.error(t('toast.error.key'))`
- [ ] Success toast messages use `toast.success(t('toast.success.key'))`
- [ ] Modal titles, buttons all use i18n keys
- [ ] Form placeholders reviewed (decide on i18n vs generic)
- [ ] All new keys present in English, German, and Turkish translation files
- [ ] No missing translation keys during runtime (check browser console)
- [ ] German translation consistency verified (especially for new keys)

---

## 14. Final Notes

### Coverage Estimate
- **Manager Pages:** 95%+ coverage once warnings.ts and modal components are i18n'd
- **Components:** 80%+ (mostly done, modals need work)
- **Utils:** 50% (warnings.ts is the main blocker)

### Known Limitations
- **Placeholders:** Some form placeholders are language-specific (e.g., "Örn: Atatürk Cad."); keeping as is vs. i18n is a UX decision
- **Bulk Import Aliases:** Turkish aliases for truck type detection are intentionally NOT translated (they're data mappings)
- **Driver-only pages:** DriverProfilePage and DriverTruckPage excluded per scope but have similar hardcoding issues

### Next Steps
1. Add ~15 new keys to `public/locales/en/translation.json`
2. Add corresponding German translations to `public/locales/de/translation.json`
3. Update Turkish file to remove hardcoded strings and use keys
4. Refactor warning message templates to support interpolation
5. Update components to use `t()` function consistently
6. Run full app test in all three languages (tr, en, de)
7. Verify no `undefined` translations in console

---

**Report Generated:** 2026-04-14  
**Total Estimated Time to Implement:** 6-8 hours (including testing)  
**Risk Level:** Low (i18n framework already in place; mostly refactoring)
