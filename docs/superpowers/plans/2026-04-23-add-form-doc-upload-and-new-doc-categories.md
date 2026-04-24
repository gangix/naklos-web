# Cert-form file upload + new document categories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision (2026-04-24):** The original plan bundled "add document upload to AddTruckModal / AddDriverModal" with "add four new document categories." During execution the first commit (`b622b838`, revert `27ab31d`) was deemed unnecessary: the Add flows are already fine — the Truck/Driver detail pages already offer full upload via `SimpleDocumentUpdateModal`. The real info-only gap is the **driver SRC/CPC certificate add form** (`DriverDetailPage.tsx:635-690`), where a structured cert record is created (`driverApi.addCertificate`) without any file attachment. This revision scopes the work to that gap plus the four new document categories from the original Phase B.

**Goal:** (1) In the driver detail page's SRC/CPC cert add form, accept a document file alongside the structured info — **required for SRC**, **optional for CPC** — and upload it via the existing `driverApi.uploadDocument` endpoint right after the structured cert is created. (2) Add four new document categories — `tachograph`, `k-certificate`, `adr-vehicle`, `adr-driver` — that fleet managers can upload and manage just like the existing six.

**Architecture:** Pure frontend change. For (1), the existing `handleAddCertificate` gains a two-step finish: create the structured cert via `driverApi.addCertificate`, then (if a file was attached) upload the bytes via `driverApi.uploadDocument(driverId, file, 'src' | 'cpc', expiryDate)`. Upload failures are non-fatal — the cert is already created and the manager is notified to retry via the doc tile. For (2), extend the `DocumentCategory` union in `src/types/index.ts`, add category labels to the two existing document modals, wire new i18n keys, and render new document tiles on `TruckDetailPage.tsx` (3 tiles) / `DriverDetailPage.tsx` (1 tile). The backend (`document_type VARCHAR(50)`, no enum) already accepts any string; no backend migration required.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, react-i18next (TR/EN/DE), Vitest + happy-dom, existing `driverApi` / `truckApi` service wrappers. Backend repo at `/Users/olcay.bilir/IdeaProjects/naklos` is untouched.

**Backend capability check — DONE:**
- `fleet-module/src/main/java/com/naklos/fleet/domain/TruckDocument.java:31-32` — `document_type` is a free-form `VARCHAR(50)`, no enum.
- `fleet-module/src/main/java/com/naklos/fleet/domain/DriverDocument.java:31-32` — same.
- `application/src/main/java/com/naklos/application/service/TruckDocumentService.java:195-224` — the service syncs `expiryDate` to Truck entity fields only for `compulsory-insurance`, `comprehensive-insurance`, `inspection`. New categories hit the `default` branch — the document is stored but no Truck entity field is populated. **Consequence:** Dashboard summary warnings (via `utils/truckWarnings.ts`, which reads Truck entity fields) WILL NOT surface expiring tachograph/K/ADR documents. Detail-page tiles (which read the documents list directly) WILL surface them. Backend sync for new categories is a **deferred followup**.

**Where code lives:** `naklos-web` repo only. Zero backend commits.

**Branch:** `feat/add-form-doc-upload-and-new-categories` (already cut; current HEAD is the revert commit `27ab31d`).

**Out of scope:**
- AddTruckModal / AddDriverModal changes (expressly reverted).
- Backend sync of new category expiries to the Truck/Driver entity denormalized fields so the Dashboard summary picks them up. Captured in the followup note (Task 7).
- Realignment of `driver.certificates[]` (structured record) with `driver_documents` (file rows). They remain parallel; this plan only ensures that when a cert is added, a file CAN (SRC: MUST) be uploaded alongside it.
- Maintenance / service-history module (odometer-driven bakım, work orders, parts). Separate spec.
- Driver-mobile PhotoCapture flow in `DocumentUploadModal.tsx`. Unchanged.

**Testing philosophy:**
- **Compile-time gates:** `npx tsc --noEmit` after every TypeScript change — catches missing category labels in `Record<DocumentCategory, string>` maps.
- **Unit tests:** added only for pure logic. No new logic in this plan beyond input validation, which is handled via existing toast patterns.
- **Browser verification:** called out in the smoke-test task as a checklist the human controller runs; subagents do not drive browsers.
- **Commit discipline:** commit after every task.

---

## File Structure

