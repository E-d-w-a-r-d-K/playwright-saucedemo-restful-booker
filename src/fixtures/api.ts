import { test as base, expect } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import { step } from '../utils/step';

interface ApiFixtures {
  client: BookingClient;
  token: string;
  /** Remembers booking ids a test creates; they are deleted after the test, pass or fail. */
  cleanup: (id: number) => void;
}

export const test = base.extend<ApiFixtures>({
  client: async ({ request }, use) => use(new BookingClient(request)),
  token: async ({ client }, use) => use(await client.token()),
  cleanup: async ({ client, token }, use) => {
    const ids: number[] = [];
    await use(id => ids.push(id));
    if (ids.length > 0) {
      await step(`Clean up: delete booking(s) ${ids.join(', ')}`, async () => {
        for (const id of ids) await client.delete(id, token);
      });
    }
  },
});

export { expect };
