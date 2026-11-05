/** Jest cho app (SRS 10.1: kiểm thử tích hợp). Engine và dữ liệu dùng node:test ở packages/. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
