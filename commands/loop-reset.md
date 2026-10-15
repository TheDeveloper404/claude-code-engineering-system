---
description: Reset the loop-guard counter to 0. Use after completing a root-cause audit
  when loop-block-edits.sh has blocked further edits due to 3+ consecutive failed test cycles.
allowed-tools: Bash
---

Run: `echo 0 > "$CLAUDE_PROJECT_DIR/.claude/.loop-state"`

Then confirm: "Loop guard reset. Counter is now 0. Edits are unblocked."

Do not proceed with any implementation until the root-cause audit that prompted the loop block
has been completed and documented.
