import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import { defineConfig } from 'eslint/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig([
  {
    ignores: ['dist/', 'node_modules/'],
  },

  // Base JS + TS configs
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // Your custom overrides come last
  {
    files: ['src/**/*.{js,mjs,cjs,ts}', 'prisma/**/*.ts'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      quotes: [2, 'single', { avoidEscape: true }],
      semi: [2, 'never'],
      'max-len': ['error', { code: 120 }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'lf',
        },
      ],
    },
  },
])
