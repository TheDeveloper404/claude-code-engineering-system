# Review/audit flow — full procedure (read before ANY review or audit)

> `CLAUDE.md` keeps a short summary and points here (kept separate so `CLAUDE.md` stays under 200
> lines). Read this file before running `/code-review`, `security-audit`, or a reviewer subagent
> (`code-reviewer`, `security-engineer`).

## Review/audit flow (mandatory — same status as the SDLC flow)
> Why: a review that fixes as it goes takes the decision away from the user. Example: an agent runs
> six incremental `/code-review` rounds on a feature still being written, and in each round it reports
> findings and applies its own fixes in the same message. The user never gets to triage; the result is
> six rounds instead of two, patched-up code, and every finding described as a major breach.
> A review PRODUCES A LIST; it does not silently fix.

**When to review:** on a large feature, ONE `/code-review` at high effort over the COMPLETE diff — never
incremental passes over code still being written. A mechanical counter (`review-checkpoint` hook) does not
dictate the timing of a feature's real review; it is a floor, not a trigger to interrupt work in progress.

**Model diversity on review:** where practical, run step 1 (Review) and step 5 (Confirm) on a different
model than the one that implemented the change — a model reviewing its own output shares its own blind
spots. Pass a `model` override to the `code-reviewer`/`security-engineer` subagent, or switch the active
model before running `/code-review`.

**The five steps, in order — never collapsed into one:**
1. **Review** — run it, and do NOT edit any file during this step.
2. **List** — report every finding with: file:line, one-sentence defect, concrete failure scenario, and a
   severity from the scale below. No fixes applied yet.
3. **Triage** — for each finding recommend `BLOCKING` (must fix before merge) or `BACKLOG` (real but not
   worth it now), with a one-line reason. **The user decides.** Do not decide the split alone, and do not
   present the list and the fixes in the same message as a fait accompli.
4. **Fix** — apply only what was agreed, each with its proportional test, in one batch.
5. **Confirm** — ONE re-review over the fixes (fix code is itself unreviewed code). Stop when a round finds
   nothing new; do not chain further rounds hunting for more.

**Severity scale — calibrate ONCE, correctly, in the first sentence.** Over-dramatising a minor issue and
minimising a real one are equally wrong.
- **CRITICAL** — exploitable now, no special position needed: auth bypass, privilege escalation, secret
  leak, data loss/corruption in normal use. Blocks merge, no discussion.
- **HIGH** — real damage but needs a precondition (a specific role, a guessed ID, an unusual sequence), or
  silent data/file leakage that accumulates. Blocks merge by default.
- **MEDIUM** — wrong behaviour with limited blast radius: a public counter revealing private volume, a
  missing rate limit, a stale cache. Fix now if cheap; otherwise backlog with a date.
- **LOW** — correctness-neutral: extra round-trips, duplicated logic, an inaccurate comment, cosmetic
  inconsistency. Default is BACKLOG. Say so plainly instead of dressing it up.
- **Language rule:** state the actual worst case in concrete terms ("a removed member keeps receiving
  emails with the title of a detail they can no longer open"), never an abstract threat inflation
  ("critical confidentiality breach"). If you cannot name a concrete victim and a concrete loss, it is not
  CRITICAL or HIGH — say so.

**Applies to `security-audit` too:** the 13-category audit ends in a triaged list + verdict, then fixes —
same five steps, same severity scale.
