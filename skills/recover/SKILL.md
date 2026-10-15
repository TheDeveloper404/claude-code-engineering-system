---
name: recover
description: Use when you are stuck or things keep breaking — "it doesn't work", "still failing", "I tried X times", repeated fixes that don't stick, a hook (loop-block-edits) has blocked your edits, or you sense you are thrashing. Classifies the TYPE of failure BEFORE reacting (targeted bug / polluted session / wrong foundation) and applies the matching response instead of trying the same thing faster.
---

# Recover — diagnose before you react

The worst thing to do when something is broken is to do the SAME thing faster.
When you are stuck, you are not allowed to "just try again". You stop, classify the
failure, then apply the response that matches the class.

**Hard rule:** diagnosis (Step 2) and response (Step 3) are SEPARATE steps. Do not jump to a
fix. Do not start writing code until you have confirmed the failure type. One fix at a time.

## When this applies
- "It doesn't work" / "still broken" / "same error again"
- You have attempted a fix 2+ times without success
- The `loop-block-edits` hook has blocked your edits (3+ failed test cycles)
- The code runs but does the wrong thing
- You feel like you are guessing or thrashing

---

## Step 1 — Listen & count
Establish the facts before theorizing:
- **What** exactly broke (the component / behavior).
- **The exact error** — copy it, don't paraphrase from memory.
- **How many times** a fix has already been attempted on this same thing.

Do not propose a fix in this step. Just gather.

---

## Step 2 — Classify the failure (pick ONE)

| Class | Signals | Go to |
|---|---|---|
| **M1 — Targeted bug** | Isolated, 1–2 attempts, clear/single error, scope is one place | **3A** |
| **M2 — Polluted session** | 3+ attempts, tangled code, lost context, `loop-block-edits` blocked you | **3B** |
| **M3 — Wrong foundation** | Code RUNS but misunderstands the requirement or architecture | **3C** |

If torn between two classes, pick the **higher-numbered** one (M2 over M1, M3 over M2) —
it is cheaper to reset/rethink early than to keep patching a wrong base.

---

## Step 3 — Response (only after Step 2 is named out loud)

### 3A — Targeted fix (for M1)
- **Reproduce the real failure** — drive the browser (Playwright MCP) or run a `tsx`/script that
  triggers it. Do NOT conclude from the symptom alone.
- **Root cause ≠ symptom.** Trace to the actual cause before editing.
- **One fix at a time.** Apply, re-reproduce, confirm. No shotgun edits.

### 3B — Hard reset (for M2)
- **Stop patching.** More edits on a polluted session make it worse.
- Save what you learned (the gotcha, the dead end) via the `remember` skill so it survives the reset.
- Run the `loop-reset` command to clear the loop-guard counter (only after the root-cause audit).
- Start clean from a known-good point. Do **NOT** continue layering fixes on the tangled state.

### 3C — Rethink (for M3)
- **Name the wrong assumptions** explicitly — what did you believe that the running code disproves?
- If the task is NORMAL or CRITICAL, call the **architect** agent before rebuilding.
- **Wait for the user's agreement** on the new direction before you rebuild. Don't silently re-architect.

---

## Security carve-out
If a **security** problem surfaces during recovery (leaked secret, auth bypass, injection):
**STOP → document → fix → re-audit → resume.** Security takes precedence over getting unstuck.
