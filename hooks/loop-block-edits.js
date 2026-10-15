// PreToolUse / Edit|Write|MultiEdit
// After THRESHOLD consecutive failed test cycles, blocks further edits
// and forces a git diff root-cause audit.
// exit 2 = block editing until human resets the counter.
const fs   = require('fs');
const path = require('path');

try { fs.readFileSync(0, 'utf8'); } catch (e) {} // consume stdin

const THRESHOLD = 3;
const stateFile  = path.join(process.cwd(), '.claude', '.loop-state');

let n = 0;
try {
  n = parseInt(fs.readFileSync(stateFile, 'utf8').trim()) || 0;
} catch (e) { n = 0; }

if (n >= THRESHOLD) {
  process.stderr.write(
    `LOOP GUARD: ${n} consecutive failed test cycles.\n` +
    'Editing is BLOCKED. STOP.\n' +
    '1. Run: git diff\n' +
    '2. Run: git diff --stat\n' +
    '3. Identify the ROOT CAUSE across ALL changed files this session.\n' +
    '4. Explain it to the human and wait for instructions.\n' +
    'To reset: echo 0 > .claude/.loop-state'
  );
  process.exit(2);
}

process.exit(0);