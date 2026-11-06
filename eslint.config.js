import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default [
  { ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: { map: [['@', path.resolve(__dirname, 'src')]], extensions: ['.js', '.jsx'] },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react/prop-types': 'off',
      // Variant maps (cva) and provider factories are intentionally co-located
      // with their components; allow constant exports and disable the rule for
      // the provider/primitive layers instead of splitting files for HMR only.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          // Design-system primitives export their cva variant maps and the
          // query provider exports its client factory alongside the component.
          allowExportNames: ['buttonVariants', 'badgeVariants', 'createQueryClient'],
        },
      ],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'tests/**/*.{js,jsx}', '**/*.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
]
