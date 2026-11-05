/** Jest cho app (SRS 10.1: kiểm thử tích hợp). Engine và dữ liệu dùng node:test ở packages/. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  // Độ phủ lớp lưu trữ / nghiệp vụ / store. Adapter expo-sqlite và client chỉ chạy trên máy thật.
  collectCoverageFrom: [
    'src/db/**/*.ts',
    'src/domain/**/*.ts',
    'src/store/**/*.ts',
    '!src/**/__tests__/**',
    '!src/db/testing/**',
    '!src/db/expoSqlite.ts',
    '!src/db/client.ts',
  ],
  coverageThreshold: { global: { lines: 85 } },
};
