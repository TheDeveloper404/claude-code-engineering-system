// PostToolUse / Bash|PowerShell + mcp__*playwright*|mcp__*chrome-devtools*
// 1) Counts consecutive FAILED test cycles into .claude/.loop-state.
//    Resets counter on green. Does not block (PostToolUse can't undo actions).
// 2) Trial-and-error guard (per session): counts shell and browser calls with no test run or
//    `git diff`/`git status` in between (other tools, incl. Edit, neither count nor reset — an
//    edit→run→edit loop is exactly what this catches). At LOOP_WARN, then every +LOOP_STEP,
//    exit 2 shows a STOP message to Claude. State: <config>/.hook-state/loop/<session_id>.json.
const fs   = require('fs');
const path = require('path');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}

const LOOP_WARN = 20;
const LOOP_STEP = 10;
const LOOP_DIR  = process.env.LOOP_STATE_DIR || path.join(__dirname, '..', '.hook-state', 'loop');

const tool = input.tool_name || '';
const cmd = (input.tool_input && input.tool_input.command) || '';
const TEST_RE = /((npm|pnpm|yarn|bun)(\s+run)?\s+test|jest|vitest|pytest|mvn.*test|gradle.*test|go\s+test)/i;
const CHECKPOINT_RE = /\bgit\s+(diff|status)\b/;
const kind = (tool === 'Bash' || tool === 'PowerShell') ? 'shell'
  : /playwright|chrome-devtools/i.test(tool) ? 'browser' : null;

let warning = '';
try {
  if (kind && input.session_id) {
    const file = path.join(LOOP_DIR, input.session_id.replace(/[^\w-]/g, '_') + '.json');
    let s = { shell: 0, browser: 0 };
    try { s = { ...s, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch (e) {}
    if (kind === 'shell' && (TEST_RE.test(cmd) || CHECKPOINT_RE.test(cmd))) {
      s = { shell: 0, browser: 0 };
    } else {
      s[kind] += 1;
      const n = s[kind];
      if (n >= LOOP_WARN && (n - LOOP_WARN) % LOOP_STEP === 0) {
        const label = kind === 'shell' ? 'shell (Bash/PowerShell)' : 'browser (Playwright/DevTools)';
        warning =
          `LOOP GUARD: ${n} consecutive ${label} calls without a test or git diff.\n` +
          'STOP — no more trying variants one by one.\n' +
          '1. Reproduce the error with ONE command.\n' +
          '2. Read the full error/output.\n' +
          '3. Tell the user the hypothesis + the evidence, then continue.\n';
      }
    }
    fs.mkdirSync(LOOP_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(s));
  }
} catch (e) { /* the guard never breaks the test counter below */ }

if (!TEST_RE.test(cmd)) {
  if (warning) { process.stderr.write(warning); process.exit(2); }
  process.exit(0); // not a test command — nothing more to count
}

const stateDir  = path.join(process.cwd(), '.claude');
const stateFile = path.join(stateDir, '.loop-state');
const resp      = JSON.stringify(input.tool_response || '');

// Global hook: a project may not have a .claude/ dir. Create it so writeFileSync
// below never throws (which would surface as stderr noise on every test run).
try { fs.mkdirSync(stateDir, { recursive: true }); } catch (e) { process.exit(0); }

let n = 0;
try {
  n = parseInt(fs.readFileSync(stateFile, 'utf8').trim()) || 0;
} catch (e) { n = 0; }

const FAIL_RE = /FAIL(?!URE\s+SUCCESS)|failing|\u2715|[1-9]\d*\s+failed|BUILD FAILURE|AssertionError/i;
// Reached only when FAIL_RE didn't match, so a bare "N passed" (vitest's
// "Tests  75 passed (75)", pytest's "75 passed in 1.2s", etc. \u2014 no "failed"
// count printed at all on a clean run) is a safe success signal here.
const PASS_RE = /all tests passed|\d+\s+passed|BUILD SUCCESS|^PASS$|\bPASS\b/im;

if (FAIL_RE.test(resp)) {
  fs.writeFileSync(stateFile, String(n + 1));
} else if (PASS_RE.test(resp)) {
  fs.writeFileSync(stateFile, '0');
}

process.exit(0);