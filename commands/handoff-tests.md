---
description: Toggle test-running mode. Creates .claude/HUMAN_RUNS_TESTS (human runs tests)
  or removes it (Claude may run tests). Reports the new state in one line.
allowed-tools: Bash
---

Check whether `.claude/HUMAN_RUNS_TESTS` exists in the project root.

- If it does **NOT** exist:
  Run: `touch "$CLAUDE_PROJECT_DIR/.claude/HUMAN_RUNS_TESTS"`
  Report: "Test handoff: HUMAN RUNS TESTS — block-tests.sh will intercept Claude test commands."

- If it **DOES** exist:
  Run: `rm "$CLAUDE_PROJECT_DIR/.claude/HUMAN_RUNS_TESTS"`
  Report: "Test handoff: CLAUDE MAY RUN TESTS — block-tests.sh will not intercept."

Do not explain further — one line report is the entire output.
