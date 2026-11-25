/**
 * Allure metadata through Playwright annotations (allure-playwright maps "allure.label.<name>" to a label),
 * so specs need no Allure import and the Playwright HTML report shows the same annotations.
 */
export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export const EPIC = {
  ui: 'saucedemo — UI',
  visual: 'saucedemo — screenshots',
  api: 'restful-booker — API',
} as const;

const label = (name: string, value: string) => ({ type: `allure.label.${name}`, description: value });

/** Groups a describe block in the Allure "Behaviors" tree: epic → feature. */
export function area(epic: (typeof EPIC)[keyof typeof EPIC], feature: string) {
  return { annotation: [label('epic', epic), label('feature', feature)] };
}

export function severity(level: Severity) {
  return { annotation: label('severity', level) };
}

/** Bug reports live in README.md; each report has an anchor equal to its id ("#BUG-UI-1"). */
export const bugReportUrl = (id: string) =>
  `https://github.com/E-d-w-a-r-d-K/playwright-saucedemo-restful-booker/blob/main/README.md#${id}`;
