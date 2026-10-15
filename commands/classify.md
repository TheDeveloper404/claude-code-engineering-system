---
description: Force the SMALL / NORMAL / CRITICAL task classification step per global CLAUDE.md
  Step 0, record it for the scope-lock hook, and route NORMAL/CRITICAL into Plan Mode.
allowed-tools: Read, Bash(node *scope-set.js*), EnterPlanMode
---

Read the "Step 0 — Classify FIRST" section of the global `CLAUDE.md`
(`~/.claude/CLAUDE.md`) and, if the current project has its own
`CLAUDE.md` / `AGENTS.md`, that too. Then, for the task currently described in the
conversation:

Answer these three questions explicitly:
1. How complex is this task?
2. What is the risk if this goes wrong?
3. How many parts of the system does this touch?

Then state ONE classification: **SMALL**, **NORMAL**, or **CRITICAL** — with a one-sentence
justification for each of the three questions above. When in doubt between two levels, go with
the higher one.

Then record it (the scope-lock hook reads this command; edits stay blocked until it runs):
`node "~/.claude/hooks/scope-set.js" <LEVEL>`

Then route:
- **SMALL** → implement directly.
- **NORMAL / CRITICAL** → call `EnterPlanMode`, write the plan (numbered steps, what is OUT of
  scope, relevant skills/agents — e.g. `security-audit` for CRITICAL, `clean-architecture` for
  NORMAL spanning layers). Edits unlock only after the user approves the plan. Implement ONLY what
  the approved plan contains (CLAUDE.md "Scope — rule #1").
