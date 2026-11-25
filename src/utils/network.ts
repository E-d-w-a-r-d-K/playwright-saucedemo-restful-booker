import { type BrowserContext } from '@playwright/test';
import { step } from './step';

/**
 * Answers requests to these external addresses with a stub page, so a test can follow a link off the site
 * and check where it landed without depending on (or loading) the external site.
 */
export async function stubExternalPages(context: BrowserContext, urls: string[]) {
  await step(`Stub external pages: ${urls.join(', ')}`, async () => {
    for (const url of urls) {
      await context.route(url, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
    }
  });
}
