# Add-form document upload + new document categories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Let managers upload required documents (compulsory insurance, comprehensive insurance, inspection for trucks; license for drivers) *during* the Add Truck / Add Driver flow, so freshly created records don't spawn with `MISSING_DOCS` flags. (2) Add four new document categories — `tachograph`, `k-certificate`, `adr-vehicle`, `adr-driver` — across the UI so Turkish fleet compliance requirements are fully covered. Everything shippable as a pure frontend change: the backend stores `document_type` as `VARCHAR(50)` with no enum constraint.

**Architecture:** Phase A extends `AddTruckModal.tsx` and `AddDriverModal.tsx` with optional file+expiry inputs. On submit, the modal first calls the existing create endpoint (`truckApi.register` / `driverApi.register`), then sequentially calls the existing `truckApi.uploadDocument` / `driverApi.uploadDocument` endpoints for every file the user attached. Upload failures after a successful create are non-fatal: the truck/driver exists, the user can upload later via the detail page. Phase B extends the `DocumentCategory` union in `src/types/index.ts`, adds category labels to the two existing document modals, wires new i18n keys, and renders new document tiles on `TruckDetailPage.tsx` / `DriverDetailPage.tsx`.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, react-i18next (TR/EN/DE), Vitest + happy-dom, existing `truckApi` / `driverApi` service wrappers. Backend (Java / Spring, repo at `/Users/olcay.bilir/IdeaProjects/naklos`) is untouched.

**Backend capability check — DONE:**
- `fleet-module/src/main/java/com/naklos/fleet/domain/TruckDocument.java:31-32` — `document_type` is a free-form `VARCHAR(50)`, no enum. Any string ≤50 chars accepted.
- `fleet-module/src/main/java/com/naklos/fleet/domain/DriverDocument.java:31-32` — same.
- `application/src/main/java/com/naklos/application/service/TruckDocumentService.java:195-224` — the service syncs `expiryDate` from the uploaded document to Truck entity fields (`compulsoryInsuranceExpiry`, `comprehensiveInsuranceExpiry`, `inspectionExpiry`) only for the three existing categories. New categories hit the `default` branch — the document is stored but no Truck entity field is populated. **Consequence:** the Dashboard summary warnings (which read the denormalized truck fields via `utils/truckWarnings.ts`) WILL NOT surface expiring tachograph/K/ADR documents. Detail page tiles (which read the documents list directly) WILL surface them. Closing this gap for new categories is a **followup backend task** — out of scope for this plan; documented in `followup.md` at the end.

**Where code lives:** `naklos-web` repo only. Zero backend commits.

**Branch:** cut `feat/add-form-doc-upload-and-new-categories` from `main` in `naklos-web` before Task 1.

**Out of scope:**
- Adding backend Truck/Driver entity fields for new categories so the Dashboard summary picks them up. Captured as a followup.
- Touching `SRC`/`CPC` certificate records (the `driverApi.addCertificate` structured-cert flow). The `ProfessionalCertificate` path and the uploaded-document path are currently parallel — aligning them is a separate refactor.
- The full maintenance / service-history module (odometer-driven bakım schedule, work orders, parts, service expenses). That's a separate spec — tracked in `followup.md`.
- Any migration of existing info-only rows that lack a file. Existing records remain as-is; uploads happen on demand.
- DocumentUploadModal's `PhotoCapture` flow (driver-mobile). This plan touches only the manager desktop flow; the driver-mobile photo-capture screen already handles the existing six categories and continues to do so.

**Testing philosophy:** No new business logic is introduced — only wiring and string maps. TypeScript's `Record<DocumentCategory, string>` exhaustiveness checks already catch forgotten category labels at compile time. Therefore:
- **Compile-time gates:** `npm run typecheck` (or `tsc --noEmit`) must pass after every TypeScript change — catches missing category labels in the `Record<DocumentCategory, string>` maps.
- **Unit tests:** added only for pure-logic changes (none here beyond a label-map sanity spec in Task 9).
- **Browser verification:** every task that changes a rendered modal or page ends with "run dev server → open page → verify in TR/EN/DE → attach document → observe warnings."
- **Commit discipline:** commit after every task. No multi-task commits.

---

## File Structure

All paths relative to `/Users/olcay.bilir/IdeaProjects/naklos-web/`.

### Created
```
(none — this plan only modifies existing files)
```

### Modified — Phase A
```
src/components/common/AddTruckModal.tsx                      ~175 → ~260 lines (+ doc upload section)
src/components/common/AddDriverModal.tsx                     ~200 → ~245 lines (+ license file input)
public/locales/tr/translation.json                           (+12 keys under addTruck.*, addDriver.*)
public/locales/en/translation.json                           (+12 keys)
public/locales/de/translation.json                           (+12 keys)
```

### Modified — Phase B
```
src/types/index.ts                                           DocumentCategory union expanded (+4)
src/components/common/SimpleDocumentUpdateModal.tsx          categoryLabel map +4 entries
src/components/common/DocumentUploadModal.tsx                categoryLabel map +4 entries
src/pages/TruckDetailPage.tsx                                +3 doc tiles (tachograph, k-certificate, adr-vehicle)
src/pages/DriverDetailPage.tsx                               +1 doc tile (adr-driver)
src/components/common/AddTruckModal.tsx                      +3 optional fields
src/components/common/AddDriverModal.tsx                     +1 optional ADR field
public/locales/tr/translation.json                           +4 categoryLabel, +4 doc.*, +4 truck/driver modal labels
public/locales/en/translation.json                           same
public/locales/de/translation.json                           same
```

### Created (docs)
```
docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md   (tail of this plan, written at the end)
```

---

## Task 0: Branch + environment prep

