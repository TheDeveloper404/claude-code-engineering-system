// PostToolUse / Edit|Write|MultiEdit (Claude Code) + apply_patch (Codex)  (GLOBAL)
// After an edit to an always-loaded instruction file (CLAUDE.md, AGENTS.md, rules/*.md without
// `paths:`), warn if it went past 200 lines. Warning only (exit 0).
// Why: a long instruction file is followed less reliably; e.g. a 350-line CLAUDE.md where the rule
// on line 300 keeps getting ignored. Move single-area sections to rules/ or CONTEXT.md.
//
// Claude Code gives a single tool_input.file_path; Codex apply_patch gives a V4A blob in
// tool_input.command, possibly with several files ("*** Add File:" / "*** Update File:").
// The warning goes out as additionalContext (Codex doesn't support `ask`, only additionalContext/deny).
// Any internal error = exit 0 (never break the session).
const fs = require('fs');
const path = require('path');

const MAX_LINES = 200;

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}

const ti = input.tool_input || {};
const files = [];
if (ti.file_path) files.push(ti.file_path);
if (ti.command) {
  const re = /^\*\*\* (?:Add File|Update File): (.+)$/gm;
  let m;
  while ((m = re.exec(ti.command))) files.push(m[1].trim());
}

function isAlwaysLoaded(file, text) {
  const norm = file.replace(/\\/g, '/');
  const base = path.basename(norm);
  if (base === 'CLAUDE.md' || base === 'AGENTS.md') return true;
  if (/\/rules\/[^/]+\.md$/.test(norm)) {
    // rules/*.md with `paths:` in the frontmatter load on demand, so they are not checked
    if (!text.startsWith('---')) return true;
    const end = text.indexOf('\n---', 3);
    return !(end !== -1 && /^paths\s*:/m.test(text.slice(0, end)));
  }
  return false;
}

const over = [];
for (const f of files) {
  try {
    const abs = path.isAbsolute(f) ? f : path.resolve(input.cwd || process.cwd(), f);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    if (!isAlwaysLoaded(abs, text)) continue;
    const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    if (lines > MAX_LINES) over.push(`${abs} (${lines} lines)`);
  } catch (e) { /* ignore */ }
}

if (over.length === 0) process.exit(0);

const msg =
  `Instruction file over ${MAX_LINES} lines: ${over.join('; ')}. ` +
  `A long file is followed less reliably — move single-area sections to rules/ or CONTEXT.md.`;
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg },
}));
process.exit(0);
