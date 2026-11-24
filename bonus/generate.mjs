#!/usr/bin/env node
/**
 * Test-case text → Playwright test → run.
 *
 *   node bonus/generate.mjs bonus/cases/01-remove-on-inventory.txt
 *
 * 1. Reads a plain-text test case (title, steps, expected result).
 * 2. Builds a prompt from the project rules (CLAUDE.md), the page objects, fixtures, test data and routes,
 *    and one existing spec as a style example — so the model reuses our layers instead of inventing locators.
 * 3. Asks a model for ONE spec file:
 *      - default: Claude Code in headless mode (`claude -p`, model from GEN_MODEL if set), no API key needed;
 *      - if ANTHROPIC_API_KEY is set: the Anthropic Messages API directly (model from GEN_MODEL).
 * 4. Gates the answer before it can enter the suite:
 *      - the answer must contain a ```ts block (no prose saved as a spec);
 *      - no raw selectors / sleeps in the spec (getBy*, locator(), $(), waitForTimeout, xpath, css=);
 *      - the project type-checks with the spec in it;
 *      - Playwright runs it: at least one test passed, nothing skipped, failed or flaky.
 *    The spec is first written as tests/ui/generated/<case>.candidate.spec.ts. Only if every gate passes AND no
 *    reviewed spec with that name exists yet, it becomes tests/ui/generated/<case>.spec.ts; a reviewed spec is never
 *    overwritten. A candidate that fails is removed from tests/.
 * 5. Keeps everything for review in bonus/examples/<case>/: input.txt, generated.spec.ts (raw model output),
 *    run.log (Playwright output) and result.json (model, timing and every gate).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const casePath = process.argv[2];
if (!casePath) {
  console.error('Usage: node bonus/generate.mjs <test-case.txt>');
  process.exit(2);
}

const caseName = path.basename(casePath, path.extname(casePath));
const testCase = fs.readFileSync(casePath, 'utf8').trim();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const isWindows = process.platform === 'win32';

const context = [
  'CLAUDE.md',
  'src/fixtures/ui.ts',
  'src/pages/components/Header.ts',
  'src/pages/LoginPage.ts',
  'src/pages/InventoryPage.ts',
  'src/pages/ProductPage.ts',
  'src/pages/CartPage.ts',
  'src/pages/CheckoutPage.ts',
  'src/data/products.ts',
  'src/data/checkout.ts',
  'src/data/messages.ts',
  'src/data/users.ts',
  'src/data/routes.ts',
  'src/utils/money.ts',
  'tests/ui/cart.spec.ts',
].map(rel => `--- FILE: ${rel} ---\n${read(rel)}`).join('\n\n');

const prompt = `You write Playwright + TypeScript UI tests for https://www.saucedemo.com in an existing project.

Project files you must build on:

${context}

Write ONE spec file for the test case below. Rules:
- The file is saved as tests/ui/generated/${caseName}.spec.ts, so imports start with '../../../src/...'.
- Import { test, expect } from '../../../src/fixtures/ui' and use its fixtures (loggedIn, header, cart, checkout, productPage, loginPage, inventory).
- Use only page-object methods and locators from the files above. No raw selectors, no page.locator / getByTestId / getByRole in the spec.
  If a needed action does not exist in the page objects, say so in a comment at the top instead of inventing a selector.
- Use data from src/data (product(), CATALOGUE, CUSTOMER, MESSAGES, ROUTES) instead of literals where it exists.
- Read lists with expect.poll(() => page.products()) so the read retries until the page settles.
- Arrange / Act / Assert, assert exact values. No waitForTimeout.
- Reply with the TypeScript code only, in a single \`\`\`ts block.

TEST CASE:
${testCase}
`;

const model = process.env.GEN_MODEL || null;

function askClaudeCli(text) {
  // Claude Code headless mode; the prompt goes through stdin, the answer is plain text.
  const args = ['-p', '--output-format', 'text', ...(model ? ['--model', model] : [])];
  const result = spawnSync('claude', args, {
    input: text, encoding: 'utf8', cwd: root, shell: isWindows, maxBuffer: 10 * 1024 * 1024, timeout: 300_000,
  });
  if (result.status !== 0) throw new Error(`claude -p failed (${result.status}): ${result.stderr || result.stdout}`);
  return result.stdout;
}

async function askAnthropicApi(text) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: model || 'claude-sonnet-5-5', max_tokens: 4000, messages: [{ role: 'user', content: text }] }),
  });
  if (!response.ok) throw new Error(`Anthropic API ${response.status}: ${await response.text()}`);
  const body = await response.json();
  return body.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
}

/** The ```ts block of the answer, or null — prose is never saved as a spec. */
function extractCode(answer) {
  const block = answer.match(/```(?:ts|typescript)?\s*\n([\s\S]*?)```/);
  return block ? block[1].trim() + '\n' : null;
}

