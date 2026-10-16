// PreToolUse / Bash
// Blocks test commands when .claude/HUMAN_RUNS_TESTS exists.
// exit 2 = block (only exit 2 blocks; exit 1 is non-blocking)
const fs   = require('fs');
const path = require('path');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0); // defensive: allow on parse error, never block real work
}

const cmd     = (input.tool_input && input.tool_input.command) || '';
const flagFile = path.join(process.cwd(), '.claude', 'HUMAN_RUNS_TESTS');

if (!fs.existsSync(flagFile)) process.exit(0);

// The agent MAY run UNIT tests locally (vitest/jest — fast, no side effects). Only E2E is blocked
// (Playwright / `npm run e2e` / Cypress) — the human runs those.
// Example: `npx vitest run` passes through; `npx playwright test e2e/login.spec.ts` is blocked.
// NB: no match on the bare word "e2e" — it gives false positives on commands that only MENTION
// e2e in their text (e.g. `grep -r "e2e" docs/`).
const E2E_RE = /(playwright\s+test|npx\s+playwright|(npm|pnpm|yarn|bun)(\s+run)?\s+(test:)?e2e\b|cypress\s+(run|open))/i;

if (E2E_RE.test(cmd)) {
  process.stderr.write(
    'BLOCKED: human runs E2E tests this session (HUMAN_RUNS_TESTS is set).\n' +
    'Unit tests (vitest/jest) are allowed; E2E (Playwright) is NOT — ask the human to run it and paste the output.\n' +
    'To give full control back to Claude: delete .claude/HUMAN_RUNS_TESTS'
  );
  process.exit(2);
}

process.exit(0);