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

// 2026-07-11 (decizia utilizatorului): Claude POATE rula teste UNIT local (vitest/jest — rapide, fără
// efecte secundare). Rămân blocate doar E2E (Playwright / npm run e2e) — pe acelea le rulează omul.
// NB: fără match pe cuvântul gol "e2e" — dă fals pozitive pe comenzi care doar MENȚIONEAZĂ e2e în text.
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