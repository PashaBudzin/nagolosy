import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const nodeConfig = {
  extends: [js.configs.recommended, tseslint.configs.recommended],
  languageOptions: {
    globals: globals.node,
  },
}

export default defineConfig([
  globalIgnores(['**/dist/**', '**/.turbo/**']),
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    ...nodeConfig,
    files: ['apps/web/vite.config.ts', 'apps/web/scripts/**/*.ts'],
  },
  {
    ...nodeConfig,
    files: ['apps/server/**/*.ts', 'api/**/*.ts'],
  },
  {
    // shadcn/ui components export variants alongside components.
    files: ['apps/web/src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
