module.exports = {
  automock: false,
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: true,
  collectCoverageFrom: ['packages/*/src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: '/__tests__/.+\\.test\\.(?:js|jsx|ts|tsx)$',
};