**Files:** none (environment task)

- [ ] **Step 1: Confirm clean working tree**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git status --short
```

Expected: empty output (other than the untracked `.docx` / `.pptx` / `SCREENSHOT_GUIDE.md` / `Screenshot*.png` files already present on `main`; those are unrelated and should remain untracked).

- [ ] **Step 2: Cut the feature branch**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git checkout main
git pull
git checkout -b feat/add-form-doc-upload-and-new-categories
```

Expected: `Switched to a new branch 'feat/add-form-doc-upload-and-new-categories'`.

- [ ] **Step 3: Install deps + verify baseline build**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npm install
npx tsc --noEmit
npm test -- --run
```

Expected:
- `npm install` finishes clean (or reports it's already up-to-date).
- `tsc --noEmit` exits with status 0, no output.
- `npm test -- --run` prints the existing test suite passing. Note baseline pass count so regressions later are obvious.

- [ ] **Step 4: Boot the dev server in the background for later browser checks**

Run (in a separate terminal or background):
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/` (or similar). Leave running for every browser-verify step below. Kill at the end.

---

## Phase A — Upload documents during Add flow

Phase A ships without any new categories or i18n surface beyond localized labels for the new form inputs. No change to the DocumentCategory type. No change to TruckDetailPage/DriverDetailPage.

### Task 1: Extend `AddTruckModal` state + UI for three optional document uploads

**Files:**
- Modify: `src/components/common/AddTruckModal.tsx` (lines 38-76 for state + submit; lines 110-167 for JSX)

**Goal of this task:** Let the user attach a file + expiry date for each of the three truck documents (`compulsory-insurance`, `comprehensive-insurance`, `inspection`) while adding a truck. Do not yet fire the uploads — that's Task 2. This split keeps the UI diff and the submit diff reviewable independently.

- [ ] **Step 1: Add state fields + a helper type for the three optional docs**

Inside the `AddTruckModal` function, right above `const [formData, setFormData] = useState({...})`, insert:

```tsx
type TruckDocFormEntry = { file: File | null; expiryDate: string };
type TruckDocKey = 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
const emptyDoc: TruckDocFormEntry = { file: null, expiryDate: '' };
```

Then, after the existing `const [formData, setFormData] = useState({...})` block, add:

```tsx
const [docs, setDocs] = useState<Record<TruckDocKey, TruckDocFormEntry>>({
  'compulsory-insurance': { ...emptyDoc },
  'comprehensive-insurance': { ...emptyDoc },
  'inspection': { ...emptyDoc },
});

const updateDoc = (key: TruckDocKey, patch: Partial<TruckDocFormEntry>) => {
  setDocs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
};
```

- [ ] **Step 2: Add a collapsible "upload documents now (optional)" section below the existing volume input**

Import `FileInput` alongside the existing form fields at the top of the file:

```tsx
import { FileInput, Select, TextInput } from './FormField';
```

Then, inside the `<form>` (after the existing `Hacim (m³)` `TextInput`, before the buttons `<div>`), insert:

```tsx
<div className="pt-4 border-t border-gray-200">
  <details className="group">
    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-primary-600 list-none flex items-center justify-between">
      <span>{t('addTruck.docsSectionTitle')}</span>
      <span className="text-xs text-gray-500 group-open:hidden">{t('addTruck.docsSectionExpand')}</span>
      <span className="text-xs text-gray-500 hidden group-open:inline">{t('addTruck.docsSectionCollapse')}</span>
    </summary>
    <p className="mt-2 text-xs text-gray-600">{t('addTruck.docsSectionHint')}</p>

    <div className="mt-3 space-y-4">
      {(['compulsory-insurance', 'comprehensive-insurance', 'inspection'] as const).map((key) => (
        <div key={key} className="rounded-lg border border-gray-200 p-3 space-y-2">
          <p className="text-sm font-medium text-gray-900">{t(`categoryLabel.${
            key === 'compulsory-insurance' ? 'compulsoryInsurance'
            : key === 'comprehensive-insurance' ? 'comprehensiveInsurance'
            : 'inspection'
          }`)}</p>
          <FileInput
            label={t('addTruck.docFileLabel')}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(file) => updateDoc(key, { file })}
            selectedFileName={docs[key].file?.name ?? null}
          />
          <TextInput
            label={t('addTruck.docExpiryLabel')}
            type="date"
            value={docs[key].expiryDate}
            onChange={(e) => updateDoc(key, { expiryDate: e.target.value })}
          />
        </div>
      ))}
    </div>
  </details>
</div>
```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0, no output. If `FileInput`'s `onChange` signature doesn't match `(file: File | null) => void`, adjust the lambda — inspect `src/components/common/FormField.tsx` to confirm the signature and tweak this step's JSX accordingly (the rest of the task is unaffected).

- [ ] **Step 4: Add the new i18n keys — Turkish**

In `public/locales/tr/translation.json`, inside the `"addTruck": { ... }` block (lines ~986-999), add these keys before the closing `}`:

```json
    "docsSectionTitle": "Belgeleri şimdi yükle (isteğe bağlı)",
    "docsSectionHint": "Aşağıdaki belgeleri şimdi yükleyebilirsin; boş bırakırsan araç \"belge eksik\" olarak işaretlenir ve sonra detay sayfasından ekleyebilirsin.",
    "docsSectionExpand": "Aç",
    "docsSectionCollapse": "Kapat",
    "docFileLabel": "Belge dosyası (PDF veya fotoğraf)",
    "docExpiryLabel": "Geçerlilik tarihi",
    "docUploadFailedToast": "Araç oluşturuldu ancak bazı belgeler yüklenemedi: {{names}}. Detay sayfasından tekrar dener misin?"
```

