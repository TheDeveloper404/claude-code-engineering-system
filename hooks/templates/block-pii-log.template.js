// ============================================================================
// TEMPLATE — NU e activ global. Copiază-l în `.claude/hooks/` al unui proiect
// care procesează date personale (PII) și ADAPTEAZĂ cele două regex-uri + calea.
//
// Înregistrare în `.claude/settings.json` al proiectului:
//   "PreToolUse": [
//     { "matcher": "Edit|Write|MultiEdit",
//       "hooks": [{ "type": "command", "command": "node .claude/hooks/block-pii-log.js" }] }
//   ]
//
// Ce face: blochează (exit 2) introducerea de apeluri de log care conțin variabile
// cu PII. Logăm DOAR metadate ({ err, status, mime, count, userId.slice(0,8) }), nu conținut.
//
// CE TREBUIE SĂ ADAPTEZI PER PROIECT:
//   1. Calea sursă monitorizată  → vezi `SRC_PATH` mai jos (ex. /apps/api/src/, /src/).
//   2. `RISKY` regex             → numele variabilelor/câmpurilor cu PII din proiectul tău.
//      (Exemplul de mai jos e dintr-un proiect WhatsApp: mesaje + imagini vision.)
// ============================================================================
const fs = require('fs');

let input;
try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (e) { process.exit(0); }

const ti = input.tool_input || {};

// Adună tot textul nou (Edit: new_string · Write: content · MultiEdit: edits[].new_string)
const chunks = [];
if (typeof ti.new_string === 'string') chunks.push(ti.new_string);
if (typeof ti.content === 'string') chunks.push(ti.content);
if (Array.isArray(ti.edits)) for (const e of ti.edits) if (e && typeof e.new_string === 'string') chunks.push(e.new_string);

const text = chunks.join('\n');
if (!text) process.exit(0);

const fp = (ti.file_path || '').replace(/\\/g, '/');

// (1) ADAPTĂ: doar fișierele sursă unde curge PII-ul.
const SRC_PATH = /\/apps\/api\/src\//;
if (fp && !SRC_PATH.test(fp)) process.exit(0);
if (/\.(test|spec)\.[tj]sx?$/.test(fp)) process.exit(0);

const LOG = /(console|logger|req\.log|fastify\.log|app\.log|this\.log)\.(log|info|debug|warn|error|trace|fatal)\s*\(/i;

// (2) ADAPTĂ: numele variabilelor/câmpurilor cu PII din proiectul tău.
const RISKY = /(imageBase64|base64Image|imageData|imageBuffer|visionImage|messageText|msgText|\.conversation\b|\.caption\b|extendedTextMessage|messageContent|rawMessage|req\.body|request\.body|pushName)/i;

const hits = [];
for (const line of text.split('\n')) {
  if (LOG.test(line) && RISKY.test(line)) hits.push(line.trim());
}

if (hits.length) {
  process.stderr.write(
    'BLOCAT — posibil PII în log (conținutul mesajelor/imaginilor NU se loghează):\n\n' +
    hits.map(h => '  ' + h).join('\n') +
    '\n\nLoghează DOAR metadate ({ err, status, mime, count, userId.slice(0,8) }), nu conținutul.\n' +
    'Dacă e fals-pozitiv intenționat, scoate variabila din apelul de log sau ajustează hook-ul.'
  );
  process.exit(2);
}

process.exit(0);
