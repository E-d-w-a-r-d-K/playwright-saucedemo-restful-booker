import { test } from '@playwright/test';

/**
 * A named step in the report (Playwright HTML and Allure). Page objects and API clients wrap every action in one,
 * so a test reads as reproduction steps ("Add "Sauce Labs Backpack" to the cart") and a failure is shown
 * on the step where it happened; the raw Playwright calls stay nested inside it.
 */
export function step<T>(title: string, body: () => Promise<T>): Promise<T> {
  return test.step(title, body);
}
