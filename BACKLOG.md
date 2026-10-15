# Backlog

## Next
- [ ] **Less text.** ~640 always-loaded lines for Claude, 402 in the generated Codex `AGENTS.md`. Keep the rules,
      move the incident stories to a `docs/lessons.md` that is not auto-loaded, remove duplicates between
      `CLAUDE.md` and `rules/working-style.md`. Target: under 250 lines.
- [ ] **Hook tests run by themselves**: a GitHub Actions workflow on push, and `install.mjs` refuses to install
      when tests fail.
- [ ] **Measure the rules**: each hook appends one line to a local log (time, hook, decision, project); the weekly
      report counts classifications, blocks per hook, reviews and test runs.
- [ ] Skills reference rule documents that are not in this repository (`Audit_checklist.md`, `SW_PRINCIPLES.md`,
      `UI_UX_RULES.md`, `Backend.md`): bring the content in, or drop the references.
