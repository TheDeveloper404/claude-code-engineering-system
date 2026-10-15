// PostToolUse / Edit|Write|MultiEdit  (GLOBAL)
// După editarea unui fișier JS/TS, rulează ESLint pe DOAR acel fișier (rapid, single-file)
// ca să prindă regulile pe care `tsc --noEmit` NU le vede (ex. react/no-unescaped-entities,
// no-unused-vars cu config-ul proiectului) ÎNAINTE să pice un build/CI (ex. Vercel).
//
// Generic: nu presupune nicio structură de proiect. Urcă din directorul fișierului editat
// până găsește cel mai apropiat `node_modules/eslint` și rulează ESLint din acel director,
// ca să se rezolve corect config-ul (flat sau legacy) al proiectului respectiv.
//
// ESLint --quiet => doar erorile blochează (warnings ignorate).
// exit 2 = arată erorile lui Claude (editarea e deja aplicată, le repară).
// Orice eroare internă / lipsă ESLint = exit 0 (NU blocăm munca reală, nu spargem sesiunea).
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

// Doar fișiere sursă lintabile. Sărim peste artefacte/dependențe.
if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(norm)) process.exit(0);
if (/\/(node_modules|\.next|dist|build|out|coverage|\.turbo)\//.test(norm)) process.exit(0);

// Urcă din directorul fișierului până găsești node_modules/eslint/bin/eslint.js.
// Directorul care conține acel node_modules devine cwd-ul ESLint (ca să prindă config-ul).
function findEslint(startDir) {
  let dir = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
    if (fs.existsSync(candidate)) return { eslintJs: candidate, cwd: dir };
    const parent = path.dirname(dir);
    if (parent === dir) return null; // am ajuns la rădăcina discului
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
if (!found) process.exit(0); // proiectul n-are ESLint instalat → nu blocăm nimic

// Forward slashes: pe Windows ESLint nu rezolvă căi cu backslash (le tratează ca glob)
// și întoarce "no files matched" → eroarea ar fi înghițită silențios.
const relFile = path.relative(found.cwd, absFile).replace(/\\/g, '/');

const res = spawnSync(
  process.execPath, // node
  [found.eslintJs, '--quiet', relFile],
  { cwd: found.cwd, encoding: 'utf8', timeout: 60000 }
);

// ESLint exit codes: 0 = clean, 1 = erori reale (cu --quiet), 2 = ESLint a crăpat / config invalid.
if (res.status === 1) {
  const out = ((res.stdout || '') + (res.stderr || '')).trim();
  process.stderr.write(
    'ESLint a găsit erori în fișierul pe care tocmai l-ai editat (astea pică `lint` / build-ul CI):\n\n' +
    out + '\n\nRepară-le înainte de a considera gata.'
  );
  process.exit(2);
}

process.exit(0); // clean, sau ESLint însuși a eșuat → niciodată nu blocăm munca reală
