---
name: done
description: Use at the END of any implementation task — before declaring it finished, before writing the commit message, or when the user says "done", "gata", "unde e testul", "ready to commit". Runs the per-task Definition-of-Done gate from the global working mode — classification stated, test proportional to it (run now, not deferred), build/type-check if types moved, perf sanity, CHANGELOG, schema migration, suggested commit message — and ends with a PASS / GAPS verdict instead of a silent "done".
---

# Done?! — the task-closer gate

A task is not finished when the code works. It is finished when the closing steps of the
per-task SDLC flow have actually happened — not "later", not "in bulk". This skill exists
because the most repeated failure here is skipped closure: tests deferred until they rot,
`tsc` not run after a type change, CHANGELOG forgotten, a conscious skip never stated.

**Hard rule:** CHECK → ACT where allowed (run unit tests / `tsc` / build) → REPORT. Never
silently paper over a gap. An unmet item is reported, not hidden.

## When this applies
- Any NORMAL or CRITICAL task, right before you call it done.
- The user signals closure: "done", "gata", "ready to commit", "unde e testul".
- A feature/fix is implemented and you are about to write the delivery summary.

## When this does NOT apply
- SMALL task with clear scope where a test skip is an explicit, stated decision — run the
  30-second version (items 1, 3, 7) and move on.
- Pure discussion / research / review with no code change.

## The gate — walk every item, in order

1. **Classification stated.** SMALL / NORMAL / CRITICAL declared explicitly for this task?
   If not, state it now with one line of reasoning. Everything below scales to it.
   **Implemented within the defined scope** — nothing added that wasn't asked (no scope creep).

2. **Test, proportional — run it now, do not defer.**
   - SMALL → sanity check; a skipped new test is allowed but must be said out loud.
   - NORMAL → unit test for the new logic + at least one happy-path integration/e2e on the
     main flow.
   - CRITICAL → unit + integration + e2e + an adversarial pass (expired/stale session,
     concurrent actions, hostile client input, multiple tabs/devices, back-button after
     logout or delete).
   - **You run the unit tests / `tsc` now.** If the project has `HUMAN_RUNS_TESTS` /
     `block-tests`, you still run unit; tell the user exactly which e2e to run and where.
   - For an authorization/business-rule test: quote the domain rule verbatim in a comment
     above the test and derive actors/preconditions from that quote, not from memory.
   - "tsc/lint/vitest green" is NOT "verified" for interactive behaviour. If the change
     touches a multi-step UI flow, either exercise it with an e2e or say plainly:
     "statically verified, real interaction NOT tested — needs e2e or manual check".

3. **Build / type-check — unconditional if types moved.** Any edit touching types, schema,
   JSX, props, or imports → run `tsc --noEmit` now. For a Next.js frontend also run
   `lint` / `build` (tsc does not catch the ESLint rules that fail the deploy).

4. **Performance sanity.** New N+1, unbounded query, missing index, or a multi-MB dependency
   added without checking bundle impact? Mandatory pass on CRITICAL; quick self-check
   otherwise — not skipped silently.

5. **CHANGELOG updated** (+ the affected doc if an API/DB contract or schema changed).

6. **Schema migration** → produced and applied / handed off for ALL target environments per
   the project's DB rules (e.g. Neon: raw SQL for dev first, then prod). Never `db:push` or
   `db:migrate` from the terminal.

7. **Suggested commit message** left for the user. They commit from VS Code Source Control —
   give them the message text, not git commands. Never commit or push on your own initiative.

## Close-out

- Any item consciously skipped → say so explicitly, with the reason. A silent omission is
  the bug this skill prevents.
- Leave changes staged/ready; hand over the commit message.

## Verdict

End with one line, no essay:
- `PASS` — every applicable item met, or skipped with a stated, sound reason.
- `GAPS:` — one bullet per unmet item (`<item> — <what is missing>`), so the user can triage.