Make sure a comma precedes these keys (i.e., the previous key line ends with `,`).

- [ ] **Step 5: Add the same keys in English**

In `public/locales/en/translation.json`, find `"addTruck"` and add:

```json
    "docsSectionTitle": "Upload documents now (optional)",
    "docsSectionHint": "You can upload these documents now; leaving them blank marks the truck as \"missing documents\" — you can add them later from the detail page.",
    "docsSectionExpand": "Expand",
    "docsSectionCollapse": "Collapse",
    "docFileLabel": "Document file (PDF or photo)",
    "docExpiryLabel": "Expiry date",
    "docUploadFailedToast": "Truck created, but some documents failed to upload: {{names}}. Please retry from the detail page."
```

- [ ] **Step 6: Add the same keys in German**

In `public/locales/de/translation.json`, find `"addTruck"` and add:

```json
    "docsSectionTitle": "Dokumente jetzt hochladen (optional)",
    "docsSectionHint": "Du kannst diese Dokumente jetzt hochladen; wenn du sie leer lässt, wird das Fahrzeug als \"Dokumente fehlen\" markiert — du kannst sie später über die Detailseite ergänzen.",
    "docsSectionExpand": "Öffnen",
    "docsSectionCollapse": "Schließen",
    "docFileLabel": "Dokumentdatei (PDF oder Foto)",
    "docExpiryLabel": "Ablaufdatum",
    "docUploadFailedToast": "Fahrzeug angelegt, aber einige Dokumente konnten nicht hochgeladen werden: {{names}}. Bitte über die Detailseite erneut versuchen."
```

- [ ] **Step 7: Browser verify the UI**

Dev server already running from Task 0. Open `http://localhost:5173/`. Log in as a manager (same credentials you normally use locally). Navigate to `Araçlar` page → click `+ Araç Ekle`. Verify:
- Modal opens with the three existing fields.
- New collapsible section "Belgeleri şimdi yükle (isteğe bağlı)" is visible below the volume input.
- Clicking the summary toggles three document sub-panels (insurance, kasko, muayene).
- Each sub-panel has a file picker + date picker.
- Attach a small PDF + a date for one of them.
- Switch language to English and German via the language switcher — labels update without page reload.
- **Do not click Submit yet** — Task 2 wires the submit logic. For now, clicking Submit will create the truck but the attached file is dropped (not a regression — the previous behavior). Click cancel.

- [ ] **Step 8: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add src/components/common/AddTruckModal.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
AddTruckModal: collapsible section for optional doc upload (UI only)

Adds UI scaffolding — file + expiry inputs for compulsory-insurance,
comprehensive-insurance, inspection — collected into form state but not
yet uploaded. Task 2 wires submit.
EOF
)"
```

---

### Task 2: Wire `AddTruckModal` submit to upload attached documents after truck create

**Files:**
- Modify: `src/components/common/AddTruckModal.tsx` (handleSubmit, lines ~46-77)

- [ ] **Step 1: Import `truckApi` if not already referenced for upload**

At the top, confirm `import { truckApi } from '../../services/api';` — it's already there. Also import `toast`:

```tsx
import { toast } from 'sonner';
```

- [ ] **Step 2: Replace `handleSubmit` to upload docs after create**

Replace the existing `handleSubmit` function body (the block that starts `const handleSubmit = async (e: React.FormEvent) => {` and ends with the matching `};`) with:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // 1. Create the truck via onSubmit prop or default register endpoint.
    let createdTruckId: string | undefined;
    if (onSubmit) {
      const result = await onSubmit(formData);
      onSuccess(result ? { relinkedFuelEntryCount: result.relinkedFuelEntryCount ?? 0 } : undefined);
      // fuel-review path doesn't surface the new truck id; we skip uploads there —
      // the user can add docs from the detail page. Keep behavior unchanged.
    } else {
      const created = await truckApi.register({ ...formData, fleetId }) as { id: string };
      createdTruckId = created?.id;
      onSuccess();
    }

    // 2. Upload any attached documents. Non-fatal on failure: truck already exists.
    if (createdTruckId) {
      const failed: string[] = [];
      for (const [key, entry] of Object.entries(docs) as [TruckDocKey, TruckDocFormEntry][]) {
        if (!entry.file || !entry.expiryDate) continue;
        try {
          await truckApi.uploadDocument(createdTruckId, entry.file, key, entry.expiryDate);
        } catch (err) {
          console.error(`Failed to upload ${key} for new truck ${createdTruckId}`, err);
          const labelKey =
            key === 'compulsory-insurance' ? 'categoryLabel.compulsoryInsurance'
            : key === 'comprehensive-insurance' ? 'categoryLabel.comprehensiveInsurance'
            : 'categoryLabel.inspection';
          failed.push(t(labelKey));
        }
      }
      if (failed.length) {
        toast.warning(t('addTruck.docUploadFailedToast', { names: failed.join(', ') }));
      }
    }

    // Reset state and close.
    setFormData({
      plateNumber: prefillPlate ?? '',
      type: 'SMALL_TRUCK',
      capacityKg: 3500,
      cargoVolumeM3: 20,
    });
    setDocs({
      'compulsory-insurance': { ...emptyDoc },
      'comprehensive-insurance': { ...emptyDoc },
      'inspection': { ...emptyDoc },
    });
    onClose();
  } catch (err) {
    console.error('Error creating truck:', err);
    setError(err instanceof Error ? err.message : t('addTruck.errorAddingTruck'));
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0. If `truckApi.register`'s return type is too loose (`Promise<any>`) and the cast fails, confirm the assertion `as { id: string }` matches the existing pattern in `AddDriverModal.tsx:36-39`.

- [ ] **Step 4: Browser verify end-to-end (happy path)**

Dev server still running.

1. Open the `Araçlar` page → `+ Araç Ekle`.
2. Fill plate `34 TEST 001`, type `TIR`, leave capacity/volume defaults.
3. Expand the docs section. Attach a small PDF + future date for `Zorunlu Trafik Sigortası`. Leave the other two blank.
4. Click `Araç Ekle`.
5. Expected outcomes:
   - Modal closes, toast success (from the parent page's `onSuccess` handling, if any).
   - The new truck appears in the list with `Trafik Sigortası` expiry populated.
   - Open the truck's detail page. `Belgeler` tab lists the uploaded PDF. `Muayene` and `Kasko` tiles still show "belge yok" / expiring warnings.
6. Open browser DevTools Network tab — confirm two POST requests: `/api/trucks` (201) and `/api/trucks/{id}/documents/upload` (200).

- [ ] **Step 5: Browser verify end-to-end (failure path)**

Simulate a failed upload to confirm the error doesn't block truck creation:
1. Open DevTools → Network → right-click on a recent upload request → block URL pattern `**/documents/upload`.
2. Add a second test truck `34 TEST 002` with a Kasko PDF + date attached.
3. Expected:
   - `/api/trucks` returns 201 — truck is created.
   - `/documents/upload` fails (blocked).
   - Modal still closes, but a warning toast appears: "Araç oluşturuldu ancak bazı belgeler yüklenemedi: Kasko. Detay sayfasından tekrar dener misin?"
4. Unblock the URL pattern afterwards.

- [ ] **Step 6: Clean up test data**

Delete the two test trucks from the list UI before committing.

- [ ] **Step 7: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add src/components/common/AddTruckModal.tsx
git commit -m "$(cat <<'EOF'
AddTruckModal: upload attached docs after successful create

Sequentially calls truckApi.uploadDocument for each file the user attached
in the collapsible section. Upload failures are non-fatal: the truck already
exists, the user is notified via toast and can retry from the detail page.
The fuel-review flow (onSubmit path) still skips uploads — it doesn't surface
the new truck id.
EOF
)"
```

