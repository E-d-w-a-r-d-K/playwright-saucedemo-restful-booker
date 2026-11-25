import { type Page } from '@playwright/test';
import { step } from './step';

const START = new Date('2026-01-01T10:00:00Z').getTime();

/**
 * Freezes the page clock before the page under test is opened: its timers (spinner delay, slider autoplay)
 * fire only when the test advances time with `advanceClock`, so timing checks are exact and never race the machine.
 */
export async function freezeClock(page: Page) {
  await step('Freeze the page clock: timers run only when the test advances time', async () => {
    await page.clock.install({ time: START });
    await page.clock.pauseAt(START + 1000);
  });
}

/** Moves the frozen clock forward, then lets the page finish rendering what the fired timers changed. */
export async function advanceClock(page: Page, ms: number) {
  await step(`Let ${ms} ms pass on the page clock`, async () => {
    await page.clock.runFor(ms);
    await settle(page);
  });
}

/**
 * Waits until the page has processed its pending work. React applies state updates and runs effects (where the
 * page registers its timers) in tasks posted through MessageChannel, which the fake clock does not control;
 * two round trips through a MessageChannel let those tasks run before the test reads the page or moves time.
 */
export async function settle(page: Page) {
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => new Promise<void>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(0);
    }));
  }
}

/**
 * Makes Math.random return `value` on the next page load (the fake clock does not control it). Used to put
 * a random delay at an exact end of its range: 0 → the shortest delay, just under 1 → the longest.
 */
export async function pinRandom(page: Page, value: number) {
  await step(`Pin Math.random() to ${value} on the page`, () => page.addInitScript(v => { Math.random = () => v; }, value));
}
