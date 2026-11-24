import { expect, test } from '../../src/fixtures/ui';
import { MESSAGES } from '../../src/data/messages';
import { CATALOGUE } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { INVALID_PASSWORD, PASSWORD, USERNAME_WRONG_CASE, USERS } from '../../src/data/users';

test.describe('Login', () => {
  test('standard_user logs in through the form and sees the full catalogue', async ({ page, loginPage, inventory }) => {
    // Arrange
    await loginPage.open();

    // Act
    await loginPage.login(USERS.standard, PASSWORD);

    // Assert
    await expect(page).toHaveURL(ROUTES.inventory);
    await expect(inventory.title).toHaveText('Products');
    await expect(inventory.items).toHaveCount(CATALOGUE.length);
  });

  test('logout returns to the login form and closes access to the inventory', async ({ loggedIn, header, loginPage, inventory }) => {
    // Arrange: logged in by the fixture

    // Act
    await header.logout();

    // Assert
    await expect(loginPage.loginButton).toBeVisible();
    await inventory.open();
    await expect(loginPage.error).toHaveText(MESSAGES.notLoggedIn);
  });

  test.describe('negative and boundary', () => {
    test('wrong password is rejected with an error and no navigation', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERS.standard, INVALID_PASSWORD);

      // Assert
      await expect(loginPage.error).toHaveText(MESSAGES.wrongPassword);
      await expect(page).not.toHaveURL(ROUTES.inventory);
    });

    test('username is case-sensitive: "Standard_User" is not standard_user', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERNAME_WRONG_CASE, PASSWORD);

      // Assert
      await expect(loginPage.error).toHaveText(MESSAGES.wrongPassword);
      await expect(page).not.toHaveURL(ROUTES.inventory);
    });

    test('locked_out_user cannot log in', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERS.lockedOut, PASSWORD);

      // Assert
      await expect(loginPage.error).toHaveText(MESSAGES.lockedOut);
      await expect(page).not.toHaveURL(ROUTES.inventory);
    });

    test('empty form asks for the username first', async ({ loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.submitEmpty();

      // Assert
      await expect(loginPage.error).toHaveText(MESSAGES.usernameRequired);
    });

    test('inventory is closed without a session', async ({ inventory, loginPage }) => {
      // Arrange: no login at all

      // Act
      await inventory.open();

      // Assert
      await expect(loginPage.error).toHaveText(MESSAGES.notLoggedIn);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});
