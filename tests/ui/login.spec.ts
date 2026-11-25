import { expect, test } from '../../src/fixtures/ui';
import { MESSAGES } from '../../src/data/messages';
import { CATALOGUE } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { INVALID_PASSWORD, PASSWORD, USERNAME_WRONG_CASE, USERS } from '../../src/data/users';
import { area, EPIC, severity } from '../../src/utils/report';

test.describe('Login', area(EPIC.ui, 'Login'), () => {
  test('standard_user logs in through the form and sees the full catalogue', severity('critical'), async ({ page, loginPage, inventory }) => {
    // Arrange
    await loginPage.open();

    // Act
    await loginPage.login(USERS.standard, PASSWORD);

    // Assert
    await expect(page, 'the inventory page is open').toHaveURL(ROUTES.inventory);
    await expect(inventory.title, 'the inventory page is open').toHaveText('Products');
    await expect(inventory.items, 'every product of the catalogue is shown').toHaveCount(CATALOGUE.length);
  });

  test('logout returns to the login form and closes access to the inventory', async ({ loggedIn, header, loginPage, inventory }) => {
    // Arrange: logged in by the fixture

    // Act
    await header.logout();

    // Assert
    await expect(loginPage.loginButton, 'the login form is shown').toBeVisible();
    await inventory.open();
    await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.notLoggedIn);
  });

  test.describe('negative and boundary', () => {
    test('wrong password is rejected with an error and no navigation', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERS.standard, INVALID_PASSWORD);

      // Assert
      await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.wrongPassword);
      await expect(page, 'the inventory page is not opened').not.toHaveURL(ROUTES.inventory);
    });

    test('username is case-sensitive: "Standard_User" is not standard_user', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERNAME_WRONG_CASE, PASSWORD);

      // Assert
      await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.wrongPassword);
      await expect(page, 'the inventory page is not opened').not.toHaveURL(ROUTES.inventory);
    });

    test('locked_out_user cannot log in', async ({ page, loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.login(USERS.lockedOut, PASSWORD);

      // Assert
      await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.lockedOut);
      await expect(page, 'the inventory page is not opened').not.toHaveURL(ROUTES.inventory);
    });

    test('empty form asks for the username first', async ({ loginPage }) => {
      // Arrange
      await loginPage.open();

      // Act
      await loginPage.submitEmpty();

      // Assert
      await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.usernameRequired);
    });

    // One field empty, the other filled: the message proves which field the form validated.
    const oneFieldEmpty = [
      { field: 'password', username: USERS.standard, password: '', message: MESSAGES.passwordRequired },
      { field: 'username', username: '', password: PASSWORD, message: MESSAGES.usernameRequired },
    ];

    for (const { field, username, password, message } of oneFieldEmpty) {
      test(`empty ${field} with the other field filled is rejected`, async ({ page, loginPage }) => {
        // Arrange
        await loginPage.open();

        // Act
        await loginPage.login(username, password);

        // Assert: the error first — it proves the submit was handled, so the URL check below is not vacuous
        await expect(loginPage.error, 'the login form shows the error').toHaveText(message);
        await expect(page, 'the inventory page is not opened').not.toHaveURL(ROUTES.inventory);
      });
    }

    test('inventory is closed without a session', async ({ inventory, loginPage }) => {
      // Arrange: no login at all

      // Act
      await inventory.open();

      // Assert
      await expect(loginPage.error, 'the login form shows the error').toHaveText(MESSAGES.notLoggedIn);
      await expect(loginPage.loginButton, 'the login form is shown').toBeVisible();
    });
  });
});