All paths relative to `/Users/olcay.bilir/IdeaProjects/naklos-web/`.

### Created
```
docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md   (written in Task 7)
```

### Modified — Task R1 (SRC/CPC cert form upload)
```
src/pages/DriverDetailPage.tsx                              ~45 lines added (FileInput + upload wiring)
public/locales/tr/translation.json                          +4 keys
public/locales/en/translation.json                          +4 keys
public/locales/de/translation.json                          +4 keys
```

### Modified — Tasks 2-5 (new document categories)
```
src/types/index.ts                                          DocumentCategory union expanded (+4)
src/components/common/SimpleDocumentUpdateModal.tsx         categoryLabel map +4 entries
src/components/common/DocumentUploadModal.tsx               categoryLabel map +4 entries
src/pages/TruckDetailPage.tsx                               +3 doc tiles (tachograph, k-certificate, adr-vehicle)
src/pages/DriverDetailPage.tsx                              +1 doc tile (adr-driver)
public/locales/tr/translation.json                          +categoryLabel/doc + tile-action keys
public/locales/en/translation.json                          same
public/locales/de/translation.json                          same
```

---

## Task Tracker (revised)

Revised task IDs. The original plan's Task 0 was executed and its revert is already on branch.

- **Task 0** ✅ DONE (branch `feat/add-form-doc-upload-and-new-categories` cut, baseline 60/60, plan committed as `66d62a3`; Task 1 scaffolding committed + reverted, so the working tree now equals the baseline state aside from plan docs).
- **Task R1** — SRC/CPC cert add form file upload (new)
- **Task 2** — Extend `DocumentCategory` union (+4)
- **Task 3** — Category labels in both doc modals + i18n
- **Task 4** — `TruckDetailPage`: three new doc tiles (tachograph, k-certificate, adr-vehicle)
- **Task 5** — `DriverDetailPage`: ADR-driver tile
- **Task 6** — Smoke verification (typecheck, tests, build, browser TR/EN/DE)
- **Task 7** — Followup note + push + open PR

---

## Task R1: SRC/CPC cert add form — accept file alongside structured info

