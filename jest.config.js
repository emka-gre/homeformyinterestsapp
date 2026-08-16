/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Mirrors the path aliases in tsconfig.json — Jest doesn't read tsconfig
  // paths on its own, and Metro's resolution of them doesn't apply here.
  moduleNameMapper: {
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/shell/(.*)$': '<rootDir>/src/shell/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/app/**',
    '!**/*.d.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/'],
};
