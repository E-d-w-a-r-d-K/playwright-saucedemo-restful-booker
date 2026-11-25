import { type Locator, type Page } from '@playwright/test';
import { step } from '../../utils/step';

export interface SocialLink {
  name: string;
  href: string;
  target: string;
}

/** The footer of the pages after login: social links and copyright. */
export class Footer {
  readonly socialLinks: Locator;

  constructor(private readonly page: Page) {
    this.socialLinks = page.getByTestId(/^social-/);
  }

  /** Every social link in the order shown: its text, address and where it opens. */
  async links(): Promise<SocialLink[]> {
    return this.socialLinks.evaluateAll(links =>
      links.map(a => ({ name: a.textContent ?? '', href: a.getAttribute('href') ?? '', target: a.getAttribute('target') ?? '' })),
    );
  }

  /** Clicks a social link and returns the tab it opened. */
  async openSocial(name: string): Promise<Page> {
    return step(`Open the "${name}" link in the footer`, async () => {
      const [popup] = await Promise.all([
        this.page.waitForEvent('popup'),
        this.page.getByRole('link', { name, exact: true }).click(),
      ]);
      await popup.waitForLoadState('domcontentloaded');
      return popup;
    });
  }
}
