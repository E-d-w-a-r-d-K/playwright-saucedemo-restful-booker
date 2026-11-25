import { type APIRequestContext, type APIResponse, test } from '@playwright/test';
import { type Booking, CREDENTIALS } from '../data/booking';
import { step } from '../utils/step';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Query filters GET /booking documents: names, and dates "on or after" (CCYY-MM-DD). */
export interface BookingFilter {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
}

/**
 * Thin wrapper over restful-booker: one method per endpoint, returns the raw response.
 * Every call is a report step ("POST /booking") with the request and the response attached,
 * so a failed API test shows exactly what was sent and what came back.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  auth(credentials = CREDENTIALS): Promise<APIResponse> {
    return this.call('POST', '/auth', { data: credentials });
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
    return this.call('POST', '/booking', { data: booking });
  }

  /** Creates a valid booking and returns its id; fails loudly if the API refuses. */
  async createId(booking: Booking): Promise<number> {
    const response = await this.create(booking);
    if (!response.ok()) throw new Error(`POST /booking → ${response.status()}: ${await response.text()}`);
    return (await response.json()).bookingid;
  }

  /** GET /booking — ids of all bookings, or of those matching the documented filters. */
  list(filter: BookingFilter = {}): Promise<APIResponse> {
    const query = new URLSearchParams(Object.entries(filter).filter((entry): entry is [string, string] => entry[1] !== undefined)).toString();
    return this.call('GET', query ? `/booking?${query}` : '/booking');
  }

  /** The ids GET /booking returns for the filter; fails loudly if the search itself fails. */
  async listIds(filter: BookingFilter = {}): Promise<number[]> {
    const response = await this.list(filter);
    if (!response.ok()) throw new Error(`GET /booking → ${response.status()}: ${await response.text()}`);
    return ((await response.json()) as Array<{ bookingid: number }>).map(b => b.bookingid);
  }

  get(id: number): Promise<APIResponse> {
    return this.call('GET', `/booking/${id}`);
  }

  update(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.call('PUT', `/booking/${id}`, { data: booking, token });
  }

  partialUpdate(id: number, change: Partial<Booking>, token?: string): Promise<APIResponse> {
    return this.call('PATCH', `/booking/${id}`, { data: change, token });
  }

  /** GET /ping — the documented health check. */
  ping(): Promise<APIResponse> {
    return this.call('GET', '/ping');
  }

  delete(id: number, token?: string): Promise<APIResponse> {
    return this.call('DELETE', `/booking/${id}`, { token });
  }

  private call(method: Method, path: string, options: { data?: unknown; token?: string } = {}): Promise<APIResponse> {
    const title = `${method} ${path}${options.token ? ' (with token)' : ''}`;
    return step(title, async () => {
      if (options.data !== undefined) {
        await test.info().attach('request body', {
          body: JSON.stringify(masked(options.data), null, 2),
          contentType: 'application/json',
        });
      }
      const response = await this.request.fetch(path, {
        method,
        data: options.data,
        headers: options.token ? { Cookie: `token=${options.token}` } : {},
      });
      await test.info().attach('response', {
        body: `${response.status()} ${response.statusText()}\n\n${await response.text()}`,
        contentType: 'text/plain',
      });
      return response;
    });
  }
}

/** Keeps passwords out of the report even though the sandbox credentials are public. */
function masked(data: unknown): unknown {
  if (data && typeof data === 'object' && 'password' in data) return { ...data, password: '***' };
  return data;
}
