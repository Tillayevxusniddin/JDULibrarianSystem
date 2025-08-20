import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],

  preset: 'ts-jest/presets/default-esm',

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
