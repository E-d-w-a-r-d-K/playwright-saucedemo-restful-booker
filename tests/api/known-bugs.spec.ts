import { expect, test } from '../../src/fixtures/api';
import { INVALID_BOOKINGS, INVALID_CREDENTIALS, newBooking } from '../../src/data/booking';
import { knownBug } from '../../src/utils/knownBug';
import { area, EPIC } from '../../src/utils/report';

/*
 * Each test checks the CORRECT behaviour and, while it does not hold, requires the OBSERVED buggy behaviour
 * (see src/utils/knownBug.ts). A 503 from the sandbox, a typo or a fixed bug makes the test red.
 * Bug reports: README.md, "Знайдені баги".
 */
test.describe('Known API bugs', { tag: '@known-bug', ...area(EPIC.api, 'Known bugs') }, () => {
  test('BUG-API-1: wrong credentials are answered with 200 OK', async ({ client }) => {
    // Act
    const response = await client.auth(INVALID_CREDENTIALS);

    // Assert
    await knownBug('BUG-API-1', {
      severity: 'critical',
      correct: () => expect(response.status(), 'wrong credentials answer 401').toBe(401),
      observed: async () => {
        expect(response.status(), 'wrong credentials answer 200').toBe(200);
        expect(await response.json(), 'the body says "Bad credentials"').toEqual({ reason: 'Bad credentials' });
      },
    });
  });

  test('BUG-API-2: a booking without required fields crashes with 500', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.missingRequiredFields);
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-2', {
      severity: 'normal',
      correct: () => expect(response.status(), 'the invalid booking is rejected with 400').toBe(400),
      observed: () => expect(response.status(), 'the API crashes with 500').toBe(500),
    });
  });

  test('BUG-API-3: deleting an already deleted booking answers 405', async ({ client, token }) => {
    // Arrange
    const id = await client.createId(newBooking());
    expect((await client.delete(id, token)).status(), 'the first DELETE answers 201').toBe(201);

    // Act
    const response = await client.delete(id, token);

    // Assert
    await knownBug('BUG-API-3', {
      severity: 'minor',
      correct: () => expect(response.status(), 'the second DELETE answers 404').toBe(404),
      observed: () => expect(response.status(), 'the second DELETE answers 405').toBe(405),
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
      severity: 'normal',
      correct: () => expect(response.status(), 'the invalid booking is rejected with 400').toBe(400),
      observed: async () => {
        expect(response.status(), 'the invalid booking is accepted with 200').toBe(200);
        expect((await response.json()).booking.bookingdates, 'the dates are stored as sent').toEqual(booking.bookingdates);
      },
    });
  });

  test('BUG-API-5: a non-numeric price is stored as null', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.nonNumericPrice());
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-5', {
      severity: 'normal',
      correct: () => expect(response.status(), 'the invalid booking is rejected with 400').toBe(400),
      observed: async () => {
        expect(response.status(), 'the invalid booking is accepted with 200').toBe(200);
        expect((await response.json()).booking.totalprice, 'the price is stored as null').toBeNull();
      },
    });
  });

  test('BUG-API-6: a negative price is accepted', async ({ client, cleanup }) => {
    // Act
    const response = await client.create(INVALID_BOOKINGS.negativePrice());
    if (response.ok()) cleanup((await response.json()).bookingid);

    // Assert
    await knownBug('BUG-API-6', {
      severity: 'normal',
      correct: () => expect(response.status(), 'the invalid booking is rejected with 400').toBe(400),
      observed: async () => {
        expect(response.status(), 'the invalid booking is accepted with 200').toBe(200);
        expect((await response.json()).booking.totalprice, 'the price is stored as -5').toBe(-5);
      },
    });
  });
});
