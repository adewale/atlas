import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    launchOptions: {
      executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    },
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30000,
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
