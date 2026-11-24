import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { type Booking, CREDENTIALS } from '../data/booking';

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

  /** `unknown` on purpose: negative tests send bodies that are not a valid Booking. */
  create(booking: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  /** Creates a valid booking and returns its id; fails loudly if the API refuses. */
  async createId(booking: Booking): Promise<number> {
    const response = await this.create(booking);
    if (!response.ok()) throw new Error(`POST /booking → ${response.status()}: ${await response.text()}`);
    return (await response.json()).bookingid;
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