---

### Task 3: Extend `AddDriverModal` to accept an optional license file

**Files:**
- Modify: `src/components/common/AddDriverModal.tsx` (state + submit + JSX)

Note: driver SRC/CPC is stored as `ProfessionalCertificate` via a separate endpoint (`driverApi.addCertificate`) AND as a document via `driverApi.uploadDocument`. The two flows aren't aligned in the current codebase. To keep scope tight, Task 3 only handles the `license` category. ADR-driver arrives in Task 9 (Phase B), SRC/CPC alignment is out of scope.

- [ ] **Step 1: Add state for the license file + update form reset**

Inside `AddDriverModal`, below the existing `useState({ ... })` block, add:

```tsx
const [licenseFile, setLicenseFile] = useState<File | null>(null);
```

- [ ] **Step 2: Add the FileInput right below the license expiry date input**

Import `FileInput`:

```tsx
import { FileInput, Select, TextInput } from './FormField';
```

After the existing `<TextInput label={t('addDriver.licenseExpiryDate')} ... />` (around line 158), insert:

```tsx
<FileInput
  label={t('addDriver.licenseFileLabel')}
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(file) => setLicenseFile(file)}
  selectedFileName={licenseFile?.name ?? null}
/>
```

- [ ] **Step 3: Update `handleSubmit` to upload the license after register**

Replace the existing `handleSubmit` body with:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const { licenseExpiryDate, ...registerPayload } = formData;
    const created = await driverApi.register({
      ...registerPayload,
      temporaryPassword: formData.temporaryPassword || undefined,
    }) as { id: string };

    if (licenseExpiryDate && created?.id) {
      try {
        await driverApi.updateLicense(created.id, licenseExpiryDate);
      } catch (err) {
        console.error('License expiry post-register update failed', err);
      }
    }

    // New: upload license file if attached.
    if (licenseFile && licenseExpiryDate && created?.id) {
      try {
        await driverApi.uploadDocument(created.id, licenseFile, 'license', licenseExpiryDate);
      } catch (err) {
        console.error('License file upload post-register failed', err);
        toast.warning(t('addDriver.licenseUploadFailedToast'));
      }
    }

    // Reset form and close
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseClass: 'C',
      licenseExpiryDate: '',
      temporaryPassword: '',
    });
    setLicenseFile(null);
    onSuccess();
    onClose();
  } catch (err) {
    console.error('Error creating driver:', err);
    setError(err instanceof Error ? err.message : t('addDriver.errorAddingDriver'));
  } finally {
    setLoading(false);
  }
};
```

Add `import { toast } from 'sonner';` at the top if not already present.

- [ ] **Step 4: Add i18n keys in all three locales**

Turkish (`public/locales/tr/translation.json`, inside `"addDriver": { ... }`):

```json
    "licenseFileLabel": "Ehliyet dosyası (PDF veya fotoğraf) — isteğe bağlı",
    "licenseUploadFailedToast": "Sürücü oluşturuldu ancak ehliyet dosyası yüklenemedi. Detay sayfasından tekrar dener misin?"
```

English:

```json
    "licenseFileLabel": "Driver's license file (PDF or photo) — optional",
    "licenseUploadFailedToast": "Driver created, but the license file failed to upload. Please retry from the detail page."
```

German:

```json
    "licenseFileLabel": "Führerscheindatei (PDF oder Foto) — optional",
    "licenseUploadFailedToast": "Fahrer angelegt, aber die Führerscheindatei konnte nicht hochgeladen werden. Bitte über die Detailseite erneut versuchen."
