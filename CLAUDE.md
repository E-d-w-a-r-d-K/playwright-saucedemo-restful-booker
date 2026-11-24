# Instructions for the AI agent (Claude Code)

This repository is a QA test task: UI tests and screenshot comparison for https://www.saucedemo.com and API tests
for https://restful-booker.herokuapp.com on Playwright + TypeScript, reported with Allure.

## Before writing a test
- Explore the real behaviour first (a short script or the browser): real locators, exact messages,
  real status codes. Never guess a selector, a text or a status code.
- Check the product's own documentation before calling something a bug (restful-booker documents 201 for DELETE).
- If the real behaviour is wrong, it is a bug: guard it with `knownBug()` from `src/utils/knownBug.ts` —
  `correct` = what SHOULD happen, `observed` = the exact buggy behaviour seen today — and add a bug report
  to README.md. Never pin a bug as expected behaviour, and never use `test.fail()`: it turns ANY failure green.

## Where things live
- `src/pages` — page objects (locators + actions, no assertions); `src/pages/components` — parts shared by pages.
- `src/api` — API clients; `src/fixtures` — Playwright fixtures (`ui.ts`, `api.ts`); `src/data` — test data and routes;
  `src/utils` — helpers not tied to one page; `config/env.ts` — environment (URLs, credentials, `.env`).
- `tests/ui`, `tests/visual`, `tests/api` — checks only, Arrange → Act → Assert.

## How tests are written
- Specs never touch selectors: no `getByTestId`, `getByRole`, `locator`, CSS or XPath in `tests/`.
  A missing action goes into the page object first.
- Locators in page objects: `getByTestId` (the site uses `data-test`, set in `playwright.config.ts`) or `getByRole`. No CSS chains, no XPath.
- No literals that belong to data in specs: users, passwords, customers, invalid bodies, ids, URL patterns live in `src/data`.
- Only `tests/ui/login.spec.ts` logs in through the form; other UI tests use `loggedIn` / `loginAs` (session cookie).
- No `waitForTimeout`; rely on web-first assertions (`toHaveText`, `toHaveURL`, `toBeVisible`); read lists with
  `expect.poll(() => page.products())` so the read retries until the page settles.
- Assert values, not presence: exact texts, full lists, numbers. A test must be able to fail on a real regression —
  e.g. a sort test must start from a different order, not from the default one.
- Every test is independent: its own login, its own data. API tests create their own bookings with a unique
  last name and register them with `cleanup(id)` right after creation.
- Prices are compared as numbers (`parsePrice`), money rounded to cents (`cents`).
- Screenshots: baselines are written only by `npm run test:visual:update` (locally, win32) or the
  "update screenshots" workflow (linux); `updateSnapshots` is `none` for normal runs. Known-bug visual tests are
  excluded from updates.

## Checks before saying "done"
- `npm run typecheck` passes.
- `npx playwright test` is green.
- For every new `knownBug` test: make the `observed` check wrong once and confirm the test goes red;
  point the API at a wrong host once and confirm the API known-bug tests go red.

## Do not
- Do not commit `node_modules`, reports or test results.
- Do not raise timeouts or add retries to hide a failure; find the cause. The only retry is 1 on CI for the
  `api` project (public sandbox, 503s), and a retried pass is reported as flaky.
