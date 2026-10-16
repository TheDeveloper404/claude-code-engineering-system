// SessionStart (global, any project)
// Why: CONTEXT.md is a convention, not a guarantee — it only helps if the agent remembers to open
// it. This hook doesn't rely on memory: at session start, if the current project has a CONTEXT.md,
// it points it out. It does NOT inject the content (that would defeat the purpose of CONTEXT.md,
// which is kept OUT of the default context).
// Example output: "This project has a CONTEXT.md (5.8 KB) at D:\work\shop\CONTEXT.md. ..."
const fs = require("fs");
const path = require("path");

try {
  const candidate = path.join(process.cwd(), "CONTEXT.md");
  const stat = fs.statSync(candidate);
  const kb = Math.round((stat.size / 1024) * 10) / 10;
  process.stdout.write(
    "<context-md-reminder>\n" +
    `This project has a CONTEXT.md (${kb} KB) at ${candidate}.\n` +
    "It is not loaded automatically. Read it once if the task touches domain/business/architecture " +
    "-- not needed for an isolated one-line fix.\n" +
    "</context-md-reminder>\n"
  );
} catch {
  // no CONTEXT.md in this project, or a read error -- don't block, don't report anything
}
process.exit(0);
