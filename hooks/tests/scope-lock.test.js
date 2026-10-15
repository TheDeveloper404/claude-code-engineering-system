// node --test hooks/tests — simulated hook input for scope-lock.js
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, '..', 'scope-lock.js');

// Opted-in repo (git root with .claude/scope-lock.on); sessions start in a subdirectory (server/).
const REPO = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-repo-'));
fs.mkdirSync(path.join(REPO, '.git'));
fs.mkdirSync(path.join(REPO, '.claude'));
fs.writeFileSync(path.join(REPO, '.claude', 'scope-lock.on'), '');
fs.mkdirSync(path.join(REPO, 'server'));
const CWD = path.join(REPO, 'server');

function freshState() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'scope-lock-'));
}

function run(stateDir, input) {
  if (typeof input === 'object' && !('cwd' in input)) input = { ...input, cwd: CWD };
  const r = spawnSync('node', [HOOK], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    env: { ...process.env, SCOPE_LOCK_STATE_DIR: path.join(stateDir, 'scope') },
    encoding: 'utf8',
  });
  return { code: r.status, err: r.stderr };
}

const S = 'sess-1';
const edit = (file = 'D:\\proj\\src\\a.js', session = S) =>
  ({ session_id: session, hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: file } });
const bash = (command, tool = 'Bash') =>
  ({ session_id: S, hook_event_name: 'PreToolUse', tool_name: tool, tool_input: { command } });
const exitPlan = (event = 'PostToolUse') =>
  ({ session_id: S, hook_event_name: event, tool_name: 'ExitPlanMode', tool_input: {} });

test('unclassified session: first edit is blocked with /classify hint', () => {
  const d = freshState();
  const r = run(d, edit());
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /classify/);
});

test('repo without .claude/scope-lock.on: hook is still active (global), unclassified edit blocked', () => {
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'plain-repo-'));
  fs.mkdirSync(path.join(other, '.git'));
  assert.strictEqual(run(freshState(), { ...edit(), cwd: other }).code, 2);
});

test('SMALL: edits pass', () => {
  const d = freshState();
  assert.strictEqual(run(d, bash('node "C:\\Users\\me\\.claude\\hooks\\scope-set.js" SMALL')).code, 0);
  assert.strictEqual(run(d, edit()).code, 0);
});

test('NORMAL without approved plan: edit blocked', () => {
  const d = freshState();
  run(d, bash('node scope-set.js NORMAL'));
  const r = run(d, edit());
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /Plan Mode/);
});

test('NORMAL after ExitPlanMode PostToolUse: edits pass', () => {
  const d = freshState();
  run(d, bash('node scope-set.js NORMAL'));
  assert.strictEqual(run(d, exitPlan()).code, 0);
  assert.strictEqual(run(d, edit()).code, 0);
});

test('ExitPlanMode PreToolUse (not yet approved) does not unlock', () => {
  const d = freshState();
  run(d, bash('node scope-set.js CRITICAL'));
  run(d, exitPlan('PreToolUse'));
  assert.strictEqual(run(d, edit()).code, 2);
});

test('re-classifying resets plan approval', () => {
  const d = freshState();
  run(d, bash('node scope-set.js NORMAL'));
  run(d, exitPlan());
  run(d, bash('node scope-set.js CRITICAL'));
  assert.strictEqual(run(d, edit()).code, 2);
});

test('scope-set via PowerShell tool is recorded too', () => {
  const d = freshState();
  run(d, bash('node scope-set.js small', 'PowerShell'));
  assert.strictEqual(run(d, edit()).code, 0);
});

test('state is per session', () => {
  const d = freshState();
  run(d, bash('node scope-set.js SMALL'));
  assert.strictEqual(run(d, edit('D:\\proj\\a.js', 'other-session')).code, 2);
});

test('exempt paths pass unclassified: memory, plans, .remember, temp', () => {
  const d = freshState();
  for (const f of [
    'C:\\Users\\me\\.claude\\projects\\D--x\\memory\\a.md',
    'C:\\Users\\me\\.claude\\plans\\p.md',
    'D:\\work\\my-app\\.remember\\now.md',
    'C:\\Users\\me\\AppData\\Local\\Temp\\claude\\x\\scratchpad\\a.txt',
  ]) assert.strictEqual(run(d, edit(f)).code, 0, f);
});

test('unrelated Bash command changes nothing', () => {
  const d = freshState();
  run(d, bash('git status'));
  assert.strictEqual(run(d, edit()).code, 2);
});

test('malformed stdin fails open', () => {
  assert.strictEqual(run(freshState(), 'not json').code, 0);
});

test('kill switch disables the gate', () => {
  const d = freshState();
  fs.writeFileSync(path.join(d, 'scope-lock.off'), '');
  assert.strictEqual(run(d, edit()).code, 0);
});

test('blocks are logged to decisions.jsonl', () => {
  const d = freshState();
  run(d, edit());
  const log = fs.readFileSync(path.join(d, 'scope', 'decisions.jsonl'), 'utf8');
  assert.match(log, /"decision":"block"/);
});
