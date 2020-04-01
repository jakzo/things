module.exports = {
  automock: false,
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
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
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.tsbuild/'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: '/__tests__/.+\\.test\\.(?:ts|tsx)$',
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
};
