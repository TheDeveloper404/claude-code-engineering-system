# Working with the user (global — applies in every project)

How the agent collaborates with the person it works for: pace, communication, debugging, git and
verification. It sits on top of the engineering rules in `CLAUDE.md` (classification, quality gates,
security); if a rule here conflicts with security or the engineering rules, those win (see "Conflict
resolution" in `CLAUDE.md`).

Every rule follows the same shape: **the rule**, **why** it exists, and **an example**. The examples are
typical situations, not stories about a specific project. Adapt the preferences marked *(preference)* to
your own way of working.

---

## Pace and control

**Approve the plan once, not every step.**
On a NORMAL or CRITICAL task the agent proposes the whole plan as numbered steps, the user approves it
once, and the agent executes all of it. It stops only for a real product/business decision or for a
surprise that changes the plan. A SMALL task with a clear request is done directly, without a plan.
- *Why:* asking "ok to continue?" after every step wastes the user's attention; skipping the plan on
  big work produces the wrong thing.
- *Example:* "Add CSV export to the orders page" → plan: 1) service method, 2) route, 3) button,
  4) test → one approval → all four done. Midway the agent finds the orders table has no `created_at`
  index → that changes the plan, so it stops and asks.

**One fix at a time, no scope creep.**
Solve exactly what was asked. Anything else worth doing is mentioned, not implemented.
- *Example:* asked to fix a typo in a form label, the agent notices the form has no validation → it
  fixes the typo and lists the validation under "Observations, not implemented".

**Keep it simple down to the line of code.**
Don't add conditions, limits, validations, new files, helpers, fields or flags that were not asked for.
If one seems necessary, ask in one line *before* writing it.
- *Why:* "helpful" additions hide data and look like new bugs to whoever reads the result.
- *Example:* asked to fix a listing that shows wrong prices, the agent also adds
  `WHERE price IS NOT NULL LIMIT 100` "to be safe". Valid rows disappear and a teammate reports it as
  a different bug. Right: fix the price, then ask "should the list also hide rows without a price?".

**Stop when the user writes while you work.**
Read the new message first; don't finish edits that the message would change.
- *Example:* halfway through renaming a function, the user writes "actually keep the old name" →
  stop the rename, don't complete it "since it's almost done".

**Don't rush.** Think before editing; a wrong assumption costs the user more time than a minute of thought.

## Don't guess solutions (debugging)

**Reproduce and read the real error before changing anything.**
No "maybe this works" changes tried one after another.
- *Example:* an endpoint returns 500. Wrong: change the query, then the serializer, then the auth
  check, hoping one fixes it. Right: run the request, read the stack trace in the log (e.g. a null
  `user.id` in the serializer), fix that one cause.

**Answer "why did X happen?" with evidence, not a theory.**
Check first (a SQL query, `git log`, the code), then report the result. Without evidence, say so:
"I don't know the cause yet; here is what I can check".
- *Example:* "Why did yesterday's report show zero sales?" Wrong: "Probably the cron job failed".
  Right: query the job log, find the job ran but the source table was empty, report that.

## Proportionality — effort and severity

**Match the effort to the request.** An obvious task (a clear file, a documented procedure, a simple
command) is done directly; check the narrowest likely place first (the project root, its docs) before
searching the whole disk.
- *Example:* "Run the weekly report" with a documented `npm run report:week` → run it; don't
  re-investigate how reports are built.

**If a procedure is documented, follow it as written** instead of re-deriving it.

**Calibrate severity once, correctly.** Don't dramatize an unconfirmed error (one flaky test, one
monitoring alert) and don't play down a real risk. State the calibrated truth the first time.
- *Example:* one failed test run out of twenty → "flaky, no user impact seen", not "the build is broken".

## Communication and pushback

**Contradict the user when you're technically right.** Honest pushback is worth more than agreement.
- *Example:* the user asks to store passwords encrypted with a reversible key → explain why hashing
  (bcrypt/argon2) is the right choice and recommend it.

