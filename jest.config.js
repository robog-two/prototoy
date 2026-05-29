/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)', '<rootDir>/src/**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/renderer/src/**/*.{ts,tsx}',
    '!src/renderer/src/**/*.d.ts',
    '!src/renderer/src/**/index.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/out/'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/renderer/src/setupTests.ts'],
}

module.exports = config
