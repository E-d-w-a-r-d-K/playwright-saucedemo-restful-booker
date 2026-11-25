import { expect, test } from '../../src/fixtures/api';
import { newBooking } from '../../src/data/booking';
import { shiftDate } from '../../src/utils/dates';
import { area, EPIC } from '../../src/utils/report';

/*
 * GET /booking returns ids only. The sandbox is shared and holds other people's bookings, so the checks look for
 * OUR booking (unique last name) in the result — never at the whole result size, except for the name filter,
 * where the unique last name makes the exact answer known.
 */
test.describe('Booking search', area(EPIC.api, 'Booking search'), () => {
  test('the list of all bookings contains a new booking', async ({ client, cleanup }) => {
    // Arrange
    const id = await client.createId(newBooking());
    cleanup(id);

    // Act
    const response = await client.list();

    // Assert
    expect(response.status(), 'GET /booking answers 200').toBe(200);
    expect(((await response.json()) as Array<{ bookingid: number }>).map(b => b.bookingid), 'the new id is in the list').toContain(id);
  });

  test('search by first and last name returns exactly that booking, and nothing for another first name', async ({ client, cleanup }) => {
    // Arrange
    const booking = newBooking();
    const id = await client.createId(booking);
    cleanup(id);

    // Act
    const match = await client.list({ firstname: booking.firstname, lastname: booking.lastname });
    const byLastName = await client.list({ lastname: booking.lastname });
    const otherName = await client.list({ firstname: `${booking.firstname}-other`, lastname: booking.lastname });

    // Assert
    expect(match.status(), 'the search answers 200').toBe(200);
    expect(await match.json(), 'exactly the one booking with this unique name').toEqual([{ bookingid: id }]);
    expect(await byLastName.json(), 'the unique last name alone finds exactly it too').toEqual([{ bookingid: id }]);
    expect(await otherName.json(), 'a different first name finds nothing').toEqual([]);
  });

  // The documented rule is "on or after the given date". The boundary itself (the same date) is a known bug for
  // both filters (BUG-API-7, BUG-API-8); here are the parts that behave as documented.
  test('date search: a check-in filter before the stay finds the booking, after the check-in it does not', async ({ client, cleanup }) => {
    // Arrange
    const booking = newBooking();
    const id = await client.createId(booking);
    cleanup(id);
    const { checkin } = booking.bookingdates;

    // Act
    const dayBefore = await client.listIds({ checkin: shiftDate(checkin, -1) });
    const dayAfter = await client.listIds({ checkin: shiftDate(checkin, 1) });

    // Assert
    expect(dayBefore, 'check-in on or after the day before: found').toContain(id);
    expect(dayAfter, 'check-in on or after the day after: not found').not.toContain(id);
  });
});
