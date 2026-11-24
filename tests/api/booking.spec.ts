import { expect, test } from './fixtures';
import { newBooking } from './bookingClient';

test.describe('Booking API', () => {
  test('lifecycle: auth → create → update → delete → booking is gone', async ({ client }) => {
    const token = await test.step('auth returns a token', async () => {
      const response = await client.auth();
      expect(response.status()).toBe(200);
      const { token } = await response.json();
      expect(token).toMatch(/^[0-9a-f]{15}$/);
      return token as string;
    });

    const booking = newBooking();
    const id = await test.step('create returns an id and echoes the booking', async () => {
      const response = await client.create(booking);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ bookingid: expect.any(Number), booking });
      return body.bookingid as number;
    });

    await test.step('get returns exactly what was created', async () => {
      const response = await client.get(id);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(booking);
    });

    const updated = { ...booking, totalprice: 200, additionalneeds: 'Dinner', bookingdates: { checkin: '2027-02-01', checkout: '2027-02-03' } };
    await test.step('update with a token replaces the booking', async () => {
      const response = await client.update(id, updated, token);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
      expect(await (await client.get(id)).json()).toEqual(updated);
    });

    await test.step('delete with a token succeeds', async () => {
      const response = await client.delete(id, token);
      // the API answers 201 Created here (see BUG-API-3); the flow only needs a success code
      expect(response.ok()).toBe(true);
    });

    await test.step('the deleted booking is not found', async () => {
      expect((await client.get(id)).status()).toBe(404);
    });
  });

  test.describe('negative', () => {
    test('update without a token is forbidden and changes nothing', async ({ client, cleanup }) => {
      const booking = newBooking();
      const id = (await (await client.create(booking)).json()).bookingid;
      cleanup(id);

      const response = await client.update(id, { ...booking, totalprice: 1 });

      expect(response.status()).toBe(403);
      expect(await (await client.get(id)).json()).toEqual(booking);
    });

    test('update and delete with a forged token are forbidden', async ({ client, cleanup }) => {
      const booking = newBooking();
      const id = (await (await client.create(booking)).json()).bookingid;
      cleanup(id);

      expect((await client.update(id, booking, 'forged-token')).status()).toBe(403);
      expect((await client.delete(id, 'forged-token')).status()).toBe(403);
      expect((await client.get(id)).status()).toBe(200);
    });

    test('an id that never existed is not found', async ({ client }) => {
      expect((await client.get(2_147_483_000)).status()).toBe(404);
    });
  });
});
