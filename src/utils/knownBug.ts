import { test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { bugReportUrl, type Severity } from './report';

export interface KnownBugChecks {
  /** Severity of the bug as stated in its README report; shown in Allure. */
  severity: Severity;
  /** The behaviour the product SHOULD have. Expected to fail while the bug exists. */
  correct: () => Promise<unknown> | unknown;
  /** The buggy behaviour as it is observed today. Must pass — this is the proof that the bug, and nothing else, is what we see. */
  observed: () => Promise<unknown> | unknown;
}

/**
 * Guards a known bug without hiding unrelated failures (which `test.fail()` would do):
 * - the correct behaviour holds          → the test FAILS: the bug looks fixed, move the check to the regular tests;
 * - the correct behaviour does not hold  → the observed buggy behaviour must be confirmed,
 *   so a 503, a broken locator or a typo makes the test FAIL instead of passing silently.
 * Everything before the call (setup) runs as a normal test, so setup errors fail the test too.
 * In Allure the test carries the bug's severity and an issue link to its report (README.md, anchor = id).
 */
export async function knownBug(id: string, checks: KnownBugChecks): Promise<void> {
  test.info().annotations.push({ type: 'known bug', description: id });
  // set at run time, so through the Allure runtime API (static annotations are read before the test runs)
  await allure.severity(checks.severity);
  await allure.issue(id, bugReportUrl(id));

  let correctHolds = true;
  await test.step(`${id}: correct behaviour (expected to fail while the bug exists)`, async () => {
    try {
      await checks.correct();
    } catch {
      correctHolds = false;
    }
  });

  if (correctHolds) {
    throw new Error(`${id}: the correct behaviour holds now — the bug looks fixed. Move this check into the regular tests.`);
  }

  await test.step(`${id}: the observed buggy behaviour is confirmed`, async () => {
    await checks.observed();
  });
}