**Files:**
- Modify: `src/pages/DriverDetailPage.tsx`
  - state (add `certificateFile`, lines ~44-48 region)
  - `handleAddCertificate` (lines 167-230)
  - cert-add form JSX (lines 635-690)
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/de/translation.json`

**Goal:** When a manager fills the SRC/CPC add form on the driver detail page, they can attach a document file. For `SRC` (mandatory certificate), the file is required before submit. For `CPC` (optional certificate), the file is optional. After `driverApi.addCertificate` succeeds, call `driverApi.uploadDocument(driverId, file, 'src' | 'cpc', expiryDate)` to persist the file. Upload failure is non-fatal — the structured cert already exists, the user is toast-notified to retry from the doc tile.

- [ ] **Step 1: Add state for the certificate file**

In `src/pages/DriverDetailPage.tsx`, alongside the existing certificate form state (around lines 45-48, after `const [certificateExpiryDate, setCertificateExpiryDate] = useState('');`), add:

```tsx
const [certificateFile, setCertificateFile] = useState<File | null>(null);
```

- [ ] **Step 2: Extend the validation + submit logic in `handleAddCertificate`**

Replace the existing `handleAddCertificate` function body (currently at lines ~167-230) with this exact version:

```tsx
const handleAddCertificate = async () => {
  if (!driverId) return;

  if (!certificateNumber || !certificateIssueDate || !certificateExpiryDate) {
    toast.warning(t('toast.warning.fillAllFields'));
    return;
  }

  // SRC is mandatory in Turkey for commercial freight — require the file so
  // the cert record isn't created without the underlying document.
  if (certificateType === 'SRC' && !certificateFile) {
    toast.error(t('driverDetail.certSrcFileRequired'));
    return;
  }

  // Client-side validation: check if expiry date is in the future
  const expiryDate = new Date(certificateExpiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiryDate < today) {
    toast.error(t('toast.error.expiryInPast'));
    return;
  }

  // Check if issue date is before expiry date
  const issueDate = new Date(certificateIssueDate);
  if (expiryDate < issueDate) {
    toast.error(t('toast.error.expiryBeforeIssue'));
    return;
  }

  try {
    await driverApi.addCertificate(driverId, {
      type: certificateType,
      number: certificateNumber,
      issueDate: certificateIssueDate,
      expiryDate: certificateExpiryDate,
    });

    // Upload the file (if provided). Non-fatal on failure: the structured
    // cert already exists, the manager is told to retry from the doc tile.
    if (certificateFile) {
      try {
        await driverApi.uploadDocument(
          driverId,
          certificateFile,
          certificateType === 'SRC' ? 'src' : 'cpc',
          certificateExpiryDate,
        );
      } catch (uploadErr) {
        console.error('Cert file upload failed after addCertificate', uploadErr);
        toast.warning(t('driverDetail.certUploadFailedToast'));
      }
    }

    // Reset form
    setShowAddCertificate(false);
    setCertificateNumber('');
    setCertificateIssueDate('');
    setCertificateExpiryDate('');
    setCertificateFile(null);

    const updatedDriver = await driverApi.getById(driverId);
    setDriver(updatedDriver);
    refreshRoster();

    toast.success(t('toast.success.certificateAdded'));
  } catch (err) {
    console.error('Error adding certificate:', err);
    const errorMessage = err instanceof Error ? err.message : t('toast.error.generic');

    // Show user-friendly error
    if (errorMessage.includes('already expired')) {
      toast.error(t('toast.error.expiredCertificate'));
    } else if (errorMessage.includes('already exists')) {
      toast.error(t('toast.error.duplicateCertificate'));
    } else {
      toast.error(errorMessage);
    }
  }
};
```

**Preserve** the rest of the function (any lines after the `catch` block that exist in the current code — if any — must stay). If the current function has additional lines past what's shown above, include them.

- [ ] **Step 3: Also reset `certificateFile` in the cancel button's reset**

In the cancel button inside the cert form (currently at lines ~676-684, `onClick={() => { setShowAddCertificate(false); setCertificateNumber(''); ... }}`), add `setCertificateFile(null);` as the last reset call.

- [ ] **Step 4: Add `FileInput` to the cert add form JSX**

Import `FileInput` at the top of `DriverDetailPage.tsx` — check the existing FormField imports; if `TextInput` and `Select` are already imported from `../components/common/FormField`, extend to include `FileInput`:

```tsx
import { FileInput, Select, TextInput } from '../components/common/FormField';
```

(If the path is different, match the existing import.)

Then inside the cert add form, after the expiry-date `TextInput` (currently around line 668, right before `<div className="flex gap-2 pt-2">`), insert:

```tsx
<FileInput
  label={
    certificateType === 'SRC'
      ? `${t('driverDetail.certFileLabel')} ${t('driverDetail.requiredMarker')}`
      : `${t('driverDetail.certFileLabel')} ${t('driverDetail.optionalMarker')}`
  }
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(file) => setCertificateFile(file)}
  selectedFileName={certificateFile?.name ?? null}
/>
```

- [ ] **Step 5: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0, no output. If `FileInput`'s prop names differ (e.g., `onFileSelect` vs `onChange`, `selectedFileName` vs `fileName`), verify against `src/components/common/FormField.tsx` and adjust this step's JSX — the rest of the task is unaffected.

- [ ] **Step 6: Add i18n keys — Turkish**

In `public/locales/tr/translation.json`, inside the existing `"driverDetail"` block, add these keys (preserve surrounding commas):

```json
    "certFileLabel": "Belge dosyası (PDF veya fotoğraf)",
    "requiredMarker": "(zorunlu)",
    "optionalMarker": "(opsiyonel)",
    "certSrcFileRequired": "SRC belgesi için dosya yüklemek zorunlu.",
    "certUploadFailedToast": "Sertifika kaydedildi ancak belge dosyası yüklenemedi. Sertifika kartından tekrar dener misin?"
```

- [ ] **Step 7: Same keys — English**

`public/locales/en/translation.json`, inside `"driverDetail"`:

```json
    "certFileLabel": "Certificate file (PDF or photo)",
    "requiredMarker": "(required)",
    "optionalMarker": "(optional)",
    "certSrcFileRequired": "A document file is required for the SRC certificate.",
    "certUploadFailedToast": "Certificate saved, but the file failed to upload. Please retry from the certificate card."
