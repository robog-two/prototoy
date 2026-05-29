import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'out',
      'build',
      '.git',
      '.claude',
      'coverage',
      '.prettierrc.js',
      'eslint.config.js',
      'jest.config.js',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.web.json', './tsconfig.node.json'],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React best practices
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Code quality
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      complexity: ['warn', { max: 10 }],

      // TypeScript
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['*.config.ts', '*.config.js', 'build/**/*'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',
      },
    },
  },
]
