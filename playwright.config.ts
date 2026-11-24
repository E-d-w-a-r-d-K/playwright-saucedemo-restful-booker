import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
      stylePath: './tests/visual/screenshot.css',
    },
  },
  fullyParallel: true,
  forbidOnly: isCI,
  // No retries for UI and visual tests: a flaky UI test must show up, not be hidden.
  retries: 0,
  workers: isCI ? 2 : undefined,
  // Baselines are written only on purpose (npm run test:visual:update), never as a side effect of a run:
  // otherwise a test that is expected to differ could become the new baseline.
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      detail: true,
      suiteTitle: true,
      environmentInfo: { UI: env.ui.baseUrl, API: env.api.baseUrl, Node: process.version, OS: process.platform },
    }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      // saucedemo marks elements with data-test, not Playwright's default data-testid
      use: { ...devices['Desktop Chrome'], baseURL: env.ui.baseUrl, testIdAttribute: 'data-test' },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      // a fixed viewport and scale factor so screenshots are comparable between runs
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        baseURL: env.ui.baseUrl,
        testIdAttribute: 'data-test',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      // restful-booker is a shared public sandbox on Heroku that sometimes answers 503 or wakes up slowly;
      // one retry on CI absorbs that for API tests only. A retried pass is reported as "flaky", not hidden.
      retries: isCI ? 1 : 0,
      use: {
        baseURL: env.api.baseUrl,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
