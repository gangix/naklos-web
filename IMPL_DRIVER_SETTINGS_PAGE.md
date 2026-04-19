# Driver Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/driver/settings` page reachable from the `DriverTopBar` profile dropdown, with language preference, an account identity card, a navigational link to the driver profile/documents page, and an "About" footer. Move language out of the dropdown so settings becomes its single source of truth.

**Architecture:** New leaf route `/driver/settings` under the existing driver route group in `App.tsx`. Page composed of four cards using the same primitives (`<Select>`, `<NavLink>`, lucide icons) and style tokens (`bg-white rounded-xl shadow-sm`, Plus Jakarta Sans, primary-600) already present on `DriverProfilePage` and `SettingsPage`. Dropdown (`DriverTopBar.tsx`) swaps its inline `<LanguageSwitcher />` for an "Ayarlar" `NavLink`. No backend changes — language persistence already exists via `driverApi.updateLocale`.

**Tech Stack:** React 19 + React Router 7 + Tailwind + Plus Jakarta Sans + lucide-react + i18next (HttpBackend loading `/public/locales/{lng}/translation.json`) + sonner toasts.

---

## Design direction

Applies to Task 3 (the page itself). Informs visual choices so the result reads as continuous with the rest of the driver shell, not a generic scaffold.

- **Hierarchy.** Page title `text-2xl font-extrabold tracking-tight text-gray-900` (matches `DriverProfilePage.tsx:203`). Section headers use a small-caps eyebrow: `text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500` *above* the card body title — the same label vocabulary already used inside `DriverTopBar.tsx:66` and `UserMenu.tsx:55` for the "Hesap" label. This keeps chrome and content on the same typographic key.
- **Card structure.** Each card is `bg-white rounded-xl shadow-sm border border-gray-100 p-5`, with internal layout `space-y-4`. No `.card-header` gray bands (those live on the manager `SettingsPage` which is denser) — driver pages are airier, one-screen-per-task.
- **Motion.** Cards appear with `animate-[fadeIn_140ms_ease-out]` and a staggered `animation-delay` of 0ms / 60ms / 120ms / 180ms so the page feels composed, not slammed in. Same easing as the dropdown at `DriverTopBar.tsx:64` — one authored feel.
- **Language control.** Use the existing `<Select>` primitive (`components/common/FormField`) with three options. Do not build a custom segmented switcher — the primitive already handles focus rings and hit targets consistently with the rest of the app.
- **Profile card affordance.** Visual CTA with a lucide `UserCircle` icon in a `rounded-xl bg-primary-50 text-primary-600 w-10 h-10 grid place-items-center` tile on the left, title + hint in the middle, `ChevronRight` on the right. A single clickable row (using `<NavLink>` so the whole card navigates). Not just a linked button.
- **About card.** Plainer than the others — `bg-transparent p-4 text-center`, no shadow/border. Acts as a signature at the page bottom, not a primary surface.

---

## File structure

- **Create:** `src/pages/driver/DriverSettingsPage.tsx` — the page itself. ~140 LOC.
- **Modify:** `src/components/layout/DriverTopBar.tsx` — drop inline `LanguageSwitcher`, add `Ayarlar` `NavLink`.
- **Modify:** `src/App.tsx` — register `/driver/settings` route next to `/driver/profile` (around line 260).
- **Modify:** `public/locales/tr/translation.json` — add 4 new keys.
- **Modify:** `public/locales/en/translation.json` — same 4 keys, English values.
- **Modify:** `public/locales/de/translation.json` — same 4 keys, German values.

---

## Task 1: Add i18n keys (all three locales)

