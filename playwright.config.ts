import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  // No retries: a retry turns a flaky test into a silent pass. Converted
  // specs ran with --retries=0 (see tests/e2e/helpers/settle.ts).
  retries: 0,
  forbidOnly: !!process.env.CI,
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
      // WebKit at a mobile viewport — closest available engine to iOS Safari.
      // Scoped to the dropcap-overlap spec only (not the full suite). NOTE:
      // Playwright's Linux WebKit re-resolves canvas fonts after load, so it
      // does NOT reproduce the real iOS-Safari sticky-canvas bug — this is a
      // no-overlap smoke check, not proof of the measurement-cache fix.
      name: 'webkit-mobile',
      testMatch: /dropcap-overlap\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
      },
    },
    // iPhone 15 Pro Max / 16 Pro Max / 17 viewports are covered by
    // mobile-screenshots.spec.ts, which CI runs in the desktop project; the
    // per-device projects that duplicated them were never run.
  ],
});
