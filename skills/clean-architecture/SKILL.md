---
name: clean-architecture
description: Use BEFORE writing the first file of a new feature that spans layers (UI + service + repo/DB), when adding a new service/repository/module, when moving business logic between layers, or when defining/changing an API contract (endpoints, request/response shapes, error codes). Concrete triggers - scaffolding a feature, "unde pun logica asta?", a mutation being written directly in a component/handler instead of a service, a refactor that touches module boundaries. NOT for one-file bug fixes or styling changes.
---

# Clean Architecture & API Design

Self-contained, condensed from `SW_PRINCIPLES.md` and the architect role. Apply when structuring
a feature, reviewing layering, or defining an API contract. Adapt rigor to task size — don't
impose enterprise layering on a small change (anti-overengineering).

## Layering — dependencies point inward
```
Presentation (Controller/Handler/UI)  → orchestration only, no business logic
        ↓
Business Logic (Service)              → the rules; no framework/DB details
        ↓
Data Access (Repository)              → DB access; returns domain objects, not ORM leaks
```
- **Controllers orchestrate, Services decide, Repositories persist.** No business logic in controllers/handlers.
- No direct DB access from the presentation layer. Domain logic has **no** infrastructure dependencies.
- DTOs for input/output — don't leak ORM entities across boundaries. Dependencies injected, not created.

## SOLID
- **S**RP — one reason to change per module. **O**CP — extend without modifying.
- **L**SP — subtypes substitute base types safely. **I**SP — small, specific interfaces.
- **D**IP — depend on abstractions, not implementations.

## DRY · KISS · YAGNI
Don't duplicate logic · prefer the simple solution · don't build for an imagined future.

## Project structure
- **Frontend:** organize by feature (`/features/auth`), not just by type; small reusable components;
  clear local-vs-global state; separate UI logic from business logic.
- **Backend:** `Controller → Service → Repository`; DTOs for boundaries.
- Low coupling, high cohesion; no circular dependencies; clear module ownership.

## API design (REST)
- Resource routes: `/users` (GET, POST), `/users/:id` (GET, PUT, DELETE).
- Correct status codes; **consistent response shape**; version the API (`/v1/`).
- Consistent error contract (no stack traces):
  `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }`
- Pagination on all list endpoints; auth marked per endpoint; rate-limit sensitive ones.
- Document the contract: method, auth (required/public), input, output shape, error codes.

## Anti-patterns to reject
God classes/services · circular deps · shared mutable state across services · business logic in
controllers · tight coupling to infrastructure · DB access from presentation · over-engineering ·
premature optimization · spaghetti / copy-paste code.

## ADR (for non-trivial technology/design decisions)
```
Decision: <what>   Context: <why needed>
Options: A (pros/cons) · B (pros/cons) · C (pros/cons)
Chosen: <which + why>   Consequences: <impact>   Security impact: <if any>
```

## Verdict (end here — no essay)
```
CLEAN-ARCHITECTURE: PASS
```
or
```
CLEAN-ARCHITECTURE: FINDINGS
- [ARCH-1] <principle/layer> — <file> — <issue> → <fix>
```
