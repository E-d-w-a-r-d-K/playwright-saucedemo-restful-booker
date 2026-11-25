import fs from 'node:fs';
import path from 'node:path';
import { type Page } from '@playwright/test';

/** Baselines are per platform (fonts render differently); see snapshotPathTemplate in playwright.config.ts. */
const BASELINE_DIR = path.join(__dirname, '..', '..', 'tests', 'visual', '__screenshots__', process.platform);

/** True when approved baselines exist for the OS the tests run on (win32 and linux are committed). */
export const hasBaselines = (): boolean => fs.existsSync(BASELINE_DIR);

/** The message toHaveScreenshot fails with when the images differ in pixels (not a missing baseline or a timeout). */
export const PIXEL_DIFF = /\d+ pixels \(ratio [\d.]+ of all image pixels\) are different/;

/**
 * Small, realistic regressions on the inventory page. Each one is measured to differ from the baseline
 * by more than the tolerance (maxDiffPixels: 10, threshold: 0.05): one letter of the title ~28 px,
 * one price digit ~64 px, the cart icon ~163 px, one button colour ~517 px.
 */
export const INVENTORY_MUTATIONS: Array<{ name: string; apply: (page: Page) => Promise<void> }> = [
  {
    name: 'one letter of the page title ("Products" → "Product")',
    apply: page => page.getByTestId('title').evaluate(el => { el.textContent = 'Product'; }),
  },
  {
    name: 'one digit of a price ($29.99 → $29.90)',
    apply: page => page.getByTestId('inventory-item-price').first().evaluate(el => { el.textContent = '$29.90'; }),
  },
  {
    name: 'a missing cart icon',
    apply: page => addStyle(page, '[data-test="shopping-cart-link"] { visibility: hidden }'),
  },
  {
    name: 'a slightly different colour of one button',
    apply: page =>
      addStyle(page, '[data-test="add-to-cart-sauce-labs-backpack"] { color: #3a3a3a !important; border-color: #3a3a3a !important }'),
  },
];

async function addStyle(page: Page, css: string) {
  await page.addStyleTag({ content: css });
}
