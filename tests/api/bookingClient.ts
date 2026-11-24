import { type APIRequestContext, type APIResponse } from '@playwright/test';

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

export const CREDENTIALS = { username: 'admin', password: 'password123' };

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

/** Thin wrapper over restful-booker: one method per endpoint, returns the raw response. */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  auth(credentials = CREDENTIALS): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }

  async token(): Promise<string> {
    const response = await this.auth();
    const body = await response.json();
    if (typeof body.token !== 'string' || body.token.length === 0) {
      throw new Error(`No token in /auth response: ${JSON.stringify(body)}`);
    }
    return body.token;
  }

  create(booking: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  update(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: authCookie(token) });
  }

  delete(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: authCookie(token) });
  }
}

function authCookie(token?: string): Record<string, string> {
  return token ? { Cookie: `token=${token}` } : {};
}
