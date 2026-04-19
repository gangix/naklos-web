# Spec: Driver Settings Page

**Status:** Approved 2026-04-19
**Scope:** Frontend (naklos-web). No backend changes.
**Related audit:** Driver vs. manager navigation consistency — flagged that drivers have no dedicated settings surface while managers have `/manager/settings`.

## Goal

Give drivers a proper settings surface at `/driver/settings`, reachable from the `DriverTopBar` profile dropdown, with parity to the manager `UserMenu` → `SettingsPage` pattern. Move language preference out of the dropdown so the settings page is the single source of truth for app-level preferences.

## Non-goals

- **No notification preferences.** The backend has no per-driver notification toggles (`NotificationController.java` only exposes a manager-triggered expiring-documents job). Adding placeholder toggles would be dead UI.
- **No profile/document edits on this page.** Those already live on `DriverProfilePage` (`/driver/profile`) and stay there. The settings page links to it but does not duplicate fields.
- **No plan/usage/fleet settings.** Drivers don't own the fleet. Those sections remain manager-only.
- **No backend API changes.** Language already persists via `driverApi.updateLocale` (`SettingsPage.tsx:108-116`).

## Content

`DriverSettingsPage.tsx` renders four cards, each matching the visual style of `SettingsPage.tsx` (white rounded-xl with shadow-sm, section header on gray-50 band):

1. **Hesabım (Account)** — read-only identity block: name, email, role label (`t('settings.roleDriver')` → "Sürücü").
2. **Tercihler (Preferences)** — language `<Select>` (tr/en/de) using the same `handleLanguageChange` pattern as `SettingsPage.tsx:108-116` (calls `driverApi.updateLocale`, then `i18n.changeLanguage`, then `toast.success(t('toast.success.languageUpdated'))`).
3. **Profil ve Belgeler (Profile & Documents)** — card with short description + a single `NavLink` button ("Profilime git →") that routes to `/driver/profile`. Purpose: discoverability for drivers who open Settings looking for document/contact edits.
4. **Hakkında (About)** — app version/info footer, mirrors `SettingsPage.tsx:356-362`.

The page uses the standard `DriverLayout` chrome (top bar + bottom nav), not a bare page. Padding matches other driver pages (`p-4 pb-20`).

## Dropdown changes (`DriverTopBar.tsx`)

**Current** (lines 63-87): name header → `<LanguageSwitcher />` inline → logout.

**New:** name header → **Ayarlar** link (lucide `Settings` icon, routes to `/driver/settings`) → logout.

- The inline `LanguageSwitcher` import and the `<div className="px-4 py-3 border-b border-gray-100"><LanguageSwitcher /></div>` block are removed.
- The Ayarlar item uses the same styling recipe as manager `UserMenu.tsx:63-74` (NavLink, `flex items-center gap-2.5 px-4 py-2 text-sm`, active state `bg-primary-50 text-primary-700`).
- Dropdown closes on click (same `setOpen(false)` pattern).

## Routing

Add a new child route to the existing driver route group in `src/App.tsx` (currently declares `/driver/truck` at line 259 and `/driver/profile` at line 260). New entry: `<Route path="settings" element={<DriverSettingsPage />} />`. The parent `/driver` route already enforces the driver role gate, so no new auth logic.

## i18n

Reuse existing keys where possible:
- `nav.settings` → "Ayarlar" (already exists, used by `UserMenu.tsx:72`)
- `settings.language`, `settings.myPreferences`, `toast.success.languageUpdated` (already exist in messages)
- `settings.roleDriver`, `settings.title` (already exist)

New keys needed:
- `driverSettings.profileCard.title` → "Profil ve Belgeler"
- `driverSettings.profileCard.desc` → short Turkish description pointing to profile page
- `driverSettings.profileCard.cta` → "Profilime git"
- `driverSettings.about.title` → "Hakkında"

All three locale files get the same keys: `public/locales/tr/translation.json`, `public/locales/en/translation.json`, `public/locales/de/translation.json`. i18next is configured with `fallbackLng: 'tr'` (`src/i18n.ts:12`), so Turkish is the safety net.

## Testing

- Manual: log in as driver → open dropdown → tap "Ayarlar" → arrive at `/driver/settings`. Change language → confirm toast + UI re-renders in new locale. Tap "Profilime git" → arrive at `/driver/profile`. Tap logout from dropdown → signed out.
- No new unit tests required; the page is a thin composition of existing primitives (`<Select>`, `<NavLink>`, existing translation keys, existing `driverApi.updateLocale`).
- Visual check on mobile (375px) — each card full-width, comfortable tap targets, bottom nav doesn't overlap content (`pb-20`).

## Files touched

- **New:** `src/pages/driver/DriverSettingsPage.tsx`
- **Edit:** `src/components/layout/DriverTopBar.tsx` (swap `LanguageSwitcher` for `Settings` NavLink; drop the import)
- **Edit:** `src/App.tsx` — register `/driver/settings` inside the driver route group (around line 260, next to `profile`)
- **Edit:** `public/locales/tr/translation.json`, `public/locales/en/translation.json`, `public/locales/de/translation.json` — add four new keys listed above

## Rollout

- Single PR. No feature flag — it's additive UI gated to the already-existing driver role.
- Commit style: conventional commits, no co-author line. Feat: `feat(driver): dedicated settings page reachable from top-bar dropdown`.
- Post-merge: no ops steps. Cloudflare Worker redeploy picks it up automatically.