# Claude Code Engineering System

A personal operating system for [Claude Code](https://code.claude.com): process rules, hooks, skills and
subagents that make Claude work like a senior engineer instead of a chat assistant — classify the task first,
implement only what was asked, test in proportion to the risk, review before "done".

## What's inside

| Path | What it is |
|---|---|
| `CLAUDE.md` | Global working mode: task classification (SMALL / NORMAL / CRITICAL), strict scope rule, Definition of Ready, quality gates, per-task SDLC flow, review flow, delivery format. |
| `rules/` | Path-scoped rules: collaboration style, test authoring, when to check library docs (context7) before guessing. |
| `docs/` | The full review/audit procedure and the incident log template. |
| `agents/` | Subagents: architect, code-reviewer, security-engineer (veto on CRITICAL work), qa-tester, performance-engineer, devops-engineer, researcher. |
| `skills/` | Skills that auto-activate by task: secure-api-route, security-audit, clean-architecture, performance-review, ui-ux-review, recover, done, new-project-bootstrap, context7-mcp. See `skills/README.md`. |
| `commands/` | Slash commands: `/classify`, `/handoff-tests`, `/loop-reset`. |
| `hooks/` | Guard rails enforced by the harness, not by good intentions (below), with tests in `hooks/tests/`. |
| `settings.json` | Settings template wiring the hooks and permissions (`<CLAUDE_DIR>` is filled in by the installer). |
| `codex/` | What Codex needs on top: the `AGENTS.md` header and the sandbox mode of each agent. |
| `install.mjs` | Installs everything into Claude Code and Codex (below), tested in `tests/`. |
| `personal.example/` | Empty templates for your private additions. |

## Hooks

| Hook | When | What it does |
|---|---|---|
| `scope-lock.js` + `scope-set.js` | before edits | Blocks edits until the task is classified; NORMAL/CRITICAL also need an approved plan. |
| `loop-count.js` + `loop-block-edits.js` | after shell / before edits | Stops "try another variant" loops: too many shell calls without a test, or repeated failed test cycles, force a root-cause stop. |
| `review-checkpoint.js` | edits / prompts | Reminds to run a code review after a large batch of changes. |
| `block-push-main.ps1` | shell | Blocks pushing directly to `main`. |
| `block-dangerous-cmd.ps1` | shell | Blocks destructive commands (recursive deletes of drive roots, etc.). |
| `scan-secrets.ps1` | shell | Blocks `git commit` when the staged diff contains hardcoded secrets. |
| `block-tests.js` | shell | When a project has `.claude/HUMAN_RUNS_TESTS`, unit tests run, e2e is left to the human. |
| `block-readonly-paths.js` | edits | Hard block on edits to read-only source-of-truth paths (configure `READONLY`). |
| `warn-insecure-patterns.ps1` | edits | Asks for confirmation before writing insecure code patterns. |
| `lint-edited-file.js` | after edits | Runs ESLint on just the edited JS/TS file, catching what `tsc` misses before CI does. |
| `instruction-size.js` | after edits | Warns when an instruction file grows past 200 lines. |
| `context-md-reminder.js` | session start | Reminds that the project has a `CONTEXT.md` to read when relevant. |
| `checkpoint.js` | shell | Git safety snapshot (`git stash create`) before every shell call; never blocks. |
| `templates/block-pii-log.template.js` | — | Template for blocking personal data in logs. |

## Install

This repository is the single source of truth. Change rules here, then run:

```
node install.mjs --dry-run   # list what would change
node install.mjs             # install
```

- **Claude Code** — into `$CLAUDE_CONFIG_DIR` (else `~/.claude`): `CLAUDE.md`, `rules/`, `docs/`, `agents/`,
  `commands/`, `hooks/`, `skills/`, and `settings.json` (this repo's `settings.json` merged with your personal one).
- **Codex** — into `$CODEX_HOME` (else `~/.codex`): a generated `AGENTS.md` (`codex/AGENTS.header.md` + `CLAUDE.md` +
  `rules/`), `docs/`, and `agents/*.toml` (sandbox per agent in `codex/agents.json`); skills into `~/.agents/skills`.
- Nothing in a target is ever deleted; every overwritten file is first copied to `<config>/backups/install-<time>/`.

**Personal, private additions** never live in this repository. Put them in `<config>/personal/` (start from
`personal.example/`):

| File | Added to |
|---|---|
| `CLAUDE.personal.md` | the end of the installed `CLAUDE.md` |
| `AGENTS.personal.md` | the end of the generated Codex `AGENTS.md` |
| `settings.personal.json` | merged into `settings.json`: your values win, permission lists are joined, your hooks run after the system's |

Also set `READONLY` in `hooks/block-readonly-paths.js` if you have read-only paths to protect.

Tests: `node --test tests/install.test.mjs hooks/tests/scope-lock.test.js hooks/tests/loop-count.test.js`.

The PowerShell hooks target Windows; the Node hooks and the installer are cross-platform.

## Principles

> Build like a senior engineer. Adapt like a startup. Do what is necessary — no more, no less.

- Classify before working; rigor follows risk.
- Implement only what was asked; anything else is listed, not written.
- Don't guess: reproduce, read the real error, then fix.
- A test is part of the task, not a later phase.
- A review produces a list; the human decides what gets fixed.
