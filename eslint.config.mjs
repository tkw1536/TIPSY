// @ts-check

import love from 'eslint-config-love'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import react from 'eslint-plugin-react'
import { fixupPluginRules } from '@eslint/compat'

const eslintPluginReactHooks = await (async () => {
  /** @type {any} */
  const broken = (await import('eslint-plugin-react-hooks')).default
  return fixupPluginRules(broken)
})()

const files = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
const testFiles = [
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.test.ts',
  '**/*.test.tsx',
]

export default [
  {
    ignores: ['dist/*', 'node_modules/*', '.yarn/*', '.yarnrc.yml'],
  },
  {
    ...love,
    files,
  },
  {
    rules: {
      // these may have made sense when optimization in js engines was worse
      // but these days it's good enough
      'complexity': ['off'],
      'max-nested-callbacks': ['off'],
      'max-lines': ['off'],

      // used for a bunch of warnings and nags at the user
      'no-console': ['off'],
      'no-alert': ['off'],

      // typeof x !== 'undefined' is much more readable.
      'no-negated-condition': ['off'],

      '@typescript-eslint/no-invalid-void-type': ['off'],
      '@typescript-eslint/no-unsafe-type-assertion': ['off'], // way too many false positives
      '@typescript-eslint/no-explicit-any': ['off'], // sometimes 'any' is helpful
      '@typescript-eslint/no-unsafe-assignment': ['off'], // sometimes 'any' is helpful

      '@typescript-eslint/require-await': ['off'], // conflicts with some of the other rules

      '@typescript-eslint/max-params': ['off'], // this is a bullshit rule that doesn't help

      // these rules have too many false positives ...
      '@typescript-eslint/no-magic-numbers': ['off'],
      '@typescript-eslint/prefer-destructuring': ['off'],
      '@typescript-eslint/class-methods-use-this': ['off'],
      '@typescript-eslint/no-empty-function': ['off'],
      '@typescript-eslint/init-declarations': ['off'],
      'promise/avoid-new': ['off'],
    },
    files,
  },
  // test overrides
  {
    rules: {
      // spying in test files is fine, so we disable this
      '@typescript-eslint/unbound-method': ['off'],
    },
    files: testFiles,
  },
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': eslintPluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/jsx-key': ['error'],
      'react/no-unused-state': ['error'],
      'react/prefer-stateless-function': ['error'],
      'react/no-unsafe': ['error'],

      'react-hooks/rules-of-hooks': ['error'],
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks:
            '(useAsyncEffect|useAsyncState|useEffectWithSnapshot|useComponentWillUnmount)',
        },
      ],
    },
    settings: {
      react: {
        version: '16.0',
        pragma: 'h',
      },
    },
  },
]
