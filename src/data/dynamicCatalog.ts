/**
 * Facts about the "Dynamic Catalog" pages (menu → Dynamic Catalog → Lazy Load / Spinner / Slider), taken from the
 * site's own code (assets/index-*.js: the spinner delay is `500 + Math.random() * 2500` ms, the slider advances with
 * `setInterval(…, 2000)`, the lazy list grows by 6 items each time its end comes into view) and confirmed in the browser.
 * They are copied by hand (the site's code is not a dependency of this repo); every value is asserted by a test at its
 * exact boundary, so a change on the site turns a test red instead of passing silently.
 */
export type DynamicCatalogMode = 'lazy-load' | 'spinner' | 'slider';

/** The lazy-list counts depend on how many cards fit on screen, so these specs pin the viewport. */
export const DYNAMIC_CATALOG_VIEWPORT = { width: 1280, height: 720 };

export const DYNAMIC_CATALOG_TITLES: Record<DynamicCatalogMode, string> = {
  'lazy-load': 'Dynamic Catalog - Lazy Load',
  spinner: 'Dynamic Catalog - Spinner',
  slider: 'Dynamic Catalog - Slider',
};

/** The spinner shows for a random time within these bounds before the products appear. */
export const SPINNER_DELAY_MS = { min: 500, max: 3000 } as const;

/** The slider moves to the next product this often. */
export const SLIDER_INTERVAL_MS = 2000;

/** Items the lazy list adds each time its end comes into view. */
export const LAZY_LOAD_BATCH = 6;

/**
 * Items the lazy list shows after opening at the ui project's viewport (1280×720): the first batch of 6, and since
 * its end is already in view, one more batch.
 */
export const LAZY_LOAD_INITIAL = 12;

/** The first cards of the lazy list, in order, as the site's data defines them (prices are the catalogue's). */
export const LAZY_LOAD_FIRST_CARDS = [
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt (XS)',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red) (XS)',
  'Sauce Labs Backpack',
  'Sauce Labs Fleece Jacket (XS)',
  'Sauce Labs Fleece Jacket (S)',
  'Sauce Labs Fleece Jacket (M)',
  'Sauce Labs Fleece Jacket (L)',
  'Sauce Labs Fleece Jacket (XL)',
  'Sauce Labs Fleece Jacket (XXL)',
  'Test.allTheThings() T-Shirt (Red) (S)',
];

/** What a lazy card shows until it has been in view (each card has its own IntersectionObserver). */
export const LAZY_LOAD_PLACEHOLDER = 'Loading…';

/** BUG-UI-5: the lazy list's data holds this card twice, at 0-based positions 13 and 14. */
export const LAZY_LOAD_DUPLICATE = { position: 14, name: 'Test.allTheThings() T-Shirt (Red) (L)' };

/** Lazy-list items are catalogue products, some in sizes: "Sauce Labs Fleece Jacket (XS)". */
export const SIZE_SUFFIX = / \((XS|S|M|L|XL|XXL)\)$/;