**Files:**
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/de/translation.json`

- [ ] **Step 1: Add keys to Turkish locale**

Find the top-level object in `public/locales/tr/translation.json`. Add (or merge into existing) a `driverSettings` object:

```json
"driverSettings": {
  "pageTitle": "Ayarlar",
  "pageSubtitle": "Hesap ve uygulama tercihlerin",
  "accountCard": {
    "eyebrow": "Hesap",
    "roleLabel": "Sürücü"
  },
  "preferencesCard": {
    "eyebrow": "Tercihler",
    "languageHint": "Uygulama arayüzünün görüntüleneceği dili seç."
  },
  "profileCard": {
    "eyebrow": "Profil",
    "title": "Profil ve Belgeler",
    "desc": "Kişisel bilgilerini düzenle, ehliyet ve sertifika belgelerini güncelle.",
    "cta": "Profilime git"
  },
  "about": {
    "version": "Naklos Sürücü • v1.0.0"
  }
}
```

- [ ] **Step 2: Add keys to English locale**

Add the same structure to `public/locales/en/translation.json`:

```json
"driverSettings": {
  "pageTitle": "Settings",
  "pageSubtitle": "Your account and app preferences",
  "accountCard": {
    "eyebrow": "Account",
    "roleLabel": "Driver"
  },
  "preferencesCard": {
    "eyebrow": "Preferences",
    "languageHint": "Choose the language the app is displayed in."
  },
  "profileCard": {
    "eyebrow": "Profile",
    "title": "Profile & Documents",
    "desc": "Edit your personal info and update license/certification documents.",
    "cta": "Go to my profile"
  },
  "about": {
    "version": "Naklos Driver • v1.0.0"
  }
}
```

- [ ] **Step 3: Add keys to German locale**

Add to `public/locales/de/translation.json`:

```json
"driverSettings": {
  "pageTitle": "Einstellungen",
  "pageSubtitle": "Deine Konto- und App-Einstellungen",
  "accountCard": {
    "eyebrow": "Konto",
    "roleLabel": "Fahrer"
  },
  "preferencesCard": {
    "eyebrow": "Einstellungen",
    "languageHint": "Wähle die Anzeigesprache der App."
  },
  "profileCard": {
    "eyebrow": "Profil",
    "title": "Profil & Dokumente",
    "desc": "Persönliche Daten bearbeiten und Führerschein/Zertifikate aktualisieren.",
    "cta": "Zu meinem Profil"
  },
  "about": {
    "version": "Naklos Fahrer • v1.0.0"
  }
}
```

- [ ] **Step 4: Validate JSON**

Run: `npx --yes jsonlint-cli public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json`
Expected: no errors (three files validate cleanly).

If `jsonlint-cli` isn't available, use Node directly:

```bash
node -e "JSON.parse(require('fs').readFileSync('public/locales/tr/translation.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('public/locales/en/translation.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('public/locales/de/translation.json','utf8'))"
```

Expected: no output (parse succeeded).

- [ ] **Step 5: Commit**

```bash
git add public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git commit -m "feat(i18n): add driverSettings keys for tr/en/de"
```

---

## Task 2: Create DriverSettingsPage component

**Files:**
- Create: `src/pages/driver/DriverSettingsPage.tsx`

- [ ] **Step 1: Write the component**

Create `src/pages/driver/DriverSettingsPage.tsx` with the following content:

```tsx
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/api';
import { Select } from '../../components/common/FormField';

/** Driver-scoped settings surface. Kept intentionally narrow: identity
 *  summary, language preference (canonical home — removed from the top-bar
 *  dropdown), a navigational link to the profile/documents page, and an
 *  About footer. Profile edits and document uploads continue to live on
 *  DriverProfilePage. */
const DriverSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const handleLanguageChange = async (locale: string) => {
    try {
      await driverApi.updateLocale(locale);
      i18n.changeLanguage(locale);
      toast.success(t('toast.success.languageUpdated'));
    } catch {
      toast.error(t('toast.error.generic'));
    }
  };

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-3">
      {children}
    </p>
  );

  return (
    <div className="p-4 pb-20">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {t('driverSettings.pageTitle')}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('driverSettings.pageSubtitle')}
        </p>
      </div>

      {/* Card 1 — Account (read-only identity) */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.accountCard.eyebrow')}</Eyebrow>
        <p className="text-base font-semibold text-gray-900">{user?.name ?? '—'}</p>
        {user?.email && (
          <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          {t('driverSettings.accountCard.roleLabel')}
        </p>
      </div>

      {/* Card 2 — Preferences (language) */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.preferencesCard.eyebrow')}</Eyebrow>
        <Select
          label={t('settings.language')}
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </Select>
        <p className="text-xs text-gray-500 mt-2">
          {t('driverSettings.preferencesCard.languageHint')}
        </p>
      </div>

      {/* Card 3 — Profile & Documents (navigational) */}
      <NavLink
        to="/driver/profile"
        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 hover:bg-gray-50 active:bg-gray-100 transition-colors animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.profileCard.eyebrow')}</Eyebrow>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center flex-shrink-0">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {t('driverSettings.profileCard.title')}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('driverSettings.profileCard.desc')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </NavLink>

      {/* About footer */}
      <div
        className="pt-6 pb-2 text-center animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
      >
        <p className="text-xs text-gray-500">{t('driverSettings.about.version')}</p>
      </div>
    </div>
  );
};

export default DriverSettingsPage;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: passes (no errors referencing `DriverSettingsPage.tsx`). If `Select` or `driverApi.updateLocale` have different signatures than assumed, TypeScript flags it here.

- [ ] **Step 3: Commit**

```bash
git add src/pages/driver/DriverSettingsPage.tsx
git commit -m "feat(driver): add DriverSettingsPage with account, language, profile link"
```

---

## Task 3: Register the route in App.tsx

**Files:**
- Modify: `src/App.tsx:39-40,258-261`

- [ ] **Step 1: Add import next to existing driver-page imports**

Open `src/App.tsx`. Find line 39-40:

```tsx
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverTruckPage from './pages/driver/DriverTruckPage';
```

Change to:

```tsx
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverSettingsPage from './pages/driver/DriverSettingsPage';
import DriverTruckPage from './pages/driver/DriverTruckPage';
```

- [ ] **Step 2: Add route inside driver route group**

Find lines 258-261:

```tsx
<Route index element={<Navigate to="/driver/truck" replace />} />
<Route path="truck" element={<DriverTruckPage />} />
<Route path="profile" element={<DriverProfilePage />} />
</Route>
```

Change to:

```tsx
<Route index element={<Navigate to="/driver/truck" replace />} />
<Route path="truck" element={<DriverTruckPage />} />
<Route path="profile" element={<DriverProfilePage />} />
<Route path="settings" element={<DriverSettingsPage />} />
</Route>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: passes, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(driver): register /driver/settings route"
```

---

## Task 4: Update DriverTopBar dropdown

**Files:**
- Modify: `src/components/layout/DriverTopBar.tsx:1-94`

- [ ] **Step 1: Swap imports — remove LanguageSwitcher, add NavLink + Settings icon**

Open `src/components/layout/DriverTopBar.tsx`. Find lines 1-6:

```tsx
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Truck, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
```

Change to:

```tsx
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Settings, Truck, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
```

(Removed the `LanguageSwitcher` import, added `Settings` to the lucide imports.)

- [ ] **Step 2: Replace the inline LanguageSwitcher block with a Settings NavLink**

Find lines 73-75 (the language switcher block inside the dropdown):

```tsx
              <div className="px-4 py-3 border-b border-gray-100">
                <LanguageSwitcher />
              </div>
```

Change to:

```tsx
              <div className="py-1 border-b border-gray-100">
                <NavLink
                  to="/driver/settings"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('nav.settings', { defaultValue: 'Ayarlar' })}</span>
                </NavLink>
              </div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: passes. No unused-import warnings for `LanguageSwitcher` (we removed the import).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/DriverTopBar.tsx
git commit -m "feat(driver): replace inline language switcher with Settings link in top-bar dropdown"
```

---

## Task 5: End-to-end manual verification

**Files:**
- None (verification only)

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Vite starts on localhost (port shown in output).

- [ ] **Step 2: Log in as a driver**

In the browser, log in with a driver account (or use the dev user switcher on `/driver/profile` if the environment is `DEV`).

- [ ] **Step 3: Verify dropdown**

- Click the avatar/chevron in the top-right of the driver shell.
- Dropdown shows: **name header** at top, **Ayarlar** row with gear icon, **Çıkış** row with red logout icon at the bottom.
- No language switcher inside the dropdown.
- Keyboard: `Esc` closes the dropdown. Click-away closes it.

- [ ] **Step 4: Navigate to Settings**

- Click **Ayarlar** in the dropdown.
- URL becomes `/driver/settings`.
- Dropdown closes on click.
- Page renders with four sections: account card, preferences card with language select, profile link card, About footer.
- Cards fade in with staggered delay (subtle — not glaringly obvious).

- [ ] **Step 5: Verify language preference**

- Change language select from `Türkçe` to `English`.
- Toast appears: "Language updated" (or equivalent English copy).
- UI re-renders in English (page title = "Settings", etc.).
- Reload the page — language persists (backend stored it via `driverApi.updateLocale`).
- Switch back to Türkçe before moving on.

- [ ] **Step 6: Verify profile navigation**

- On the settings page, tap the "Profil ve Belgeler" card.
- URL becomes `/driver/profile`.
- DriverProfilePage renders with personal info and documents as before.

- [ ] **Step 7: Verify logout still works**

- Navigate back to any driver page, open the dropdown, click **Çıkış**.
- Expected: auth cleared, redirected to login.

- [ ] **Step 8: Mobile viewport check**

- In devtools, switch to a 375×812 viewport.
- Reload `/driver/settings`.
- Each card is full-width with comfortable padding.
- Bottom tab bar doesn't overlap the About footer (`pb-20` keeps it clear).
- Language select is tap-friendly (≥44px tall).

- [ ] **Step 9: No regressions on the rest of the driver shell**

- Check `/driver/truck` still renders.
- Check `/driver/profile` still renders and edits still save.
- Check bottom nav still works.

- [ ] **Step 10: No commit for verification task**

(Verification produces no code changes.)

---

## Self-review checklist

- [x] **Spec coverage.** Spec section → task mapping:
  - "Hesabım card" → Task 2 Card 1
  - "Tercihler card (language)" → Task 2 Card 2
  - "Profil ve Belgeler link card" → Task 2 Card 3
  - "Hakkında footer" → Task 2 About footer
  - "Dropdown: add Ayarlar, remove LanguageSwitcher" → Task 4
  - "Routing at App.tsx:260" → Task 3
  - "i18n keys in tr/en/de" → Task 1
  - "Manual test plan" → Task 5
- [x] **No placeholders.** Every step contains the exact code/command.
- [x] **Type consistency.** `driverApi.updateLocale(locale: string)` signature matches usage in `SettingsPage.tsx:110`. `<Select>` primitive from `components/common/FormField` takes `label/value/onChange` per the same file (`SettingsPage.tsx:248-257`).
- [x] **Commit style.** Conventional commits, no co-author line, per user preferences in memory.