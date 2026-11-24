import { expect, test } from '../../src/fixtures/api';
import { changedBooking, FORGED_TOKEN, newBooking, NON_EXISTENT_ID } from '../../src/data/booking';

test.describe('Booking API', () => {
  test('lifecycle: auth → create → update → delete → booking is gone', async ({ client, cleanup }) => {
    const token = await test.step('auth returns a token', async () => {
      const response = await client.auth();
      expect(response.status()).toBe(200);
      const { token } = await response.json();
      expect(typeof token === 'string' && token.length > 0, `token in ${JSON.stringify({ token })}`).toBe(true);
      return token as string;
    });

    const booking = newBooking();
    const id = await test.step('create returns an id and echoes the booking', async () => {
      const response = await client.create(booking);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ bookingid: expect.any(Number), booking });
      // if a later step fails, the booking is still removed from the shared sandbox
      cleanup(body.bookingid);
      return body.bookingid as number;
    });

    await test.step('get returns exactly what was created', async () => {
      const response = await client.get(id);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(booking);
    });

    const updated = changedBooking(booking);
    await test.step('update with a token replaces the booking', async () => {
      const response = await client.update(id, updated, token);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
      expect(await (await client.get(id)).json()).toEqual(updated);
    });

    await test.step('delete with a token is accepted', async () => {
      const response = await client.delete(id, token);
      // restful-booker documents 201 Created for DELETE (see "API-NOTE-1" in README)
      expect(response.status()).toBe(201);
    });

    await test.step('the deleted booking is not found', async () => {
      expect((await client.get(id)).status()).toBe(404);
    });
  });

  test.describe('negative', () => {
    test('update without a token is forbidden and changes nothing', async ({ client, cleanup }) => {
      // Arrange
      const booking = newBooking();
      const id = await client.createId(booking);
      cleanup(id);

      // Act
      const response = await client.update(id, changedBooking(booking));

      // Assert
      expect(response.status()).toBe(403);
      expect(await (await client.get(id)).json()).toEqual(booking);
    });

    test('delete without a token is forbidden and the booking stays', async ({ client, cleanup }) => {
      // Arrange
      const booking = newBooking();
      const id = await client.createId(booking);
      cleanup(id);

      // Act
      const response = await client.delete(id);

      // Assert
      expect(response.status()).toBe(403);
      expect(await (await client.get(id)).json()).toEqual(booking);
    });

    test('update and delete with a forged token are forbidden', async ({ client, cleanup }) => {
      // Arrange
      const booking = newBooking();
      const id = await client.createId(booking);
      cleanup(id);

      // Act
      const update = await client.update(id, changedBooking(booking), FORGED_TOKEN);
      const remove = await client.delete(id, FORGED_TOKEN);

      // Assert
      expect(update.status()).toBe(403);
      expect(remove.status()).toBe(403);
      expect(await (await client.get(id)).json()).toEqual(booking);
    });

    test('an id that never existed is not found', async ({ client }) => {
      // Act
      const response = await client.get(NON_EXISTENT_ID);

      // Assert
      expect(response.status()).toBe(404);
    });
  });
});
