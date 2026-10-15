// node --test hooks/tests — simulated hook input for loop-count.js (trial-and-error guard + test counter)
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, '..', 'loop-count.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-count-'));
  return { dir, run: (input) => {
    const r = spawnSync('node', [HOOK], {
      input: JSON.stringify(input),
      cwd: dir, // the test-failure counter writes .claude/.loop-state under cwd
      env: { ...process.env, LOOP_STATE_DIR: path.join(dir, 'loop') },
      encoding: 'utf8',
    });
    return { code: r.status, err: r.stderr };
  } };
}

const call = (tool, command, session = 's1', tool_response = '') =>
  ({ session_id: session, hook_event_name: 'PostToolUse', tool_name: tool, tool_input: { command }, tool_response });
const shell = (c = 'node x.js') => call('Bash', c);
const browser = () => call('mcp__plugin_playwright_playwright__browser_click', undefined);

function repeat(run, input, n) {
  let last;
  for (let i = 0; i < n; i++) last = run(input);
  return last;
}

test('19 shell calls: silent; the 20th warns with STOP', () => {
  const { run } = sandbox();
  assert.strictEqual(repeat(run, shell(), 19).code, 0);
  const r = run(shell());
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /LOOP GUARD: 20 consecutive shell/);
  assert.match(r.err, /Reproduce the error/);
});

test('warns again only every +10 (30), not at 21', () => {
  const { run } = sandbox();
  repeat(run, shell(), 20);
  assert.strictEqual(run(shell()).code, 0);
  assert.strictEqual(repeat(run, shell(), 9).code, 2); // 30th
});

test('a test command resets the counter', () => {
  const { run } = sandbox();
  repeat(run, shell(), 15);
  run(call('Bash', 'npx vitest run', 's1', 'Tests  3 passed (3)'));
  assert.strictEqual(repeat(run, shell(), 19).code, 0);
});

test('git diff / git status reset the counter', () => {
  const { run } = sandbox();
  repeat(run, shell(), 15);
  run(shell('git diff --stat'));
  assert.strictEqual(repeat(run, shell(), 19).code, 0);
  run(shell('git status'));
  assert.strictEqual(repeat(run, shell(), 19).code, 0);
});

test('Edit in between does NOT reset (edit→run loop is the target)', () => {
  const { run } = sandbox();
  repeat(run, shell(), 10);
  run({ session_id: 's1', hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: 'a.js' } });
  const r = repeat(run, shell(), 10);
  assert.strictEqual(r.code, 2);
});

test('browser calls are counted separately, PowerShell counts as shell', () => {
  const { run } = sandbox();
  repeat(run, shell(), 15);
  const r = repeat(run, browser(), 20);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /browser/);
  assert.strictEqual(repeat(run, call('PowerShell', 'Get-ChildItem'), 5).code, 2); // shell 15+5 = 20
});

test('counters are per session', () => {
  const { run } = sandbox();
  repeat(run, shell(), 19);
  assert.strictEqual(run(call('Bash', 'ls', 'other')).code, 0);
});

test('existing failed-test counter still works', () => {
  const { dir, run } = sandbox();
  run(call('Bash', 'npm test', 's1', 'Tests  2 failed | 3 passed'));
  assert.strictEqual(fs.readFileSync(path.join(dir, '.claude', '.loop-state'), 'utf8'), '1');
  run(call('Bash', 'npm test', 's1', 'Tests  5 passed (5)'));
  assert.strictEqual(fs.readFileSync(path.join(dir, '.claude', '.loop-state'), 'utf8'), '0');
});

test('malformed stdin exits 0', () => {
  const { dir } = sandbox();
  const r = spawnSync('node', [HOOK], { input: 'nope', cwd: dir, encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
});
