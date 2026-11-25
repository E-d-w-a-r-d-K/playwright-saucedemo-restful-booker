import { type BookingClient } from '../../src/api/BookingClient';
import { expect, test } from '../../src/fixtures/api';
import { INVALID_BOOKINGS, INVALID_CREDENTIALS, newBooking, NON_EXISTENT_ID, PARTIAL_CHANGE } from '../../src/data/booking';
import { shiftDate } from '../../src/utils/dates';
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
      // status AND the application's own plain-text body, so a proxy or platform error page is not taken for the bug
      observed: async () => {
        expect(response.status(), 'the API crashes with 500').toBe(500);
        expect(await response.text(), 'the body is the application error text').toBe('Internal Server Error');
      },
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
      observed: async () => {
        expect(response.status(), 'the second DELETE answers 405').toBe(405);
        expect(await response.text(), 'the body is "Method Not Allowed"').toBe('Method Not Allowed');
      },
    });
  });

  // PUT and PATCH are separate tests: a fix of one of them then shows as "bug fixed" for exactly that method.
  const missingIdCalls = [
    { method: 'PUT', call: (client: BookingClient, token: string) => client.update(NON_EXISTENT_ID, newBooking(), token) },
    { method: 'PATCH', call: (client: BookingClient, token: string) => client.partialUpdate(NON_EXISTENT_ID, PARTIAL_CHANGE, token) },
  ];
  for (const { method, call } of missingIdCalls) {
    test(`BUG-API-3: ${method} of a booking that does not exist answers 405`, async ({ client, token }) => {
      // Act
      const response = await call(client, token);

      // Assert
      await knownBug('BUG-API-3', {
        severity: 'minor',
        correct: () => expect(response.status(), `${method} of a missing booking answers 404`).toBe(404),
        observed: async () => {
          expect(response.status(), `${method} of a missing booking answers 405`).toBe(405);
          expect(await response.text(), 'the body is "Method Not Allowed"').toBe('Method Not Allowed');
        },
      });
    });
  }

  // GET /booking documents its date filters as "on or after the given date"; the booking's own date is the boundary.
  test('BUG-API-7: the check-in filter misses bookings that check in on the given date', async ({ client, cleanup }) => {
    // Arrange
    const booking = newBooking();
    const id = await client.createId(booking);
    cleanup(id);
    const { checkin } = booking.bookingdates;

    // Act
    const sameDay = await client.listIds({ checkin });
    const dayBefore = await client.listIds({ checkin: shiftDate(checkin, -1) });

    // Assert
    await knownBug('BUG-API-7', {
      severity: 'normal',
      correct: () => expect(sameDay, 'check-in on the given date counts as "on or after": found').toContain(id),
      observed: () => {
        expect(sameDay, 'the booking checking in on that very date is missing').not.toContain(id);
        // the filter itself works: one day earlier it finds the booking, so it is "strictly after", not broken
        expect(dayBefore, 'with the day before, the same booking is found').toContain(id);
      },
    });
  });

  test('BUG-API-8: the check-out filter works the other way round', async ({ client, cleanup }) => {
    // Arrange
    const booking = newBooking();
    const id = await client.createId(booking);
    cleanup(id);
    const { checkout } = booking.bookingdates;

    // Act: the booking checks out after the day before, on the day itself, and before the day after
    const dayBefore = await client.listIds({ checkout: shiftDate(checkout, -1) });
    const sameDay = await client.listIds({ checkout });
    const dayAfter = await client.listIds({ checkout: shiftDate(checkout, 1) });

    // Assert
    await knownBug('BUG-API-8', {
      severity: 'normal',
      correct: () => {
        expect(dayBefore, 'check-out on or after the day before: found').toContain(id);
        expect(sameDay, 'check-out on or after the same day: found').toContain(id);
        expect(dayAfter, 'check-out on or after the day after: not found').not.toContain(id);
      },
      observed: () => {
        expect(dayBefore, 'the filter misses a booking that checks out later').not.toContain(id);
        expect(sameDay, 'the same day is included').toContain(id);
        expect(dayAfter, 'the filter finds a booking that checks out earlier').toContain(id);
      },
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
