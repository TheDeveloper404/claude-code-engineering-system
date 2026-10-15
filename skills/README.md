# Global Skills — Trigger Map

Self-contained skills that follow you into **every** project (config dir: `~/.claude`).
Each `SKILL.md` carries a condensed copy of its source rules so it does not depend on
the original rule documents. This repository is the single source of truth (installed with
`node install.mjs`).
Claude auto-loads a skill when the task matches its `description`; you can also invoke manually.

| Skill | Activates when you… | Condensed from |
|---|---|---|
| **secure-api-route** | create/edit a route, endpoint, controller, middleware, API handler, auth guard; touch RBAC / permissions / JWT / sessions | `Audit_checklist.md` 02–05 + `Backend.md` error contract |
| **security-audit** | do a full security review of a CRITICAL feature (auth, payments, permissions, sensitive data); ask for "security review" / threat model / verify a finding | `Audit_checklist.md` (13 cats) + `security-engineer.md` |
| **performance-review** | hit slow / optimize / N+1 / query / index / cache / bundle / Web Vitals / pagination / load test | `performance-engineer.md` |
| **clean-architecture** | structure a new feature, refactor, define an API contract, decide layering (Controller→Service→Repository), apply SOLID | `SW_PRINCIPLES.md` + `architect.md` |
| **ui-ux-review** | build/review UI — components, pages, forms, tables, modals, dashboards; edit `.tsx`/`.jsx` | `UI_UX_RULES.md` |
| **recover** | you're stuck / thrashing — "still failing", tried it N times, `loop-block-edits` blocked you, code runs but is wrong | classify failure BEFORE reacting (M1 bug / M2 polluted session / M3 wrong foundation) |
| **Done?!** (`/done`) | you're about to declare a task finished — "done", "gata", "unde e testul", "ready to commit" | per-task SDLC flow + Definition of Done from global `CLAUDE.md` |
| context7-mcp | ask about a library/framework/API — fetch current docs | (MCP wrapper) |

Each skill ends with a short **verdict** (`PASS` / `FINDINGS`), not an essay, to keep context lean.
Task classification (SMALL / NORMAL / CRITICAL) stays in `CLAUDE.md`; `/classify` is the manual trigger.

## Companion enforcement (deterministic, not skill-based)

**Global hooks** (`..\hooks\*.ps1`, wired in `..\settings.json` → `hooks.PreToolUse`):

| Hook | Event | Action |
|---|---|---|
| `scan-secrets.ps1` | Bash | block `git commit` when staged diff contains a hardcoded secret |
| `block-push-main.ps1` | Bash | block direct `git push` to main/master |
| `block-dangerous-cmd.ps1` | Bash | block irreversible commands (rm -rf /, git reset --hard, drop database, fork bomb, …) |
| `warn-insecure-patterns.ps1` | Edit/Write/MultiEdit | ask to confirm on wildcard CORS, token in localStorage, eval(), dangerouslySetInnerHTML, weak hashes |

**Global subagents** (`..\agents\*.md`): architect, code-reviewer, devops-engineer,
performance-engineer, qa-tester, security-engineer.
