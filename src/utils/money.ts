/**
 * Extracts the amount from a label such as "$29.99", "Tax: $3.68" or "Item total: $0".
 * Throws instead of returning NaN, so a changed label fails the test loudly.
 */
export function parsePrice(label: string | null): number {
  const match = label?.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`No price in label: "${label}"`);
  return Number(match[1]);
}

/** Rounds to cents the way a price is shown on the site. */
export function cents(value: number): number {
  return Math.round(value * 100) / 100;
}
