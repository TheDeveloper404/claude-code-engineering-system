# Changelog

## 2026-10-16

### Changed
- Public rewrite: generic wording, English only, an example for every rule. `rules/working-style.md` rewritten
  as rule → why → example, with personal choices marked *(preference)*; `CLAUDE.md` gets an example per task
  level and per severity; `docs/incident-template.md` translated, with a filled-in example; dated stories
  replaced by neutral examples in `docs/review-flow.md`, `rules/test-authoring.md` and hook comments.
- Hook comments and the messages shown to the agent translated to English (`block-tests`, `context-md-reminder`,
  `instruction-size`, `lint-edited-file`, `review-checkpoint`, `scope-lock`, the PII template). No logic changed.
- README: an example for every hook; `settings.json` described as an example configuration.
- `settings.json`: `cleanupPeriodDays` 90 → 180 (keep transcripts six months).

## 2026-10-15

### Added
- `install.mjs`: this repository is now the single source of truth, installed into Claude Code and Codex
  (generated `AGENTS.md`, `agents/*.toml`, skills). Personal additions come from `<config>/personal/` and never
  live here. Nothing is deleted in a target; overwritten files are backed up first. Tests in `tests/`.
- `codex/` (AGENTS.md header, sandbox per agent), `personal.example/`, README.

### Changed
- Clean public version: no private data, client names or personal paths; hook paths are `<CLAUDE_DIR>`.
- `scope-lock.js`: memory/plans exemptions match any config dir (`.claude` or a relocated `claude`).
