import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: 'iphone15promax',
      use: {
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'iphone16promax',
      use: {
        viewport: { width: 440, height: 956 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'iphone17',
      use: {
        viewport: { width: 440, height: 956 },
        deviceScaleFactor: 3,
      },
    },
  ],
});