```

- [ ] **Step 8: Same keys — German**

`public/locales/de/translation.json`, inside `"driverDetail"`:

```json
    "certFileLabel": "Zertifikatsdatei (PDF oder Foto)",
    "requiredMarker": "(erforderlich)",
    "optionalMarker": "(optional)",
    "certSrcFileRequired": "Für das SRC-Zertifikat ist eine Dokumentdatei erforderlich.",
    "certUploadFailedToast": "Zertifikat gespeichert, aber die Datei konnte nicht hochgeladen werden. Bitte über die Zertifikatskarte erneut versuchen."
```

- [ ] **Step 9: Typecheck + tests + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npx tsc --noEmit
npm test -- --run
```

Expected: typecheck 0, tests 60/60 passing.

```bash
git add src/pages/DriverDetailPage.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
DriverDetailPage: SRC/CPC cert form accepts a file alongside structured info

SRC requires a file (mandatory cert in TR for commercial freight); CPC
accepts one as optional. After addCertificate succeeds, upload the file via
driverApi.uploadDocument('src' | 'cpc'). Upload failure is non-fatal — the
cert is created, the manager is toast-notified to retry from the cert card.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Extend `DocumentCategory` union (+4)

**Files:**
- Modify: `src/types/index.ts:220`

- [ ] **Step 1: Extend the union**

Replace line 220 of `src/types/index.ts`:

```ts
export type DocumentCategory = 'license' | 'src' | 'cpc' | 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
```

with:

```ts
export type DocumentCategory =
  | 'license'
  | 'src'
  | 'cpc'
  | 'compulsory-insurance'
  | 'comprehensive-insurance'
  | 'inspection'
  | 'tachograph'
  | 'k-certificate'
  | 'adr-vehicle'
  | 'adr-driver';
```

- [ ] **Step 2: Typecheck and capture the resulting error list**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: `tsc` reports errors on every `Record<DocumentCategory, string>` map that doesn't cover the new keys. Minimum expected hits:
- `src/components/common/SimpleDocumentUpdateModal.tsx` (around lines 77-85)
- `src/components/common/DocumentUploadModal.tsx` (around lines 83-92)

Capture terminal output to scratch notes. If other callers show up, add them to Task 3.

- [ ] **Step 3: Commit (type extension only, exhaustiveness errors intentional)**

```bash
git add src/types/index.ts
git commit -m "$(cat <<'EOF'
types: extend DocumentCategory with tachograph, k-certificate, adr-vehicle, adr-driver

Pure type change. Breaks Record<DocumentCategory, string> exhaustiveness
checks in the two document modals until Task 3 fills in the labels. A broken
tsc here is intentional and restored in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add category labels + i18n for the four new categories

**Files:**
- Modify: `src/components/common/SimpleDocumentUpdateModal.tsx:77-86`
- Modify: `src/components/common/DocumentUploadModal.tsx:83-93`
- Modify: `public/locales/tr/translation.json` (`categoryLabel`, `doc` blocks)
- Modify: `public/locales/en/translation.json` (same)
- Modify: `public/locales/de/translation.json` (same)

- [ ] **Step 1: Update `SimpleDocumentUpdateModal` label map**

Replace the existing `getCategoryLabel` function (lines ~77-86):

```tsx
const getCategoryLabel = (cat: DocumentCategory) => {
  const labels: Record<DocumentCategory, string> = {
    license: t('categoryLabel.license'),
    src: t('categoryLabel.src'),
    cpc: t('categoryLabel.cpc'),
    'compulsory-insurance': t('categoryLabel.compulsoryInsurance'),
    'comprehensive-insurance': t('categoryLabel.comprehensiveInsurance'),
    inspection: t('categoryLabel.inspection'),
    tachograph: t('categoryLabel.tachograph'),
    'k-certificate': t('categoryLabel.kCertificate'),
    'adr-vehicle': t('categoryLabel.adrVehicle'),
    'adr-driver': t('categoryLabel.adrDriver'),
  };
  return labels[cat];
};
```

- [ ] **Step 2: Same update in `DocumentUploadModal`**

Mirror the same map in `DocumentUploadModal.tsx:83-93`.

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0. Exhaustiveness errors resolved.

- [ ] **Step 4: Add `categoryLabel.*` and `doc.*` i18n keys — Turkish**

In `public/locales/tr/translation.json`, extend the existing `"categoryLabel"` block (lines 857-864) to:

