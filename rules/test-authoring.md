---
paths:
  - "**/*.spec.{ts,tsx,js,mjs}"
  - "**/*.test.{ts,tsx,js,mjs}"
  - "**/e2e/**"
  - "**/tests/**"
  - "**/playwright.config.*"
---

# Test authoring (global, path-scoped — loads when a test file is opened)

> Moved out of the global `CLAUDE.md` and `rules/working-style.md` on 2026-10-09 to keep the always-loaded
> instructions under 200 lines per file; text unchanged. Read it before PLANNING tests too, not only once
> a test file is open.

## E2E/authz test authoring (mandatory — same status as the SDLC flow; user decision 2026-08-09)
> Why: code and the test that validates it come out of the SAME mental model of the feature. If that
> model has a gap, the gap reproduces identically in the test — it stops being an independent check and
> becomes an echo. Two real cases on one client project's feature, same session: an assertion of
> `expect(res.status()).toBe(404)` on a route with `loading.tsx` (Next.js commits 200+noindex once
> streaming starts after `notFound()` — documented framework behavior, written from assumption, not
> checked); and a test exercising an authorization rule with the wrong actor, because the scenario was
> derived from a prose description of the feature ("the owner can release details") instead of the
> domain rule's actual text (which required the author to no longer be an active member).

**Three mechanical steps — not good intentions, actual actions before the test is considered written:**
1. **Authorization/business-rule test → quote the domain rule verbatim** in a comment directly above the
   test, before writing the scenario. Derive the actors and preconditions from that quote, not from
   memory of the feature or its prose description.
2. **New framework-behavior assertion (status codes, redirects, caching, streaming) → check context7
   BEFORE writing the `expect`**, not reactively after the test fails. This is the existing global
   "context7 before guessing library behavior" rule, applied proactively at test-authoring time, not
   only during debugging.
3. **Run the new e2e test immediately, on its own segment** (`--project=X path/to.spec.ts`), not bundled
   with the rest of a large feature and left "written, statically verified, not yet run" until the end.
   Wrong assumptions get caught and fixed one at a time, not accumulated.

This does not promise zero failing tests — a false guarantee. It targets the specific failure mode where
a test silently inherits the same wrong assumption as the code it is meant to catch.

## Testing — I verify with real data, I don't assume from the code
- When writing/fixing tests (especially e2e), green `tsc`/`lint` is NOT proof that the assertions are
  correct — they catch only type errors, not wrong assumptions about what the real UI renders or
  what's in the DB.
- Before "done": I check the EXACT accessible name (it may concatenate text+counter), the logical
  order of the steps (an assert doesn't depend on a state that doesn't exist yet at that point), and
  the real data in the DB when the test assumes it — not just read the component code and assume.