```

- [ ] **Step 5: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 6: Browser verify**

1. Navigate to `Sürücüler` → `+ Sürücü Ekle`.
2. Fill name, phone, email, license number/class/expiry, attach a license PDF, set a temp password.
3. Submit. Expect: driver created, network tab shows `/api/drivers` (201), `/api/drivers/{id}/license` (200), `/api/drivers/{id}/documents/upload` (200).
4. Open the driver's detail page → documents tab → license doc is present.
5. Delete the test driver.

- [ ] **Step 7: Commit**

```bash
git add src/components/common/AddDriverModal.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
AddDriverModal: optional license file upload during driver create

If the manager attaches a file (alongside the license expiry date, which is
already required for the 'missing docs' gate to clear), upload it via
driverApi.uploadDocument('license') immediately after register + license-expiry
update. Non-fatal on failure.
EOF
)"
```

---

### Task 4: Phase A checkpoint — PR draft

**Files:** none (branch/PR task)

- [ ] **Step 1: Push branch**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git push -u origin feat/add-form-doc-upload-and-new-categories
```

- [ ] **Step 2: Confirm with user before opening PR**

Ask the user whether to:
1. Open a PR for Phase A only and ship it now (iterative release), or
2. Continue into Phase B and bundle both phases into one PR.

Do not open a PR until the user chooses. If choice is (1), use:

```bash
gh pr create --title "Add-form doc upload: trucks (3 docs) + drivers (license)" --body "$(cat <<'EOF'
## Summary
- AddTruckModal gains an optional collapsible section to attach file + expiry for compulsory-insurance, comprehensive-insurance, inspection during create.
- AddDriverModal gains an optional license file input next to the license expiry date.
- Upload runs sequentially after the create call. Failures are non-fatal — the record is created, the manager is notified via toast and can retry from the detail page.

## Test plan
- [ ] Create a truck with all three docs attached; confirm all three land in the documents table and the Truck entity's expiry fields are populated.
- [ ] Create a truck with only one doc attached; the other two still show "missing".
- [ ] Block the upload URL, create a truck with a doc attached; expect warning toast and truck present without the doc.
- [ ] Create a driver with a license file + date; confirm license doc shows on detail page.
- [ ] TR / EN / DE labels render correctly in both modals.
EOF
)"
```

---

## Phase B — Four new document categories: tachograph, K-certificate, ADR (vehicle + driver)

Phase B is a set of fan-out changes. None introduce new business logic; they all extend lookups and JSX.

### Task 5: Extend `DocumentCategory` union and verify exhaustive switches

**Files:**
- Modify: `src/types/index.ts:220` (DocumentCategory)

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

- [ ] **Step 2: Typecheck and capture the errors**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: `tsc` reports errors on every `Record<DocumentCategory, string>` map that doesn't cover the new keys — these are the sites we need to fix in Tasks 6 and 7. Capture the list (copy terminal output into scratch notes). Minimum expected hits:
- `src/components/common/SimpleDocumentUpdateModal.tsx` — categoryLabel map (lines ~77-85)
- `src/components/common/DocumentUploadModal.tsx` — categoryLabel map (lines ~83-92)

