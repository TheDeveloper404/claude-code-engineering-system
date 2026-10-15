// PostToolUse / Edit|Write|MultiEdit (Claude Code) + apply_patch (Codex)  (GLOBAL)
// După editarea unui fișier de instrucțiuni încărcat mereu (CLAUDE.md, AGENTS.md, rules/*.md
// fără `paths:`), avertizează dacă a trecut de 200 de rânduri. Doar avertisment (exit 0).
//
// Claude Code dă un singur tool_input.file_path; Codex apply_patch dă un blob V4A în
// tool_input.command, cu posibil mai multe fișiere ("*** Add File:" / "*** Update File:").
// Avertismentul merge ca additionalContext (Codex nu suportă `ask`, doar additionalContext/deny).
// Orice eroare internă = exit 0 (nu stricăm sesiunea).
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
    // rules/*.md cu `paths:` în frontmatter se încarcă la cerere, nu le verificăm
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
    if (lines > MAX_LINES) over.push(`${abs} (${lines} rânduri)`);
  } catch (e) { /* ignorăm */ }
}

if (over.length === 0) process.exit(0);

const msg =
  `Fișier de instrucțiuni peste ${MAX_LINES} de rânduri: ${over.join('; ')}. ` +
  `Un fișier lung e respectat mai slab — mută secțiunile de o singură zonă în rules/ sau CONTEXT.md.`;
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg },
}));
process.exit(0);
