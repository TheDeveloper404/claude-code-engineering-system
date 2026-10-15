// PreToolUse Edit|Write|MultiEdit|NotebookEdit + PreToolUse Bash|PowerShell + PostToolUse ExitPlanMode  (GLOBAL)
// Makes the CLAUDE.md "Scope — rule #1" + Step 0 classification mechanical, per session:
// - first edit of a session is blocked until the task is classified (/classify runs `scope-set <LEVEL>`);
// - SMALL -> edits pass;
// - NORMAL/CRITICAL -> edits blocked until the plan is approved in Plan Mode (PostToolUse ExitPlanMode
//   fires only after the user accepts the plan in the UI).
// `scope-set.js` itself does nothing: this hook sees the Bash command (with session_id, which a
// Bash command cannot know) and records the level. Re-classifying resets plan approval.
// State: <config>/.hook-state/scope/<session_id>.json — outside any repo.
// Active in EVERY project (global since 2026-10-10; before that opt-in via `.claude/scope-lock.on`, now ignored).
// Kill switch: <config>/.hook-state/scope-lock.off. Any internal error = exit 0 (never block real work).
// exit 2 = block (stderr is shown to Claude).
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.resolve(__dirname, '..');
const STATE_DIR = process.env.SCOPE_LOCK_STATE_DIR || path.join(CONFIG_DIR, '.hook-state', 'scope');
const KILL_SWITCH = path.join(STATE_DIR, '..', 'scope-lock.off');

// Paths Claude may always write: memory, plan files, remember plugin, scratchpad/temp.
const EXEMPT = [
  /\/\.?claude\/projects\/[^/]+\/memory\//,
  /\/\.?claude\/plans\//,
  /\/\.remember\//,
  /\/appdata\/local\/temp\//,
];

const SET_RE = /scope-set(?:\.js)?["']?\s+(SMALL|NORMAL|CRITICAL)\b/i;

// Walk up from cwd to the nearest directory containing `.git` (same approach as review-checkpoint.js).
function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

function readState(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}

function writeState(file, state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state));
}

function log(entry) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(path.join(STATE_DIR, 'decisions.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch (e) { /* logging never blocks */ }
}

function block(msg, entry) {
  log({ ...entry, decision: 'block' });
  process.stderr.write(msg);
  process.exit(2);
}

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (fs.existsSync(KILL_SWITCH)) process.exit(0);

  const session = input.session_id;
  if (!session) process.exit(0);
  const file = path.join(STATE_DIR, session.replace(/[^\w-]/g, '_') + '.json');
  const tool = input.tool_name || '';
  const event = input.hook_event_name || '';

  // 1) Classification recorded from the `scope-set <LEVEL>` command.
  if (tool === 'Bash' || tool === 'PowerShell') {
    const m = SET_RE.exec((input.tool_input && input.tool_input.command) || '');
    if (m) {
      const level = m[1].toUpperCase();
      writeState(file, { level, planApproved: false });
      log({ session, event: 'classify', level });
    }
    process.exit(0);
  }

  // 2) Plan approved in Plan Mode.
  if (tool === 'ExitPlanMode') {
    if (event === 'PostToolUse') {
      writeState(file, { ...readState(file), planApproved: true });
      log({ session, event: 'plan-approved' });
    }
    process.exit(0);
  }

  // 3) Edit gate.
  const target = ((input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path)) || '')
    .replace(/\\/g, '/').toLowerCase();
  if (EXEMPT.some((re) => re.test(target))) process.exit(0);

  const state = readState(file);
  const entry = { session, event: 'edit', level: state.level || null, file: path.basename(target) };

  if (!state.level) {
    block(
      'SCOPE-LOCK: task not classified in this session — edit blocked.\n' +
      'Run /classify BEFORE the first edit (SMALL -> implement directly; NORMAL/CRITICAL -> Plan Mode).\n',
      entry);
  }
  if (state.level !== 'SMALL' && !state.planApproved) {
    block(
      `SCOPE-LOCK: ${state.level} task without an approved plan — edit blocked.\n` +
      'Enter Plan Mode (EnterPlanMode) and present the plan; edits unlock once the user approves it.\n' +
      'Implement ONLY what the plan contains (CLAUDE.md "Scope — rule #1").\n',
      entry);
  }
  process.exit(0);
} catch (e) {
  process.exit(0);
}
