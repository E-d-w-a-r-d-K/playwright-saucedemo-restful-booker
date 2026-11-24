import { type BrowserContext } from '@playwright/test';

/**
 * Logs a user in without the form: saucedemo keeps the session in the "session-username" cookie,
 * so setting it is enough. Tests that are not about login use this to skip the form;
 * the login form itself is covered by tests/ui/login.spec.ts.
 */
export async function loginViaSession(context: BrowserContext, baseUrl: string, username: string) {
  await context.addCookies([{ name: 'session-username', value: username, url: baseUrl }]);
}
