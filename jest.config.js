const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/e2e/**',
    '!**/tests/**',
    '!**/playwright/**',
    '!lib/shared/supabase/proxy.ts'
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/tests/', // Playwright e2e tests (run with npm run test:e2e)
  ],
  coverageThreshold: {
    global: {
      branches: 44,
      functions: 56,
      lines: 57,
      statements: 58,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
