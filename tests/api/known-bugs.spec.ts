import { expect, test } from '../../src/fixtures/api';
import { INVALID_BOOKINGS, INVALID_CREDENTIALS, newBooking } from '../../src/data/booking';
import { knownBug } from '../../src/utils/knownBug';

/*
 * Each test checks the CORRECT behaviour and, while it does not hold, requires the OBSERVED buggy behaviour
 * (see src/utils/knownBug.ts). A 503 from the sandbox, a typo or a fixed bug makes the test red.
 * Bug reports: README.md, "Знайдені баги".
 */
test.describe('Known API bugs', { tag: '@known-bug' }, () => {
  test('BUG-API-1: wrong credentials are answered with 200 OK', async ({ client }) => {
    // Act
    const response = await client.auth(INVALID_CREDENTIALS);

    // Assert
    await knownBug('BUG-API-1', {
      correct: () => expect(response.status()).toBe(401),
      observed: async () => {
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ reason: 'Bad credentials' });
      },
    });
  });

  test('BUG-API-2: a booking without required fields crashes with 500', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.missingRequiredFields);
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-2', {
      correct: () => expect(response.status()).toBe(400),
      observed: () => expect(response.status()).toBe(500),
    });
  });

  test('BUG-API-3: deleting an already deleted booking answers 405', async ({ client, token }) => {
    // Arrange
    const id = await client.createId(newBooking());
    expect((await client.delete(id, token)).status()).toBe(201);

    // Act
    const response = await client.delete(id, token);

    // Assert
    await knownBug('BUG-API-3', {
      correct: () => expect(response.status()).toBe(404),
      observed: () => expect(response.status()).toBe(405),
    });
  });

  test('BUG-API-4: checkout before checkin is accepted', async ({ client, cleanup }) => {
    // Arrange
    const booking = INVALID_BOOKINGS.checkoutBeforeCheckin();

    // Act
    const response = await client.create(booking);
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-4', {
      correct: () => expect(response.status()).toBe(400),
      observed: async () => {
        expect(response.status()).toBe(200);
        expect((await response.json()).booking.bookingdates).toEqual(booking.bookingdates);
      },
    });
  });

  test('BUG-API-5: a non-numeric price is stored as null', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.nonNumericPrice());
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-5', {
      correct: () => expect(response.status()).toBe(400),
      observed: async () => {
        expect(response.status()).toBe(200);
        expect((await response.json()).booking.totalprice).toBeNull();
      },
    });
  });

  test('BUG-API-6: a negative price is accepted', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.negativePrice());
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-6', {
      correct: () => expect(response.status()).toBe(400),
      observed: async () => {
        expect(response.status()).toBe(200);
        expect((await response.json()).booking.totalprice).toBe(-5);
      },
    });
  });
});
