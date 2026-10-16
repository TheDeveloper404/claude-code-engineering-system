// PostToolUse / Edit|Write|MultiEdit  (GLOBAL)
// After an edit to a JS/TS file, run ESLint on ONLY that file (fast, single-file) to catch the
// rules `tsc --noEmit` does NOT see (e.g. react/no-unescaped-entities, no-unused-vars with the
// project's config) BEFORE they fail a build/CI.
// Example: an apostrophe written raw in JSX passes tsc but fails `next build` on
// react/no-unescaped-entities — this hook reports it right after the edit.
//
// Generic: assumes no project structure. Walks up from the edited file's directory to the
// nearest `node_modules/eslint` and runs ESLint from there, so the project's own config
// (flat or legacy) is resolved.
//
// ESLint --quiet => only errors block (warnings ignored).
// exit 2 = shows the errors to the agent (the edit is already applied; it fixes them).
// Any internal error / no ESLint = exit 0 (never block real work, never break the session).
const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}

const filePath = (input.tool_input && input.tool_input.file_path) || '';
if (!filePath) process.exit(0);

const norm = filePath.replace(/\\/g, '/');

// Only lintable source files. Skip build output and dependencies.
if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(norm)) process.exit(0);
if (/\/(node_modules|\.next|dist|build|out|coverage|\.turbo)\//.test(norm)) process.exit(0);

// Walk up from the file's directory to node_modules/eslint/bin/eslint.js.
// The directory holding that node_modules becomes ESLint's cwd (so it picks up the config).
function findEslint(startDir) {
  let dir = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
    if (fs.existsSync(candidate)) return { eslintJs: candidate, cwd: dir };
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached the drive root
    dir = parent;
  }
}

let absFile;
try {
  absFile = fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
} catch (e) {
  absFile = path.resolve(filePath);
}

const found = findEslint(path.dirname(absFile));
if (!found) process.exit(0); // the project has no ESLint installed → block nothing

// Forward slashes: on Windows ESLint doesn't resolve backslash paths (it treats them as globs)
// and returns "no files matched" → the error would be swallowed silently.
const relFile = path.relative(found.cwd, absFile).replace(/\\/g, '/');

const res = spawnSync(
  process.execPath, // node
  [found.eslintJs, '--quiet', relFile],
  { cwd: found.cwd, encoding: 'utf8', timeout: 60000 }
);

// ESLint exit codes: 0 = clean, 1 = real errors (with --quiet), 2 = ESLint crashed / invalid config.
if (res.status === 1) {
  const out = ((res.stdout || '') + (res.stderr || '')).trim();
  process.stderr.write(
    'ESLint found errors in the file you just edited (these fail `lint` / the CI build):\n\n' +
    out + '\n\nFix them before calling the task done.'
  );
  process.exit(2);
}

process.exit(0); // clean, or ESLint itself failed → never block real work
