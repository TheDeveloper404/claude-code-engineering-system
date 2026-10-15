# Changelog

## 2026-10-15

### Added
- `install.mjs`: this repository is now the single source of truth, installed into Claude Code and Codex
  (generated `AGENTS.md`, `agents/*.toml`, skills). Personal additions come from `<config>/personal/` and never
  live here. Nothing is deleted in a target; overwritten files are backed up first. Tests in `tests/`.
- `codex/` (AGENTS.md header, sandbox per agent), `personal.example/`, README.

### Changed
- Clean public version: no private data, client names or personal paths; hook paths are `<CLAUDE_DIR>`.
- `scope-lock.js`: memory/plans exemptions match any config dir (`.claude` or a relocated `claude`).
