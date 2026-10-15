// Sentinel for /classify: `node scope-set.js SMALL|NORMAL|CRITICAL`.
// The real work happens in scope-lock.js (PreToolUse Bash), which sees this command together with
// the session_id and records the level. This script only echoes, so the call is visible in the transcript.
const level = (process.argv[2] || '').toUpperCase();
if (!['SMALL', 'NORMAL', 'CRITICAL'].includes(level)) {
  console.error('Usage: node scope-set.js SMALL|NORMAL|CRITICAL');
  process.exit(1);
}
console.log(`Classification recorded: ${level}` +
  (level === 'SMALL' ? ' — implement directly.' : ' — enter Plan Mode; edits unlock after the plan is approved.'));
