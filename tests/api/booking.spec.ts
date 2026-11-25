import { expect, test } from '../../src/fixtures/api';
import { changedBooking, FORGED_TOKEN, newBooking, NON_EXISTENT_ID } from '../../src/data/booking';
import { area, EPIC, severity } from '../../src/utils/report';

test.describe('Booking API', area(EPIC.api, 'Booking lifecycle'), () => {
  test('lifecycle: auth → create → update → delete → booking is gone', severity('critical'), async ({ client, cleanup }) => {
    const token = await test.step('auth returns a token', async () => {
      const response = await client.auth();
      expect(response.status(), 'POST /auth answers 200').toBe(200);
      const { token } = await response.json();
      expect(typeof token === 'string' && token.length > 0, `token in ${JSON.stringify({ token })}`).toBe(true);
      return token as string;
    });

    const booking = newBooking();
    const id = await test.step('create returns an id and echoes the booking', async () => {
      const response = await client.create(booking);
      expect(response.status(), 'POST /booking answers 200').toBe(200);
      const body = await response.json();
      expect(body, 'the response has a numeric id and echoes the booking').toEqual({ bookingid: expect.any(Number), booking });
      // if a later step fails, the booking is still removed from the shared sandbox
      cleanup(body.bookingid);
      return body.bookingid as number;
    });

    await test.step('get returns exactly what was created', async () => {
      const response = await client.get(id);
      expect(response.status(), 'GET answers 200').toBe(200);
      expect(await response.json(), 'GET returns the created booking').toEqual(booking);
    });

    const updated = changedBooking(booking);
    await test.step('update with a token replaces the booking', async () => {
      const response = await client.update(id, updated, token);
      expect(response.status(), 'PUT answers 200').toBe(200);
      expect(await response.json(), 'PUT returns the new booking').toEqual(updated);
      expect(await (await client.get(id)).json(), 'GET returns the new booking').toEqual(updated);
    });

    await test.step('delete with a token is accepted', async () => {
      const response = await client.delete(id, token);
      // restful-booker documents 201 Created for DELETE (see "API-NOTE-1" in README)
      expect(response.status(), 'DELETE answers 201').toBe(201);
    });

    await test.step('the deleted booking is not found', async () => {
      expect((await client.get(id)).status(), 'GET of the deleted booking answers 404').toBe(404);
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
      expect(response.status(), 'the request without a token answers 403').toBe(403);
      expect(await (await client.get(id)).json(), 'the stored booking is unchanged').toEqual(booking);
    });

    test('delete without a token is forbidden and the booking stays', async ({ client, cleanup }) => {
      // Arrange
      const booking = newBooking();
      const id = await client.createId(booking);
      cleanup(id);

      // Act
      const response = await client.delete(id);

      // Assert
      expect(response.status(), 'the request without a token answers 403').toBe(403);
      expect(await (await client.get(id)).json(), 'the stored booking is unchanged').toEqual(booking);
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
      expect(update.status(), 'PUT with a forged token answers 403').toBe(403);
      expect(remove.status(), 'DELETE with a forged token answers 403').toBe(403);
      expect(await (await client.get(id)).json(), 'the stored booking is unchanged').toEqual(booking);
    });

    test('an id that never existed is not found', async ({ client }) => {
      // Act
      const response = await client.get(NON_EXISTENT_ID);

      // Assert
      expect(response.status(), 'GET answers 404').toBe(404);
    });
  });
});
