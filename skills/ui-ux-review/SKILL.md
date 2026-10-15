---
name: ui-ux-review
description: Use when building or reviewing UI — components, pages, screens, forms, tables, modals, dashboards, landing pages — or editing .tsx/.jsx files. Enforces visual consistency, required empty/loading/error states, component behavior, responsive rules, and accessibility. Triggers on frontend/UI work, "make this look good", design review.
---

# UI/UX Review

Self-contained, condensed from `UI_UX_RULES.md`. Defines **constraints**, not exact tokens
(colors/spacing/fonts are per-project decisions). Goal: every screen looks like **one person
designed it**. Precedence: security > UX > code elegance.

## 1. Consistency (the #1 failure to prevent)
- **Typography:** ≤ 2 font families; a fixed type scale (5–7 steps, no arbitrary sizes); ≤ 3 weights;
  line-height set (body 1.5–1.75, headings 1.1–1.3); visually obvious h1>h2>h3 hierarchy.
- **Color:** defined palette (1 primary, 1–2 accents, 5–7 neutrals, semantic success/warn/error/info);
  every color from the palette; semantic colors mean what they say; sufficient contrast (WCAG AA).
- **Spacing:** values from a scale (4/8/12/16/24/32/48/64); consistent card/section/modal padding;
  space encodes hierarchy; related close, unrelated far.
- **Radius:** one radius language (sharp / soft / round) — don't mix. **Icons:** one set, 2–3 sizes, labeled.

## 2. Layout anti-patterns (must NOT happen)
Lonely card floating in a void · everything-wrapped-in-a-card / cards-in-cards · wall of text/data
without sections · overloaded hero (one message + one CTA) · flat page with no visual hierarchy.

## 3. Component behavior
- **Buttons:** one primary per context; action-verb labels; destructive looks destructive; disabled looks disabled; consistent sizes.
- **Forms:** labels above inputs (never placeholder-as-label); errors inline below the field in error color; constrained width (400–600px); consistent field spacing; group related fields.
- **Tables:** right-align numbers; distinct header row; comfortable row height; **empty state required**.
- **Modals:** focused decisions only; one primary + one cancel; dim overlay; bounded max-width (not full).
- **Navigation:** clear active state; ≤ 5–7 top-level items; mobile nav planned.

## 4. Required states (most-seen screens — never skip)
- **Empty:** every list/table/dashboard has a designed empty state — icon + heading + explanation + CTA;
  positive framing, not an error; search-no-results ≠ empty.
- **Loading:** skeletons for content, spinner-in-button for actions; never a blank page; no layout shift (CLS).
- **Error:** field errors inline; page errors as banner; full-page 404/500/offline keep nav + give a recovery action; network errors = non-blocking toast with retry.

## 5. Responsive
Mobile-first; content priority changes per breakpoint (not just vertical stacking); touch targets ≥ 44×44px;
min body 14px mobile; test the 768–1024 tablet range.

## 6. Micro-UX
Immediate feedback on every action; hover state on everything clickable; transitions 150–250ms (state) /
300–500ms (content); user-centric copy; specific success/error messages; no horizontal scroll; preserve scroll position.

## 7. Accessibility (required minimum)
Color never the sole state indicator (+icon+text); full keyboard reachability; visible focus ring (never bare `outline:none`);
labels on all inputs (`for`/`id`); semantic HTML first, ARIA second; alt text on meaningful images; contrast WCAG AA (4.5:1 / 3:1).

## Quick anti-pattern scan
Font soup · size chaos · orphan card · card inception · rainbow palette · disabled mystery ·
phantom click (pointer, no hover) · empty void · error silence · layout jump · wall of sameness · mobile afterthought.

## Verdict (end here — no essay)
```
UI-UX-REVIEW: PASS
```
or
```
UI-UX-REVIEW: FINDINGS
- [UX-1] <category> — <component/file> — <issue> → <fix>
```
