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

| Hook | When | What it does | Example |
|---|---|---|---|
| `scope-lock.js` + `scope-set.js` | before edits | Blocks edits until the task is classified; NORMAL/CRITICAL also need an approved plan. | You ask for a new button colour → the first edit is blocked until the agent states "SMALL". You ask for a password-reset flow → edits wait for an approved plan. |
| `loop-count.js` + `loop-block-edits.js` | after shell / before edits | Stops "try another variant" loops: too many shell calls without a test, or repeated failed test cycles, force a root-cause stop. | The same failing test is "fixed" three times in a row → edits are blocked until the agent explains the root cause. |
| `review-checkpoint.js` | edits / prompts | Reminds to run a code review after a large batch of changes. | After 20 edits in `app/` with no `/code-review`, the next edit asks for a review first. |
| `block-push-main.ps1` | shell | Blocks pushing directly to `main`. | A push straight to `main` is refused; push a branch and open a pull request. |
| `block-dangerous-cmd.ps1` | shell | Blocks destructive commands (recursive deletes of drive roots, etc.). | A recursive delete of a drive root never runs. |
| `scan-secrets.ps1` | shell | Blocks `git commit` when the staged diff contains hardcoded secrets. | A staged line `api_key = "live_abc123..."` stops the commit; move it to an environment variable. |
| `block-tests.js` | shell | When a project has `.claude/HUMAN_RUNS_TESTS`, unit tests run, e2e is left to the human. | `npx vitest run` runs; `npx playwright test` is blocked and the agent tells you which spec to run. |
| `block-readonly-paths.js` | edits | Hard block on edits to read-only source-of-truth paths (configure `READONLY`). | With `READONLY` set to a shared rules folder, any edit inside it is refused. |
| `warn-insecure-patterns.ps1` | edits | Asks for confirmation before writing insecure code patterns. | Writing a token into `localStorage` or a wildcard CORS header asks you first. |
| `lint-edited-file.js` | after edits | Runs ESLint on just the edited JS/TS file, catching what `tsc` misses before CI does. | A raw apostrophe in JSX passes `tsc` but is reported right away instead of failing the build later. |
| `instruction-size.js` | after edits | Warns when an instruction file grows past 200 lines. | `CLAUDE.md` reaches 230 lines → a warning suggests moving one area's rules into `rules/`. |
| `context-md-reminder.js` | session start | Reminds that the project has a `CONTEXT.md` to read when relevant. | A session opens in a project with `CONTEXT.md` → one line points to it, without loading it. |
| `checkpoint.js` | shell | Git safety snapshot (`git stash create`) before every shell call; never blocks. | A bad command wipes local changes → they can be recovered from the snapshot. |
| `templates/block-pii-log.template.js` | — | Template for blocking personal data in logs (copy into a project and adapt). | `logger.info({ messageText })` is blocked; `logger.info({ status, count })` passes. |

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

`settings.json` is an **example configuration**: the plugin list, theme and other preferences in it are one
setup, not requirements. Override any of them in `settings.personal.json`. The same goes for the
*(preference)* sections of `rules/working-style.md` (who commits, which branching model): edit them to match
how you work.

Tests: `node --test tests/install.test.mjs hooks/tests/scope-lock.test.js hooks/tests/loop-count.test.js`.

The PowerShell hooks target Windows; the Node hooks and the installer are cross-platform.

## Principles

> Build like a senior engineer. Adapt like a startup. Do what is necessary — no more, no less.

- Classify before working; rigor follows risk.
- Implement only what was asked; anything else is listed, not written.
- Don't guess: reproduce, read the real error, then fix.
- A test is part of the task, not a later phase.
- A review produces a list; the human decides what gets fixed.