```json
  "categoryLabel": {
    "license": "Ehliyet",
    "src": "SRC Belgesi",
    "cpc": "CPC Belgesi",
    "compulsoryInsurance": "Zorunlu Trafik Sigortası",
    "comprehensiveInsurance": "Kasko",
    "inspection": "Muayene",
    "tachograph": "Takograf Kalibrasyonu",
    "kCertificate": "K Yetki Belgesi",
    "adrVehicle": "ADR (Araç)",
    "adrDriver": "ADR (Sürücü)"
  },
```

Also extend the `"doc"` block (lines 876-883):

```json
  "doc": {
    "compulsoryInsurance": "Zorunlu Trafik Sigortası",
    "comprehensiveInsurance": "Kasko",
    "inspection": "Muayene",
    "license": "Ehliyet",
    "src": "SRC Belgesi",
    "cpc": "CPC Belgesi",
    "tachograph": "Takograf Kalibrasyonu",
    "kCertificate": "K Yetki Belgesi",
    "adrVehicle": "ADR (Araç)",
    "adrDriver": "ADR (Sürücü)"
  },
```

- [ ] **Step 5: Same keys — English**

`public/locales/en/translation.json`, both `categoryLabel` and `doc` blocks — append:

```json
    "tachograph": "Tachograph calibration",
    "kCertificate": "K-type transport permit",
    "adrVehicle": "ADR certificate (vehicle)",
    "adrDriver": "ADR certificate (driver)"
```

- [ ] **Step 6: Same keys — German**

`public/locales/de/translation.json`, both `categoryLabel` and `doc` blocks — append:

```json
    "tachograph": "Tachograph-Kalibrierung",
    "kCertificate": "K-Transportgenehmigung",
    "adrVehicle": "ADR-Zertifikat (Fahrzeug)",
    "adrDriver": "ADR-Zertifikat (Fahrer)"
```

- [ ] **Step 7: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npx tsc --noEmit
git add src/components/common/SimpleDocumentUpdateModal.tsx src/components/common/DocumentUploadModal.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
doc modals: add labels for tachograph, k-certificate, adr-vehicle, adr-driver

Extends both SimpleDocumentUpdateModal and DocumentUploadModal label maps
and adds matching i18n keys in TR, EN, DE. Restores TypeScript exhaustiveness
against the new DocumentCategory union members.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Render new document tiles on `TruckDetailPage`

**Files:**
- Modify: `src/pages/TruckDetailPage.tsx` (the existing three tiles live around lines 440-490)
- Modify: `public/locales/tr/translation.json` (new `truckDetail.*` action keys)
- Modify: `public/locales/en/translation.json` (same)
- Modify: `public/locales/de/translation.json` (same)

- [ ] **Step 1: Read the current tile structure**

Open `src/pages/TruckDetailPage.tsx` and locate the three existing document tiles around lines 440-490. Capture the exact JSX pattern (wrapper classes, button styling, expiry-badge component name/props). The new tiles will mirror this structure exactly, with two adjustments:

1. `date={null}` for the three new tiles — the Truck entity has no denormalized field for these categories, so the tile cannot read a cached expiry; the tile shows the "no document" state until the manager uploads one via the modal.
2. `onClick={() => handleDocumentUpdate('tachograph', null)}` — same pattern as the existing tiles, different category.

- [ ] **Step 2: Add three new tiles after the `inspection` tile**

Replicate the inspection tile's wrapper + button + expiry-badge pattern three times, substituting:

- `tachograph` / `truckDetail.docTachographAction` / `categoryLabel.tachograph`
- `k-certificate` / `truckDetail.docKCertificateAction` / `categoryLabel.kCertificate`
- `adr-vehicle` / `truckDetail.docAdrVehicleAction` / `categoryLabel.adrVehicle`

If the existing tile uses a label via `t('categoryLabel.compulsoryInsurance')` etc., use the matching label for each new tile. If it uses a local label text directly, follow the same convention.

Each new tile's JSX skeleton (to be adapted to the exact existing pattern):

```tsx
{/* tachograph */}
<div className="<same wrapper classes as inspection tile>">
  {/* title / icon / whatever the existing tile renders */}
  <button
    onClick={() => handleDocumentUpdate('tachograph', null)}
    className="<same button classes>"
  >
    {t('truckDetail.docTachographAction')}
  </button>
  {/* expiry-badge with date={null} */}
</div>
```

Repeat for k-certificate and adr-vehicle.

