//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import i18next from 'eslint-plugin-i18next'

export default [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  i18next.configs['flat/recommended'],
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
