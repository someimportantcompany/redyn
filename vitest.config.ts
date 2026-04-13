import path from 'path';
import { defineConfig } from 'vitest/config';

const env = {
  AWS_ACCESS_KEY_ID: 'ExampleAccessKey',
  AWS_SECRET_ACCESS_KEY: 'ExampleSecretAccessKey',
  AWS_SESSION_TOKEN: '',
  AWS_REGION: 'local',
  DYNAMODB_ENDPOINT: 'http://localhost:32777',
  DYNAMODB_TABLE: 'redyn-local-table',
  TZ: 'UTC',
};

Object.assign(process.env, env);

export default defineConfig({
  test: {
    dir: __dirname,
    globals: true,
    globalSetup: path.join(__dirname, './vitest.setup.ts'),
    // We don't want to run integration-tests from here
    include: ['src/**/*.spec.ts'],
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'html'],
    //   include: ['src/**'],
    // },
    alias: {
      '@/src': path.join(__dirname, './src'),
      '@/test': path.join(__dirname, './test'),
    },
    env,
  },
});
