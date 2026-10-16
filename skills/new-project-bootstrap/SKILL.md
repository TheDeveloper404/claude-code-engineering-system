---
name: new-project-bootstrap
description: Use when starting a brand-new project from scratch — before the first feature, on or around the first commit, when scaffolding a repo, or when the user says "new project" / "let's start something from scratch". Sets up the same day-0 scaffolding every real project here ends up needing anyway (CI, docs, branching, backlog) instead of bolting it on later, one incident at a time.
---

# New Project — Day 0 Playbook

Distilled from what several real projects (a SaaS app and two public websites) actually ended up
building (mostly after the fact). The point of this skill is to do it on day 0 instead of after
the first incident. Adapt rigor to the project's real complexity — a small static site does NOT
need a full e2e+db-backup setup; state explicitly which parts you're skipping and why,
rather than skipping silently.

## 1. Definition of Ready, before any code
Goal stated · acceptance criteria · scope bounded (what's explicitly OUT) · dependencies known ·
edge cases considered · if this project touches auth/payments/PII from day 1, say so now — security
posture is a day-0 decision, not something bolted on later.

## 2. Architecture pass (only if warranted)
If the project has real structural decisions ahead (multiple layers, a DB, auth, an API surface),
invoke the `architect` agent for an initial design/ADR before scaffolding. Skip this for a small
static site — don't impose enterprise layering where it isn't needed.

## 3. Branching model — decide and state it
Two proven options already in use here, pick one explicitly, don't default silently:
- **dev → PR → main** (the larger app's model): meaningful review cadence, CI gates every merge.
- **Direct to main** (a small site's explicit choice): smaller/solo-maintained project, deploy is
  simple enough that a PR step adds friction without adding safety.

## 4. CI from day 1 — minimum bar for EVERY project, regardless of size
- Secret scan (gitleaks) on push/PR — cheap, universal, no reason to ever skip it.
- Lint + test + build gate on push/PR to the main branches.
- Dependency vulnerability coverage — Dependabot config (`.github/dependabot.yml`) is enough; a
  blocking `npm audit` CI step is optional on top.
- Add only if complexity justifies it (larger-app tier, not default): CodeQL, a real e2e workflow,
  scheduled DB backups.

## 5. Docs scaffold, empty is fine — just have the file
- `docs/DEPLOY.md` — how to deploy, and the rollback steps (shape: promote
  last-good deployment first, THEN investigate; note DB migrations don't auto-rollback with code).
- `docs/INCIDENTS.md` — empty log from day 0, the format in `docs/incident-template.md` (date / what happened / verified
  cause / impact / fix), so the global incident rule has somewhere to write to on day 1 of a
  real incident instead of nowhere.
- `CHANGELOG.md`.
- `BACKLOG.md` if this project will be actively iterated on (skip for a "set and forget" site).

## 6. Project CLAUDE.md — write one, even if it's short
A short, explicit "this is intentionally minimal, no e2e, rarely touched" is a valid CLAUDE.md.
An absent one is not the same thing — it reads as an oversight, not a decision (this exact
confusion has happened in practice).

## 7. Test-running split
Decide whether `.claude/HUMAN_RUNS_TESTS` applies (only relevant once real e2e exists). Note it
in the project's CLAUDE.md so it's a stated choice, not silently absent.

## 8. Performance posture — one line, stated up front
Does this project have a reason to care (SEO-facing public site, high traffic) or not (internal
tool, low traffic)? State it once — it decides whether `performance-review` should be proactive
for this specific project or purely reactive like the default.

## Close
Say explicitly what was set up and what was deliberately skipped (and why) — a new project is the
one moment all of this is cheap to decide; bolting it on later is how the gaps in earlier projects
happened in the first place.