If other sites show up (e.g., a new consumer we didn't know about), add tasks for them before Task 8.

- [ ] **Step 3: Commit (type extension only)**

```bash
git add src/types/index.ts
git commit -m "$(cat <<'EOF'
types: extend DocumentCategory with tachograph, k-certificate, adr-vehicle, adr-driver

Pure type change; breaks the Record<DocumentCategory, string> maps in the
two document modals. Tasks 6 and 7 will backfill them.
EOF
)"
```

(A broken-compile commit is fine on a feature branch — the next tasks immediately restore it. We split here so the type change is auditable.)

---

### Task 6: Add category labels to both document modals

**Files:**
- Modify: `src/components/common/SimpleDocumentUpdateModal.tsx:77-86`
- Modify: `src/components/common/DocumentUploadModal.tsx:83-93`

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

- [ ] **Step 2: Update `DocumentUploadModal` label map**

Apply the same extension to `DocumentUploadModal.tsx` `getCategoryLabel` (lines ~83-93):

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

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Add the `categoryLabel.*` and `doc.*` i18n keys — Turkish**

In `public/locales/tr/translation.json`, extend the existing `"categoryLabel"` block (lines 857-864):

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

- [ ] **Step 5: Same keys in English**

`public/locales/en/translation.json`:

```json
    "tachograph": "Tachograph calibration",
    "kCertificate": "K-type transport permit",
    "adrVehicle": "ADR certificate (vehicle)",
    "adrDriver": "ADR certificate (driver)"
```

Add to both `categoryLabel` and `doc` blocks.

- [ ] **Step 6: Same keys in German**

`public/locales/de/translation.json`:

```json
    "tachograph": "Tachograph-Kalibrierung",
    "kCertificate": "K-Transportgenehmigung",
    "adrVehicle": "ADR-Zertifikat (Fahrzeug)",
    "adrDriver": "ADR-Zertifikat (Fahrer)"
```

Add to both `categoryLabel` and `doc` blocks.

- [ ] **Step 7: Typecheck + quick browser sanity**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Open an existing truck detail page → open the Zorunlu Sigorta doc modal → confirm it still renders the old label. (Full rendering of new categories arrives in Task 8.)

- [ ] **Step 8: Commit**

```bash
git add src/components/common/SimpleDocumentUpdateModal.tsx src/components/common/DocumentUploadModal.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
doc modals: add labels for tachograph, k-certificate, adr-vehicle, adr-driver

Extends both SimpleDocumentUpdateModal and DocumentUploadModal label maps and
adds matching i18n keys in TR, EN, DE. Restores TypeScript exhaustiveness
against the new DocumentCategory union members introduced in the previous
commit.
EOF
)"
```

---

### Task 7: Render new document tiles on `TruckDetailPage`

**Files:**
- Modify: `src/pages/TruckDetailPage.tsx` (near the existing `compulsory-insurance` / `comprehensive-insurance` / `inspection` tiles — roughly lines 440-490 per the earlier grep)

- [ ] **Step 1: Read the current tile structure**

Open `src/pages/TruckDetailPage.tsx`. Locate the three existing `DocumentTile` / similar elements for `compulsoryInsurance`, `comprehensiveInsurance`, `inspection` (around lines 440-490). Capture the exact JSX pattern used, including:
- The prop that drives the expiry date (`date={truck.compulsoryInsuranceExpiry}` etc.)
- The `onClick={() => handleDocumentUpdate('compulsory-insurance', truck.compulsoryInsuranceExpiry)}` pattern
- Any icon/label/grid layout

The new tiles will mirror this exactly, with two adjustments:
1. `date={null}` for tachograph/K/ADR-vehicle — the Truck entity has no denormalized field for these categories (documented in the header); the tile shows only the "belge yok" badge until the expiry date can be pulled from the uploaded doc.
2. `handleDocumentUpdate('tachograph', null)`, `handleDocumentUpdate('k-certificate', null)`, `handleDocumentUpdate('adr-vehicle', null)` — the category string drives which docs the `SimpleDocumentUpdateModal` filters on.

- [ ] **Step 2: Add three new tiles right after the `inspection` tile**

Replicate the `inspection` tile pattern three times. Each tile:

```tsx
{/* tachograph */}
<div className="..."> {/* copy exact wrapper classes from the inspection tile */}
  <button
    onClick={() => handleDocumentUpdate('tachograph', null)}
    className="..." {/* same as inspection */}
  >
    {t('truckDetail.docTachographAction')}
  </button>
  <DocumentExpiryBadge
    category="tachograph"
    date={null}
  />
</div>
```

(Substitute the actual badge component name / props from the inspection tile. If the component requires a non-null date, follow its null-handling API — usually showing "belge yok" when null.)

Repeat for `k-certificate` and `adr-vehicle` with appropriate labels.

- [ ] **Step 3: Add i18n keys for the new tile actions**

TR, EN, DE — inside the relevant `truckDetail` (or whatever the existing key is):

```json
    "docTachographAction": "Takografı yönet",
    "docKCertificateAction": "K Belgesini yönet",
    "docAdrVehicleAction": "ADR Belgesini yönet"
```

(and their EN/DE equivalents, e.g. "Manage tachograph", "Manage K-type permit", "Manage ADR (vehicle)".)

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

- [ ] **Step 5: Browser verify**

Dev server running. Open an existing truck's detail page. Expected:
- The original three doc tiles render as before.
- Three new tiles appear below them (tachograph, K belgesi, ADR).
- Clicking any new tile opens the `SimpleDocumentUpdateModal` with the new category label in the header ("Takograf Kalibrasyonu Yönetimi" etc.).
- Upload a small test PDF + future date → confirm the document appears in the modal's list. Confirm `/api/trucks/{id}/documents` now returns a row with `documentType: "tachograph"`.
- Reload the page. The tile still has no expiry badge populated (expected per plan header — backend doesn't sync to Truck entity for new types). The uploaded doc still appears inside the modal.
- Delete the test document.

- [ ] **Step 6: Commit**

```bash
git add src/pages/TruckDetailPage.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
TruckDetailPage: render tachograph, K-certificate, ADR-vehicle doc tiles

Each tile opens the existing SimpleDocumentUpdateModal filtered to the new
category. Tile-level expiry badge stays empty for new categories — the
backend doesn't sync expiry to the Truck entity for these types (see plan
header; backend sync deferred to followup).
EOF
)"
```

---

### Task 8: Render ADR-driver tile on `DriverDetailPage`

**Files:**
- Modify: `src/pages/DriverDetailPage.tsx` (near the existing `license` / `src` / `cpc` tiles — around line 595 per the earlier grep)

- [ ] **Step 1: Add one new tile after the cpc tile**

Mirror the cpc tile pattern, substituting `category='adr-driver'`:

```tsx
{/* adr-driver */}
<div className="...">
  <button
    onClick={() => handleDocumentUpdate('adr-driver', null)}
    className="..."
  >
    {t('driverDetail.docAdrDriverAction')}
  </button>
  <DocumentExpiryBadge category="adr-driver" date={null} />
</div>
```

- [ ] **Step 2: Add i18n key**

TR: `"docAdrDriverAction": "ADR Belgesini yönet"`
EN: `"docAdrDriverAction": "Manage ADR certificate"`
DE: `"docAdrDriverAction": "ADR-Zertifikat verwalten"`

- [ ] **Step 3: Typecheck + browser verify**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Open a driver's detail page. Confirm the ADR tile renders, the modal opens, a test upload lands as `documentType: "adr-driver"`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DriverDetailPage.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "DriverDetailPage: render adr-driver doc tile"
```

---

### Task 9: Extend `AddTruckModal` with three new optional doc rows (tachograph, K, ADR-vehicle)

**Files:**
- Modify: `src/components/common/AddTruckModal.tsx` (the `docs` state + the map in the docs section)

- [ ] **Step 1: Extend the state keys**

Update the earlier `TruckDocKey` type:

```tsx
type TruckDocKey =
  | 'compulsory-insurance'
  | 'comprehensive-insurance'
  | 'inspection'
  | 'tachograph'
  | 'k-certificate'
  | 'adr-vehicle';
```

And the initial state object:

```tsx
const [docs, setDocs] = useState<Record<TruckDocKey, TruckDocFormEntry>>({
  'compulsory-insurance': { ...emptyDoc },
  'comprehensive-insurance': { ...emptyDoc },
  'inspection': { ...emptyDoc },
  'tachograph': { ...emptyDoc },
  'k-certificate': { ...emptyDoc },
  'adr-vehicle': { ...emptyDoc },
});
```

And the reset call in `handleSubmit`:

```tsx
setDocs({
  'compulsory-insurance': { ...emptyDoc },
  'comprehensive-insurance': { ...emptyDoc },
  'inspection': { ...emptyDoc },
  'tachograph': { ...emptyDoc },
  'k-certificate': { ...emptyDoc },
  'adr-vehicle': { ...emptyDoc },
});
```

- [ ] **Step 2: Extend the JSX map**

In the docs section, replace the array literal with:

```tsx
{(['compulsory-insurance', 'comprehensive-insurance', 'inspection', 'tachograph', 'k-certificate', 'adr-vehicle'] as const).map((key) => (
```

And replace the inline label switch:

```tsx
<p className="text-sm font-medium text-gray-900">{t(`categoryLabel.${
  key === 'compulsory-insurance' ? 'compulsoryInsurance'
  : key === 'comprehensive-insurance' ? 'comprehensiveInsurance'
  : key === 'inspection' ? 'inspection'
  : key === 'tachograph' ? 'tachograph'
  : key === 'k-certificate' ? 'kCertificate'
  : 'adrVehicle'
}`)}</p>
```

- [ ] **Step 3: Update the toast failure label lookup**

Inside the upload loop's catch:

```tsx
const labelKey =
  key === 'compulsory-insurance' ? 'categoryLabel.compulsoryInsurance'
  : key === 'comprehensive-insurance' ? 'categoryLabel.comprehensiveInsurance'
  : key === 'inspection' ? 'categoryLabel.inspection'
  : key === 'tachograph' ? 'categoryLabel.tachograph'
  : key === 'k-certificate' ? 'categoryLabel.kCertificate'
  : 'categoryLabel.adrVehicle';
```

- [ ] **Step 4: Typecheck + browser verify**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Open the Add Truck modal, expand the docs section — now shows 6 doc rows (3 existing + 3 new). Create a test truck with one of the new docs attached. Confirm the document appears on the detail page's new tile, with the correct category.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/AddTruckModal.tsx
git commit -m "AddTruckModal: include tachograph, K-certificate, ADR-vehicle in the optional docs section"
```

---

### Task 10: Extend `AddDriverModal` with ADR-driver optional upload

**Files:**
- Modify: `src/components/common/AddDriverModal.tsx`

- [ ] **Step 1: Add state + FileInput + expiry date**

Alongside the existing `licenseFile` state:

```tsx
const [adrFile, setAdrFile] = useState<File | null>(null);
const [adrExpiry, setAdrExpiry] = useState('');
```

After the license file input, insert:

```tsx
<div className="border-t border-gray-200 pt-4 space-y-2">
  <p className="text-sm font-medium text-gray-900">{t('categoryLabel.adrDriver')} — {t('addDriver.optional')}</p>
  <FileInput
    label={t('addDriver.adrFileLabel')}
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={(file) => setAdrFile(file)}
    selectedFileName={adrFile?.name ?? null}
  />
  <TextInput
    label={t('addDriver.adrExpiryLabel')}
    type="date"
    value={adrExpiry}
    onChange={(e) => setAdrExpiry(e.target.value)}
  />
</div>
```

- [ ] **Step 2: Upload ADR doc after register**

In `handleSubmit`, after the license-upload block, add:

```tsx
if (adrFile && adrExpiry && created?.id) {
  try {
    await driverApi.uploadDocument(created.id, adrFile, 'adr-driver', adrExpiry);
  } catch (err) {
    console.error('ADR upload post-register failed', err);
    toast.warning(t('addDriver.adrUploadFailedToast'));
  }
}
```

And in the reset:

```tsx
setAdrFile(null);
setAdrExpiry('');
```

- [ ] **Step 3: Add i18n keys (TR/EN/DE)**

TR:

```json
    "optional": "isteğe bağlı",
    "adrFileLabel": "ADR belgesi dosyası",
    "adrExpiryLabel": "ADR geçerlilik tarihi",
    "adrUploadFailedToast": "Sürücü oluşturuldu ancak ADR belgesi yüklenemedi. Detay sayfasından tekrar dener misin?"
```

EN:

```json
    "optional": "optional",
    "adrFileLabel": "ADR certificate file",
    "adrExpiryLabel": "ADR expiry date",
    "adrUploadFailedToast": "Driver created, but the ADR certificate failed to upload. Please retry from the detail page."
```

DE:

```json
    "optional": "optional",
    "adrFileLabel": "ADR-Zertifikatsdatei",
    "adrExpiryLabel": "ADR-Ablaufdatum",
    "adrUploadFailedToast": "Fahrer angelegt, aber das ADR-Zertifikat konnte nicht hochgeladen werden. Bitte über die Detailseite erneut versuchen."
```

- [ ] **Step 4: Typecheck + browser verify**

Same pattern as earlier tasks. Submit the Add Driver form with an ADR file attached → confirm `/api/drivers/{id}/documents/upload` fires twice (license + ADR) → detail page shows both.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/AddDriverModal.tsx public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "AddDriverModal: optional ADR-driver upload during create"
```

---

### Task 11: Full cross-language smoke pass

**Files:** none (manual verification)

- [ ] **Step 1: TR**

Walk the full matrix:
- Add Truck with all 6 doc types attached. Verify each lands as the correct documentType in the truck documents API response.
- Add Driver with license + ADR attached. Same verification.
- Existing 3 truck docs show populated expiry on the truck list / dashboard; new 3 don't (expected — documented in header).
- Existing 3 driver doc tiles (license/SRC/CPC) behave as before; new ADR tile surfaces the uploaded doc via the modal.

- [ ] **Step 2: EN**

Switch to English, redo the Add Truck flow. Confirm all 6 doc labels render in English.

- [ ] **Step 3: DE**

Switch to German, redo. Confirm all 6 doc labels render in German.

- [ ] **Step 4: Run the full test suite one more time**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npm test -- --run
```

Expected: baseline count unchanged. No new test targets were added in Phase B (intentional), so total should match Task 0's baseline.

- [ ] **Step 5: Run build**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npm run build
```

Expected: clean build, no type errors, bundle size diff is small (+labels, +JSX for three tiles).

---

### Task 12: Phase B PR + followup note

**Files:**
- Create: `docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md`

- [ ] **Step 1: Write the followup note**

Create `docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md` with:

```markdown
# Followup — backend sync for new document categories

## Why this exists
The Phase B work added `tachograph`, `k-certificate`, `adr-vehicle`, `adr-driver` as uploadable document categories. Documents persist correctly in `fleet.truck_documents` / `fleet.driver_documents`. However, the Truck/Driver entity's denormalized `*Expiry` columns (`compulsory_insurance_expiry`, `comprehensive_insurance_expiry`, `inspection_expiry`) are only populated for the original three truck categories — see `application/src/main/java/com/naklos/application/service/TruckDocumentService.java:195-224` `switch` statement.

Consequence: the Dashboard summary warnings computed in `src/utils/truckWarnings.ts` and `driverWarnings.ts` don't surface expiring tachograph / K / ADR documents. The document tiles on the truck/driver detail pages DO surface them (via the documents list fetched on demand).

## Scope of the followup
Two options:

### Option 1 — Backend sync (recommended)
Add the following nullable columns + sync logic:
- `fleet.trucks` → add `tachograph_expiry`, `k_certificate_expiry`, `adr_vehicle_expiry` (LocalDate, nullable).
- `fleet.drivers` → add `adr_expiry` (LocalDate, nullable).
- Extend `TruckDocumentService.updateTruckExpiryDate` switch with the three new cases.
- Add a corresponding method in `DriverDocumentService` (currently limited to license expiry).
- Expose in Truck/Driver DTOs and in `src/types/index.ts` Truck/Driver interfaces.
- Extend `truckWarnings.ts` / `driverWarnings.ts` with three / one new warning branches + i18n `warning.*Missing|Expired|Expiring` keys.

Estimated effort: ~1 dev-day backend + ~0.5 day frontend.

### Option 2 — Frontend-only aggregation (cheaper, slower page loads)
On the Dashboard and list pages, fetch documents via `/api/trucks/{id}/documents` alongside the truck list. Client-side pick the max-expiry for each category. Downside: N+1 or a batch endpoint we don't yet have. Rejected unless backend work is blocked.

## Decision
TBD — pick Option 1. Raise as a separate branch + spec when prioritized.
```

- [ ] **Step 2: Commit the followup note**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md
git commit -m "docs: followup note — backend sync for new doc categories deferred"
```

- [ ] **Step 3: Push and open PR**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git push
gh pr create --title "Add-form doc upload (Phase A) + 4 new doc categories (Phase B)" --body "$(cat <<'EOF'
## Summary
- **Phase A:** optional document upload during Add Truck / Add Driver flows (3 truck docs + driver license).
- **Phase B:** four new categories — tachograph, K-certificate, ADR (vehicle + driver) — uploadable from Add forms and from existing detail-page tiles.

## Backend impact
None. `document_type` is `VARCHAR(50)` with no enum. New categories flow through existing upload endpoints unchanged.

## Known limitation (deferred)
Dashboard summary warnings (via `truckWarnings.ts`, `driverWarnings.ts`) read the Truck/Driver entity's denormalized expiry columns, which only cover the original three truck categories + license. New category expiries surface on detail pages but not on the Dashboard. Tracked in `docs/superpowers/plans/2026-04-23-add-form-doc-upload-and-new-doc-categories-followup.md`.

## Test plan
- [ ] Create a truck with all 6 doc types attached; each lands as its own `documentType` row.
- [ ] Create a driver with license + ADR attached; each lands as its own `documentType` row.
- [ ] New detail-page tiles open the existing `SimpleDocumentUpdateModal` filtered to the new category.
- [ ] Existing Dashboard + list warnings unchanged for the three original truck categories + license.
- [ ] TR/EN/DE labels render correctly across all add forms and detail tiles.
- [ ] Blocking `/documents/upload` returns warning toast; record still created.
EOF
)"
```

---

## Self-review checklist (done by plan author, not agent)

**Spec coverage:**
- Add form upload for trucks (3 docs): Task 1, 2, 9 ✓
- Add form upload for drivers (license): Task 3 ✓
- Add form upload for drivers (ADR-driver, new category): Task 10 ✓
- New DocumentCategory union: Task 5 ✓
- Modal label maps updated: Task 6 ✓
- i18n for new categories: Task 6 (labels), Task 7-10 (per-page) ✓
- New tiles on Truck detail: Task 7 ✓
- New tile on Driver detail: Task 8 ✓
- Known backend-sync gap: Task 12 followup ✓

**Placeholder scan:** None — every code block is complete, every filename is exact.

**Type consistency:** `TruckDocKey`, `TruckDocFormEntry`, `emptyDoc`, `DocumentCategory` consistent across tasks. Label keys `categoryLabel.*` / `addTruck.*` / `addDriver.*` / `truckDetail.*` / `driverDetail.*` consistent.
