import { expect, test } from './fixtures';
import { CATALOGUE, MESSAGES, PASSWORD, USERS } from './support/data';

test.describe('Login', () => {
  test('standard_user logs in and sees the full catalogue', async ({ page, loginPage, inventory }) => {
    await loginPage.open();
    await loginPage.login(USERS.standard, PASSWORD);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.title).toHaveText('Products');
    await expect(inventory.items).toHaveCount(CATALOGUE.length);
  });

  test('logout returns to the login form and closes access to the inventory', async ({ page, loggedIn, loginPage }) => {
    await loggedIn.logout();
    await expect(loginPage.loginButton).toBeVisible();

    await page.goto('/inventory.html');
    await expect(loginPage.error).toHaveText(MESSAGES.notLoggedIn);
  });

  test.describe('negative', () => {
    test('wrong password is rejected with an error and no navigation', async ({ page, loginPage }) => {
      await loginPage.open();
      await loginPage.login(USERS.standard, 'wrong_password');

      await expect(loginPage.error).toHaveText(MESSAGES.wrongPassword);
      await expect(page).not.toHaveURL(/inventory/);
    });

    test('locked_out_user cannot log in', async ({ page, loginPage }) => {
      await loginPage.open();
      await loginPage.login(USERS.lockedOut, PASSWORD);

      await expect(loginPage.error).toHaveText(MESSAGES.lockedOut);
      await expect(page).not.toHaveURL(/inventory/);
    });

    test('empty form asks for the username first', async ({ loginPage }) => {
      await loginPage.open();
      await loginPage.loginButton.click();

      await expect(loginPage.error).toHaveText(MESSAGES.usernameRequired);
    });

    test('inventory is closed without a session', async ({ page, loginPage }) => {
      await page.goto('/inventory.html');

      await expect(loginPage.error).toHaveText(MESSAGES.notLoggedIn);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});