- [ ] **Step 3: Add i18n action keys**

TR:

```json
    "docTachographAction": "Takografı yönet",
    "docKCertificateAction": "K Belgesini yönet",
    "docAdrVehicleAction": "ADR Belgesini yönet"
```

EN:

```json
    "docTachographAction": "Manage tachograph",
    "docKCertificateAction": "Manage K-type permit",
    "docAdrVehicleAction": "Manage ADR (vehicle)"
```

DE:

```json
    "docTachographAction": "Tachograph verwalten",
    "docKCertificateAction": "K-Genehmigung verwalten",
    "docAdrVehicleAction": "ADR (Fahrzeug) verwalten"
```

Insert these keys wherever the existing `truckDetail.*` action keys live.

- [ ] **Step 4: Typecheck + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npx tsc --noEmit
git add src/pages/TruckDetailPage.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
TruckDetailPage: render tachograph, K-certificate, ADR-vehicle doc tiles

Each tile opens the existing SimpleDocumentUpdateModal filtered to the new
category. Tile-level expiry badge stays empty (date=null) — the backend
doesn't sync expiry to the Truck entity for these types; see the followup
note for the backend change needed to close that gap.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Render ADR-driver tile on `DriverDetailPage`

**Files:**
- Modify: `src/pages/DriverDetailPage.tsx` (near the existing `license` / `src` / `cpc` doc tiles — around line 595)
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/de/translation.json`

- [ ] **Step 1: Add one new tile after the cpc tile**

Mirror the existing cpc tile pattern with `category='adr-driver'`, `date={null}`, and the `driverDetail.docAdrDriverAction` label key.

- [ ] **Step 2: Add i18n keys**

TR: `"docAdrDriverAction": "ADR Belgesini yönet"`
EN: `"docAdrDriverAction": "Manage ADR certificate"`
DE: `"docAdrDriverAction": "ADR-Zertifikat verwalten"`

- [ ] **Step 3: Typecheck + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npx tsc --noEmit
git add src/pages/DriverDetailPage.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "DriverDetailPage: render adr-driver doc tile"
```

---

## Task 6: Cross-language smoke + build

**Files:** none (human-driven verification, automated checks)

- [ ] **Step 1: Run the full automated gate**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npx tsc --noEmit
npm test -- --run
npm run build
```

Expected: typecheck 0, tests 60/60 passing (baseline unchanged), build succeeds with no type errors.

- [ ] **Step 2: Ask the human controller to run TR/EN/DE browser smoke**

Produce this checklist for the human to execute against `npm run dev`:

- **TR** (default)
  - [ ] Driver detail → certificates tab → "Sertifika ekle" → pick `SRC` → fill number/dates → attempt submit with NO file → see "SRC belgesi için dosya yüklemek zorunlu" toast.
  - [ ] Same form → attach a small PDF → submit → see success toast → cert appears in the list AND the uploaded PDF appears in the driver's document history below.
  - [ ] Same form → pick `CPC` → fill number/dates → submit WITHOUT a file → succeeds (no file-required toast).
  - [ ] Driver detail → new "ADR Belgesini yönet" tile → opens modal with "ADR (Sürücü) Yönetimi" header → upload a test PDF → listed in the modal.
  - [ ] Truck detail → three new tiles (Takograf, K Belgesi, ADR (Araç)) → each opens modal with correct header → upload succeeds → document appears in the modal list.
- **EN** — language switcher → `Driver details` → cert form labels + required/optional marker show in English. Repeat the ADR/takograf tile smoke.
- **DE** — language switcher → same flow with German labels.

---

## Task 7: Followup note + push + PR

**Files:**
- Create: `docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md`

- [ ] **Step 1: Write the followup note**

```markdown
# Followup — backend sync for new document categories

## Why this exists
Phase B of the 2026-04-23 plan added `tachograph`, `k-certificate`, `adr-vehicle`, `adr-driver` as uploadable document categories. Documents persist correctly in `fleet.truck_documents` / `fleet.driver_documents`. However, the Truck/Driver entity's denormalized `*Expiry` columns (`compulsory_insurance_expiry`, `comprehensive_insurance_expiry`, `inspection_expiry`) are only populated for the original three truck categories — see `application/src/main/java/com/naklos/application/service/TruckDocumentService.java:195-224` switch statement.

