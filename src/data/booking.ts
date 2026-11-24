import { env } from '../../config/env';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export const CREDENTIALS = { username: env.api.username, password: env.api.password };
export const INVALID_CREDENTIALS = { username: env.api.username, password: 'wrong' };

/** A token the API never issued. */
export const FORGED_TOKEN = 'forged-token';

/** Far above any id the sandbox hands out. */
export const NON_EXISTENT_ID = 2_147_483_000;

/** A booking with a unique last name, so parallel runs on the shared sandbox never collide. */
export function newBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Eduard',
    lastname: `QA-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-15' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

/** The same booking with every changeable field changed, for the update step. */
export function changedBooking(original: Booking): Booking {
  return {
    ...original,
    totalprice: original.totalprice + 50,
    additionalneeds: 'Dinner',
    bookingdates: { checkin: '2027-02-01', checkout: '2027-02-03' },
  };
}

/** Invalid bodies for the negative and known-bug tests. */
export const INVALID_BOOKINGS = {
  missingRequiredFields: { firstname: 'OnlyName' },
  checkoutBeforeCheckin: () => newBooking({ bookingdates: { checkin: '2027-01-15', checkout: '2027-01-10' } }),
  nonNumericPrice: () => ({ ...newBooking(), totalprice: 'abc' }),
  negativePrice: () => newBooking({ totalprice: -5 }),
};
