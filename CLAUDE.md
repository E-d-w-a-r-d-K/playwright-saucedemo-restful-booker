# Instructions for the AI agent (Claude Code)

This repository is a QA test task: UI tests for https://www.saucedemo.com and API tests for
https://restful-booker.herokuapp.com on Playwright + TypeScript.

## Before writing a test
- Explore the real behaviour first (a short script or the browser): real locators, exact messages,
  real status codes. Never guess a selector, a text or a status code.
- If the real behaviour looks wrong, it is a bug: write the test for the CORRECT behaviour and mark it
  `test.fail(true, 'BUG-...')`, then add a bug report to README.md. Never pin a bug as expected behaviour.

## How tests are written
- UI: Page Object Model in `tests/ui/pages`, fixtures in `tests/ui/fixtures.ts`, data in `tests/ui/support/data.ts`.
- Locators: `getByTestId` (the site uses `data-test`, set in `playwright.config.ts`) or `getByRole`. No CSS chains, no XPath.
- No `waitForTimeout`; rely on web-first assertions (`toHaveText`, `toHaveURL`, `toBeVisible`).
- Assert values, not presence: exact texts, full lists, numbers. A test must be able to fail on a real regression.
- Every test is independent: its own login, its own data. API tests create their own bookings with a unique
  last name and delete them in the `cleanup` fixture.
- Prices are compared as numbers (`parsePrice`), money rounded to cents (`cents`).

## Checks before saying "done"
- `npm run typecheck` passes.
- `npx playwright test` is green (expected failures of known bugs count as passed).
- For every `test.fail` test: remove the marker locally once and confirm it fails on the bug assertion,
  not on a broken locator or a typo.

## Do not
- Do not commit `node_modules`, reports or test results.
- Do not raise timeouts or add retries to hide a failure; find the cause.
