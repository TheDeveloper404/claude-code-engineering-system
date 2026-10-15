// PreToolUse / Edit|Write|MultiEdit  (GLOBAL)
// Hard block on edits to READ-ONLY source-of-truth paths, in any project.
// Your rules repo (READONLY below) holds the engineering rules and must never be modified by Claude.
// exit 2 = block (only exit 2 blocks; stderr is shown to Claude). Any error = exit 0 (never break work).
const fs = require('fs');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0); // defensive: allow on parse error, never block real work
}

const filePath = (input.tool_input && input.tool_input.file_path) || '';
if (!filePath) process.exit(0);

// Normalize: forward slashes, lowercase (Windows is case-insensitive).
const norm = filePath.replace(/\\/g, '/').toLowerCase();

// Read-only roots. Add more here if other dirs become source-of-truth.
const READONLY = ['<absolute/path/to/your/read-only-rules-repo>'];

for (const root of READONLY) {
  if (norm === root || norm.startsWith(root + '/')) {
    process.stderr.write(
      `BLOCKED: "${filePath}" is READ-ONLY (source of truth, per user rules).\n` +
      'Claude must NOT modify the read-only rules repo. Read it, mirror the rule into the\n' +
      'project (CLAUDE.md / docs), but never edit the source. If a rule is wrong, tell the user.'
    );
    process.exit(2);
  }
}

process.exit(0);