Consequence: the Dashboard summary warnings computed in `src/utils/truckWarnings.ts` and `driverWarnings.ts` don't surface expiring tachograph / K / ADR documents. The document tiles on the truck/driver detail pages DO surface them (via the documents list fetched on demand).

## Scope of the followup

### Option 1 — Backend sync (recommended)
- `fleet.trucks` → add `tachograph_expiry`, `k_certificate_expiry`, `adr_vehicle_expiry` (LocalDate, nullable).
- `fleet.drivers` → add `adr_expiry` (LocalDate, nullable).
- Extend `TruckDocumentService.updateTruckExpiryDate` switch with the three new cases.
- Add a corresponding method in `DriverDocumentService`.
- Expose in DTOs and in `src/types/index.ts` Truck/Driver interfaces.
- Extend `truckWarnings.ts` / `driverWarnings.ts` with new warning branches + i18n `warning.*Missing|Expired|Expiring` keys.

Estimated effort: ~1 dev-day backend + ~0.5 day frontend.

### Option 2 — Frontend-only aggregation (rejected)
Fetch documents alongside the truck list and max-expiry on the client. Too chatty without a batch endpoint.

## Decision
TBD — Option 1 preferred. Raise as a separate branch + spec when prioritized.
```

- [ ] **Step 2: Commit the followup note**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md
git commit -m "docs: followup — backend sync for new doc categories deferred"
```

- [ ] **Step 3: Push the branch**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git push -u origin feat/add-form-doc-upload-and-new-categories
```

- [ ] **Step 4: Open PR**

```bash
gh pr create --title "SRC/CPC cert file upload + 4 new doc categories" --body "$(cat <<'EOF'
## Summary
- **SRC/CPC cert form:** now accepts a document file alongside the structured info. SRC requires the file; CPC keeps it optional. After `addCertificate` succeeds, the file is uploaded via `driverApi.uploadDocument('src' | 'cpc')`. Upload failure is non-fatal — the cert stays, the manager is notified to retry from the cert card.
- **Four new document categories:** tachograph, K-type transport permit, ADR (vehicle), ADR (driver). Uploadable and viewable from truck/driver detail pages. Backend already accepts arbitrary `document_type` strings (VARCHAR(50)) — no backend changes required.

## Backend impact
None. `document_type` is `VARCHAR(50)` with no enum. New categories flow through existing upload endpoints unchanged.

## Known limitation (deferred)
Dashboard summary warnings (via `truckWarnings.ts`, `driverWarnings.ts`) read the Truck/Driver entity's denormalized expiry columns, which only cover the original three truck categories + license. New category expiries surface on detail pages but not on the Dashboard. Tracked in `docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md`.

## Test plan
- [ ] Add an SRC cert WITHOUT a file — blocked with "dosya zorunlu" toast.
- [ ] Add an SRC cert WITH a file — cert created, file uploaded, both visible.
- [ ] Add a CPC cert without a file — succeeds, structured cert only.
- [ ] Add a CPC cert with a file — both persist.
- [ ] New TruckDetailPage tiles (tachograph, K, ADR-vehicle) open modal with correct header; uploads persist as their own `documentType`.
- [ ] New DriverDetailPage tile (ADR) same behavior.
- [ ] TR/EN/DE labels render correctly across all affected flows.
- [ ] Existing Dashboard + list warnings unchanged for the three original truck categories + license.
EOF
)"
```

---

## Self-review checklist (plan-author verification)

**Spec coverage:**
- SRC/CPC cert form accepts file (SRC required, CPC optional): Task R1 ✓
- Four new categories in `DocumentCategory`: Task 2 ✓
- Labels in both modals + i18n: Task 3 ✓
- TruckDetailPage new tiles: Task 4 ✓
- DriverDetailPage ADR tile: Task 5 ✓
- Backend sync deferred: Task 7 followup ✓

**Placeholder scan:** Step 2 of Task 4 refers to "the exact existing pattern" — this is intentional; the subagent is asked to mirror the existing tile rather than me reinventing it, because the exact JSX is in `TruckDetailPage.tsx:440-490` which the subagent will read. Same for Task 5 mirroring the CPC tile.

**Type consistency:** `DocumentCategory` additions (`tachograph`, `k-certificate`, `adr-vehicle`, `adr-driver`) propagate identically through modal label maps, tile handlers, and i18n keys.