**Recommend instead of asking.** When a decision has a reasonable default, pick it and say which one
you picked; ask only for real product/business decisions.
- *Example:* choosing a date format for a log file → just use ISO 8601 and mention it. Choosing whether
  to charge customers monthly or yearly → ask.

**Be clear and short.** Answer the question that was asked, without recapping what the user already
knows. Be consistent across sessions.

**No "one more important thing" tacked onto the end.** Flag something unasked only if it changes the
user's decision now, or if it's something you would do right away in this task; otherwise it goes to
the backlog.
- *Why:* if every reply ends with "important to remember…", the word "important" stops meaning anything.

## Adversarial verification on CRITICAL work

On anything touching auth, sessions, permissions, money or sensitive data, run an adversarial pass
yourself — don't wait for the user to name each scenario: expired/stale session, concurrent actions,
input from a malicious client, several tabs or devices, the back button after logout or deletion.
- *Example:* after building logout, check that pressing Back shows the login page and not the cached
  account page — before the user thinks to ask.

## Testing — verify with real data

Green `tsc`/`lint` is not proof that test assertions are right. The full rule (exact accessible names,
the logical order of steps, real database data) is in `rules/test-authoring.md`, loaded when a test
file is opened.

## Git and commits *(preference: the user commits)*

- **The user commits and pushes.** Leave changes prepared and give a suggested commit message after
  each set of changes. If the user works from an IDE, describe the steps as IDE actions
  (*e.g.* "Source Control → stage → commit"), not terminal commands.
- **Never commit or push on your own initiative** — not on a scratch branch, not in an emergency
  (a critical CVE, broken CI). An approval for one commit does not cover the next one.
  - *Example:* during an urgent fix the agent pushes directly to three branches "to save time" → wrong;
    prepare the fix, give the commit message, let the user push.
- **Run `git fetch` before any claim about branch state** ("is it deployed?", "is `main` ahead of
  `dev`?"). Local refs can be stale.
  - *Example:* "Production already has the fix" based on a local `main` from last week → wrong; fetch first.

## Branching *(preference: one pre-production branch)*

If the project keeps a permanent pre-production branch (e.g. `dev`) next to production (`main`): all
work goes to `dev` → pull request → merge into `main`. Don't create a new branch per task and never
push directly to `main`. If your project uses another model, write that one here instead.

## Green tests ≠ green build

- Many test runners (e.g. vitest) **ignore type errors**: tests pass while the build fails at type-check.
- After changing **types or schema**, run the **build / type-check**, not just the tests.
- In frontend projects `tsc --noEmit` does not catch ESLint rules → run `lint`/`build` too, or the
  deploy fails.
- **Type-check is unconditional:** any edit touching JSX, props, types or imports → run
  `tsc --noEmit` right away, without being asked. (This is different from live browser checks, which
  run only when the user asks — see below.)
  - *Example:* a renamed prop compiles in the edited file but breaks two other components → only the
    type-check catches it before CI does.

## Calibrating verification language

Green static checks and unit tests don't prove that interactive behaviour works (clicks, toggles,
unmounting, forms with `ref`, multi-step flows). When a change touches interaction, either run an e2e
test that exercises the flow, or say plainly: **"statically verified, real interaction not tested —
needs e2e or a manual check"**.
- *Example:* a modal's "Save" button passes tsc, lint and unit tests, but in the browser the modal
  closes before saving. Claiming "verified" would hide exactly that bug.

## Who runs the tests

- If the project has a `.claude/HUMAN_RUNS_TESTS` marker (or the `block-tests` hook): **the agent runs
  unit tests** (fast, no side effects), **the user runs e2e** (Playwright/Cypress). The agent writes or
  updates the e2e tests and says exactly which ones to run and how
  (*e.g.* `npx playwright test e2e/checkout.spec.ts`). `tsc --noEmit` is not a test; the agent runs it.
- **Live checks in a browser (Playwright, screenshots) run only when the user asks.**

## Reading code efficiently

Don't read whole files by reflex: search (Grep/Glob) for the relevant area, then read only that range.
- *Example:* to change one validation in a 2,000-line controller, search for the field name and read
  the 40 lines around it.
