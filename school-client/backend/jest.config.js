// Jest configuration for the client backend.
// Runs all test files under __tests__, collects coverage from src, and skips server.js.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  verbose: true,
};