/** Lines of the spec that break the layering rules (comments are ignored). */
function rawSelectorViolations(code) {
  const forbidden = /\bgetBy(TestId|Role|Text|Label|Placeholder|AltText|Title)\b|\.locator\(|\$\(|\$\$\(|waitForTimeout|xpath=|css=/;
  return code
    .split('\n')
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text }) => !text.startsWith('//') && !text.startsWith('*') && forbidden.test(text));
}

const npx = (args, extra = {}) =>
  spawnSync('npx', args, { cwd: root, encoding: 'utf8', shell: isWindows, maxBuffer: 10 * 1024 * 1024, ...extra });

// ---- generate --------------------------------------------------------------------------------------------------
const provider = process.env.ANTHROPIC_API_KEY ? 'anthropic-api' : 'claude-cli';
console.log(`[${caseName}] asking the model via ${provider}${model ? ` (${model})` : ''}...`);
const started = Date.now();
const answer = provider === 'anthropic-api' ? await askAnthropicApi(prompt) : askClaudeCli(prompt);
const generatedInSeconds = Math.round((Date.now() - started) / 1000);
const code = extractCode(answer);

const exampleDir = path.join(root, 'bonus', 'examples', caseName);
fs.mkdirSync(exampleDir, { recursive: true });
fs.writeFileSync(path.join(exampleDir, 'input.txt'), testCase + '\n');
fs.writeFileSync(path.join(exampleDir, 'generated.spec.ts'), code ?? answer);

const result = {
  case: caseName,
  provider,
  model: model ?? 'claude-cli default',
  generatedInSeconds,
  gates: { codeBlock: code !== null, rawSelectors: [], typecheck: 'not run', run: null },
  passed: false,
  savedAs: null,
};

function finish(log = '') {
  fs.writeFileSync(path.join(exampleDir, 'run.log'), log);
  fs.writeFileSync(path.join(exampleDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`[${caseName}] ${result.passed ? 'PASSED' : 'FAILED'} — bonus/examples/${caseName}/result.json`);
  process.exit(result.passed ? 0 : 1);
}

if (!code) finish('No ```ts block in the model answer; nothing was written to tests/.\n');

result.gates.rawSelectors = rawSelectorViolations(code);
if (result.gates.rawSelectors.length > 0) finish('Raw selectors in the generated spec; nothing was written to tests/.\n');

// ---- candidate: typecheck + run ----------------------------------------------------------------------------------
const generatedDir = path.join(root, 'tests', 'ui', 'generated');
const candidatePath = path.join(generatedDir, `${caseName}.candidate.spec.ts`);
const finalPath = path.join(generatedDir, `${caseName}.spec.ts`);
fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(candidatePath, code);

let log = '';
try {
  const typecheck = npx(['tsc', '--noEmit', '-p', '.']);
  result.gates.typecheck = typecheck.status === 0 ? 'ok' : (typecheck.stdout || typecheck.stderr).trim();

  const run = npx(['playwright', 'test', path.relative(root, candidatePath).replaceAll('\\', '/'), '--project=ui', '--reporter=list']);
  log = `${run.stdout}\n${run.stderr}`.trim() + '\n';
  // Exit code 0 also means "everything was skipped", so read the summary as well.
  const count = word => Number(log.match(new RegExp(`(\\d+) ${word}`))?.[1] ?? 0);
  result.gates.run = { exitCode: run.status, passed: count('passed'), failed: count('failed'), skipped: count('skipped'), flaky: count('flaky') };

  const { run: r } = result.gates;
  result.passed = result.gates.typecheck === 'ok' && r.exitCode === 0 && r.passed > 0 && r.failed === 0 && r.skipped === 0 && r.flaky === 0;

  if (result.passed && !fs.existsSync(finalPath)) {
    fs.renameSync(candidatePath, finalPath);
    result.savedAs = path.relative(root, finalPath).replaceAll('\\', '/');
  } else if (result.passed) {
    result.savedAs = 'not saved: a reviewed spec with this name already exists — compare with bonus/examples by hand';
  }
} finally {
  // a failed or duplicate candidate never stays in tests/
  if (fs.existsSync(candidatePath)) fs.unlinkSync(candidatePath);
}
finish(log);
