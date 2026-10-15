// PreToolUse / Bash
// Creates a git safety snapshot before every Bash call (not just test runs).
// Uses git stash create (no working tree modification, no history pollution).
// Restore: git stash apply $(git rev-parse refs/cc-checkpoints/last)
// Never blocks — checkpoint failure is silently ignored.
const fs            = require('fs');
const { execSync }  = require('child_process');

try { fs.readFileSync(0, 'utf8'); } catch (e) {} // consume stdin

try {
  const sha = execSync('git stash create', { encoding: 'utf8' }).trim();
  if (sha) {
    execSync(`git update-ref refs/cc-checkpoints/last ${sha}`);
  }
} catch (e) {
  // never block on checkpoint failure
}

process.exit(0);