---
name: secure-api-route
description: Use when creating or EDITING any server-side entry point that crosses a trust boundary — a route handler (app/api/**/route.ts), a Next.js Server Action ("use server"), an Express/Fastify endpoint, middleware, an auth guard, a webhook receiver, or a cron/queue handler — including "small" changes to an existing one. Also triggers on RBAC / permissions / ownership checks / JWT / sessions / cookies. Run the checklist BEFORE declaring the change done; do not skip because the change looks like a one-liner.
---

# Secure API Route — Baseline Enforcement

Self-contained checklist condensed from `Audit_checklist.md` (cat. 02–05) and the
error contract in `Backend.md`. Apply to **every** route/endpoint/handler you write or edit.
This is the per-route fast pass — for a full 13-category audit use `security-audit`.

## When this applies
Any new or modified: HTTP route, controller, API handler, middleware, auth guard,
serverless function, GraphQL resolver, or RPC method that crosses a trust boundary.

## The baseline (all must hold)

### 1. Authentication — deny by default
- Every route is authenticated **unless explicitly public**. No "public-by-default".
- Auth is enforced **server-side**, not just hidden in the UI.
- Sessions/JWT: expiry set, validated signature, no secret in code, invalidated on logout.

### 2. Authorization & IDOR
- Check **resource ownership** on every object access: can this user touch *this* record?
  `WHERE id = :id AND owner_id = :currentUser` — never trust an ID from the client alone.
- Enforce roles/permissions server-side (RBAC/ABAC). Admin routes protected by checks, not URL obscurity.
- Multi-tenant: scope every query by tenant. No horizontal cross-tenant access.

### 3. Input validation (server-side)
- Validate **all** input server-side (body, params, query, headers) against a schema. Client validation never counts.
- Parameterized queries / ORM — no string-concatenated SQL/NoSQL. No `eval` / dynamic code from input.
- File uploads: validate type, size, content; randomized stored names; stored outside public root.

### 4. Output & error contract
- Return only needed fields — no over-fetching, never return password hashes or internal fields.
- Errors use the standard shape — **no stack traces, SQL errors, or file paths** leaked:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
  ```
  Codes: 400 `VALIDATION_ERROR`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`,
  409 `CONFLICT`, 429 `RATE_LIMITED`, 500 `INTERNAL_ERROR` (generic, no internals).
- No user enumeration: same message for wrong email vs wrong password; don't reveal account existence.

### 5. Rate limiting & abuse
- Rate limit sensitive/critical endpoints: login, password reset, signup, write/expensive ops.

### 6. Transport & headers
- CORS restricted to known origins — **never** `Access-Control-Allow-Origin: *` with credentials.
- Security headers present (HSTS, CSP, X-Frame-Options). Cookies: HttpOnly + Secure + SameSite.
- Sensitive actions (delete, email/password change) require confirmation / re-auth.

## Verdict (end every pass with this — no essay)
```
SECURE-API-ROUTE: PASS
```
or
```
SECURE-API-ROUTE: FINDINGS
- [SEC-1] <category> — <file:line> — <issue> → <fix>
```
Treat missing auth, IDOR, injection, or leaked internals as BLOCKING — do not ship until fixed.
