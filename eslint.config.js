import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The codebase uses the standard "fetch on mount → setState" pattern
      // throughout (FuelCountsContext, MaintenanceWarningsContext, etc.).
      // The "correct" React 19 fix is to adopt TanStack Query / Suspense /
      // useSyncExternalStore — a codebase-wide refactor we'll do once we
      // have customer signal. Until then, downgrade to a warning so the
      // lint output stays meaningful for genuine bugs.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
