# Incident memory format (the learning loop)

When the user corrects something the agent did **without being asked**, a **trial-and-error loop**, or a
**"done" that wasn't verified**, the agent saves ONE file per incident in the project's memory
(`projects/<project>/memory/incident-<slug>.md`) and one line in `MEMORY.md` starting with `INCIDENT`.
`MEMORY.md` is loaded at the start of every session, so the lesson is in front of the agent next time.

Why: a correction given only in chat is forgotten at the next session; the same mistake comes back.

## Template

```markdown
---
name: incident-<slug>
description: "INCIDENT <type> — <what the agent did, 1 line>"
metadata:
  type: feedback
  incident: unsolicited-addition | trial-error-loop | unverified-done
  date: YYYY-MM-DD
---
Asked: <the real request, 1 line>
Did on top: <what exactly, file:line>
Why it was wrong: <the concrete effect: who was affected and how>
Missed signal: <what should have stopped the agent before writing it>
Rule: [[scope-rule]] (global CLAUDE.md "Scope — rule #1")
```

Line in `MEMORY.md`:
`- [INCIDENT <slug>](incident-<slug>.md) — <type>: <what, 1 line>`

## Example (filled in)

```markdown
---
name: incident-orders-list-limit
description: "INCIDENT unsolicited-addition — added WHERE + LIMIT to the orders list while fixing prices"
metadata:
  type: feedback
  incident: unsolicited-addition
  date: 2026-01-15
---
Asked: the orders list shows the price without VAT; show it with VAT.
Did on top: added `WHERE total IS NOT NULL LIMIT 100` in `src/orders/repository.ts:58`.
Why it was wrong: orders without a total (drafts) and everything after row 100 disappeared; a teammate
reported it as a new bug and spent an hour on it.
Missed signal: the request was about how the price is displayed, not about which rows appear.
Rule: [[scope-rule]] (global CLAUDE.md "Scope — rule #1")
```

`MEMORY.md`:
`- [INCIDENT orders-list-limit](incident-orders-list-limit.md) — unsolicited-addition: WHERE + LIMIT added while fixing prices`
