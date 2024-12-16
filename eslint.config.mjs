import path from 'node:path'

import { getEslintConfig } from '@espcom/eslint-config'

const eslintConfig = getEslintConfig({
  tsConfigPath: path.resolve('./tsconfig.json'),
})

Object.assign(eslintConfig[0].rules, {
  'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
  'no-underscore-dangle': ['off'],
  '@typescript-eslint/no-floating-promises': ['off'],
  '@typescript-eslint/consistent-type-definitions': ['off'],
  'no-plusplus': ['off'],
  'max-params': ['off'],
  '@typescript-eslint/array-type': ['off'],
  '@typescript-eslint/naming-convention': ['off'],
  'prettier/prettier': [
    'warn',
    {
      semi: false,
      tabWidth: 2,
      proseWrap: 'never',
      printWidth: 100,
      arrowParens: 'always',
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      bracketSameLine: false,
    },
  ],
})

export default eslintConfig