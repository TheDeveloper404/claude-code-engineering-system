// PostToolUse / Edit|Write|MultiEdit|Skill + UserPromptSubmit  (GLOBAL — every project)
// Mechanical counter: "how much production code has changed since the last real
// /code-review". Originated 2026-07-16 in a client project after a repeat SDLC-rule miss (memory
// alone didn't hold); promoted here 2026-07-26 to apply everywhere, not just one project.
// - Edit/Write/MultiEdit on production code (app/, server/, components/, lib/, db/) INCREMENTS.
//   Projects without these dirs simply never match — no-op, never false-blocks.
// - Invoking the `code-review` skill/command RESETS the counter to 0.
// - Over threshold → block (exit 2), demand a real /code-review before continuing.
//
// BUG fixed 2026-08-07: the reset only ever fired on `PostToolUse:Skill` with
// tool_input.skill matching /code-review/i — but the `code-review` skill has
// disable-model-invocation, so it NEVER runs as a Skill tool call the assistant makes; it only
// runs as a user-typed `/code-review` slash command, dispatched by the harness directly (forked
// background agent), which never surfaces as a `Skill` tool call in PostToolUse. Net effect: the
// reset branch was dead code, the counter only ever grew, and every real review still got
// reported as "0 reviews since last threshold". Fixed by ALSO resetting on `UserPromptSubmit`
// whenever the raw prompt is the `/code-review` command (with or without trailing args like a PR
// number or "ultra") — this is how every real invocation actually reaches the hook system.
// State is per-project (.claude/.hook-state/ under the REPO ROOT), so each project keeps its
// own independent counter.
//
// The state path is anchored to the git root, NOT to process.cwd() — fixed 2026-08-04 after
// the counter blocked forever in one project. There, the Next app lives in a
// subdirectory, so the reset (fired with cwd = subproject) and the increments (fired with
// cwd = repo root) wrote to two DIFFERENT files: the reset never reached the counter that
// was blocking. Anchoring to the repo root makes both sides agree regardless of cwd.
//
// exit 2 = surfaces the message to Claude. Any internal error = exit 0 (never block real work).
const fs = require('fs');
const path = require('path');

const THRESHOLD = 20;

/**
 * Walk up from cwd to the nearest directory containing `.git`, so every hook invocation
 * for a given repo resolves to the same state file no matter which subdirectory it fires
 * from. `.git` is a directory in a normal clone and a file in a worktree/submodule — both
 * count. Falls back to cwd when there is no repo above us (state stays local, as before).
 */
function findRepoRoot(startDir) {
  try {
    let dir = startDir;
    while (true) {
      if (fs.existsSync(path.join(dir, '.git'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) return startDir; // hit the filesystem root
      dir = parent;
    }
  } catch (e) {
    return startDir; // unreadable parent dir etc. — degrade to old behaviour, never throw
  }
}

const REPO_ROOT = findRepoRoot(process.cwd());
const STATE_DIR = path.join(REPO_ROOT, '.claude', '.hook-state');
const STATE_FILE = path.join(STATE_DIR, 'review-checkpoint-count.txt');

// Per-repo opt-out (2026-08-09): presence of this marker file disables the checkpoint for THIS
// repo only — other projects using the same global hook are unaffected. Scoped, reversible: delete
// the marker to re-enable. Used when a user explicitly asks to defer /code-review to the end of a
// large feature instead of every 20 changes (e.g. one large feature, 2026-08-09).
const DISABLE_MARKER = path.join(STATE_DIR, 'review-checkpoint-disabled');
if (fs.existsSync(DISABLE_MARKER)) process.exit(0);

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}

function readCount() {
  try {
    return parseInt(fs.readFileSync(STATE_FILE, 'utf8').trim(), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function writeCount(n) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, String(n));
  } catch (e) {
    // lost state = counter restarts at 0; never block real work over this
  }
}

// User typed the `/code-review` slash command -> reset. This is the path that ACTUALLY fires in
// practice (see the 2026-08-07 note above) since the skill can't be invoked as a Skill tool call.
if (input.hook_event_name === 'UserPromptSubmit') {
  const prompt = (input.prompt || '').trim();
  if (/^\/code-review\b/i.test(prompt)) {
    writeCount(0);
  }
  process.exit(0);
}

const toolName = input.tool_name || '';

// Kept as a belt-and-suspenders path in case some future invocation route DOES go through the
// Skill tool (e.g. a differently-configured project without disable-model-invocation).
if (toolName === 'Skill') {
  const skillName = (input.tool_input && input.tool_input.skill) || '';
  if (/code-review/i.test(skillName)) {
    writeCount(0);
  }
  process.exit(0);
}

if (!/^(Edit|Write|MultiEdit)$/.test(toolName)) process.exit(0);

const filePath = (input.tool_input && input.tool_input.file_path) || '';
if (!filePath) process.exit(0);
const norm = filePath.replace(/\\/g, '/');

// Only production code — not tests, not docs, not config.
if (!/\/(app|server|components|lib|db)\//.test(norm)) process.exit(0);
if (/\.(test|spec)\.[tj]sx?$/.test(norm)) process.exit(0);
if (/\/(node_modules|\.next|dist|build|e2e)\//.test(norm)) process.exit(0);

const count = readCount() + 1;
writeCount(count);

if (count > THRESHOLD) {
  process.stderr.write(
    THRESHOLD + '+ production code changes since the last real /code-review (' + count +
    ' so far). Do not chain feature after feature without a real check in between — ' +
    'run /code-review before continuing with another production code change.'
  );
  process.exit(2);
}

process.exit(0);
