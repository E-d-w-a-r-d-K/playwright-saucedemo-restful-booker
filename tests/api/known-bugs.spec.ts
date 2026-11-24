import { expect, test } from './fixtures';
import { newBooking } from './bookingClient';

/*
 * Each test states the CORRECT behaviour and is marked test.fail() while the bug exists:
 * the suite stays green, and when the API is fixed the test reports "unexpectedly passed".
 * Bug reports: README.md, section "Знайдені баги".
 */
test.describe('Known API bugs (expected to fail until fixed)', () => {
  test('BUG-API-1: wrong credentials are answered with 401', async ({ client }) => {
    test.fail(true, 'BUG-API-1: /auth returns 200 {"reason":"Bad credentials"}');

    const response = await client.auth({ username: 'admin', password: 'wrong' });

    expect(response.status()).toBe(401);
  });

  test('BUG-API-2: a booking without required fields is rejected with 400', async ({ client, cleanup }) => {
    test.fail(true, 'BUG-API-2: the API answers 500 Internal Server Error');

    const response = await client.create({ firstname: 'OnlyName' });
    if (response.ok()) cleanup((await response.json()).bookingid);

    expect(response.status()).toBe(400);
  });

  test('BUG-API-3: delete answers 200 or 204, not 201 Created', async ({ client, token }) => {
    test.fail(true, 'BUG-API-3: DELETE /booking/{id} returns 201 Created');

    const id = (await (await client.create(newBooking())).json()).bookingid;
    const response = await client.delete(id, token);

    const status = response.status();
    expect(status === 200 || status === 204, `DELETE should answer 200 or 204, got ${status}`).toBe(true);
  });

  test('BUG-API-4: deleting an already deleted booking answers 404', async ({ client, token }) => {
    test.fail(true, 'BUG-API-4: the second DELETE returns 405 Method Not Allowed');

    const id = (await (await client.create(newBooking())).json()).bookingid;
    await client.delete(id, token);

    expect((await client.delete(id, token)).status()).toBe(404);
  });

  test('BUG-API-5: checkout before checkin is rejected', async ({ client, cleanup }) => {
    test.fail(true, 'BUG-API-5: the booking is created with checkout earlier than checkin');

    const response = await client.create(newBooking({ bookingdates: { checkin: '2027-01-15', checkout: '2027-01-10' } }));
    if (response.ok()) cleanup((await response.json()).bookingid);

    expect(response.status()).toBe(400);
  });

  test('BUG-API-6: a non-numeric price is rejected instead of being stored as null', async ({ client, cleanup }) => {
    test.fail(true, 'BUG-API-6: totalprice "abc" is accepted and saved as null');

    const response = await client.create({ ...newBooking(), totalprice: 'abc' });
    if (response.ok()) cleanup((await response.json()).bookingid);

    expect(response.status()).toBe(400);
  });
});
