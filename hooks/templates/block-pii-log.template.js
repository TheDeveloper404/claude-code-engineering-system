// ============================================================================
// TEMPLATE — NOT active globally. Copy it into `.claude/hooks/` of a project that
// processes personal data (PII) and ADAPT the two regexes + the path.
//
// Register it in the project's `.claude/settings.json`:
//   "PreToolUse": [
//     { "matcher": "Edit|Write|MultiEdit",
//       "hooks": [{ "type": "command", "command": "node .claude/hooks/block-pii-log.js" }] }
//   ]
//
// What it does: blocks (exit 2) new log calls that contain PII variables. Log ONLY metadata
// ({ err, status, mime, count, userId.slice(0,8) }), never content.
// Example: `logger.info({ messageText })` is blocked; `logger.info({ status, count })` passes.
//
// WHAT TO ADAPT PER PROJECT:
//   1. The watched source path → `SRC_PATH` below (e.g. /apps/api/src/, /src/).
//   2. The `RISKY` regex       → the names of the PII variables/fields in your project.
//      (The example below is for a chat-message bot: message text + images.)
// ============================================================================
const fs = require('fs');

let input;
try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (e) { process.exit(0); }

const ti = input.tool_input || {};

// Collect all new text (Edit: new_string · Write: content · MultiEdit: edits[].new_string)
const chunks = [];
if (typeof ti.new_string === 'string') chunks.push(ti.new_string);
if (typeof ti.content === 'string') chunks.push(ti.content);
if (Array.isArray(ti.edits)) for (const e of ti.edits) if (e && typeof e.new_string === 'string') chunks.push(e.new_string);

const text = chunks.join('\n');
if (!text) process.exit(0);

const fp = (ti.file_path || '').replace(/\\/g, '/');

// (1) ADAPT: only the source files where PII flows.
const SRC_PATH = /\/apps\/api\/src\//;
if (fp && !SRC_PATH.test(fp)) process.exit(0);
if (/\.(test|spec)\.[tj]sx?$/.test(fp)) process.exit(0);

const LOG = /(console|logger|req\.log|fastify\.log|app\.log|this\.log)\.(log|info|debug|warn|error|trace|fatal)\s*\(/i;

// (2) ADAPT: the names of the PII variables/fields in your project.
const RISKY = /(imageBase64|base64Image|imageData|imageBuffer|visionImage|messageText|msgText|\.conversation\b|\.caption\b|extendedTextMessage|messageContent|rawMessage|req\.body|request\.body|pushName)/i;

const hits = [];
for (const line of text.split('\n')) {
  if (LOG.test(line) && RISKY.test(line)) hits.push(line.trim());
}

if (hits.length) {
  process.stderr.write(
    'BLOCKED — possible PII in a log call (message/image content is NEVER logged):\n\n' +
    hits.map(h => '  ' + h).join('\n') +
    '\n\nLog ONLY metadata ({ err, status, mime, count, userId.slice(0,8) }), not the content.\n' +
    'If this is a deliberate false positive, remove the variable from the log call or adjust the hook.'
  );
  process.exit(2);
}

process.exit(0);
