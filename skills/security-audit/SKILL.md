---
name: security-audit
description: Use for a full security review of a CRITICAL feature — authentication, payments, permissions/roles, sensitive data, infrastructure — before merge, or when the user asks for a "security review", "security audit", threat model, or to verify/remediate a security finding. Covers all 13 categories and returns an APPROVED/BLOCKED verdict.
---

# Security Audit — Full 13-Category Review

Self-contained, condensed from `Audit_checklist.md` (the authoritative source) and the
security-engineer role. Use for CRITICAL features and pre-merge gates. You have veto power:
**no code ships with an open CRITICAL/HIGH finding.** For a quick single-route pass, use `secure-api-route`.

## The 13 categories (cover every applicable one)

1. **Secrets & Config** — no hardcoded secrets/keys/tokens; `.env` gitignored; no secrets in logs, errors, client bundles, CI logs, or images; debug off in prod; no default creds.
2. **Authentication** — bcrypt/argon2 (never MD5/SHA1/plain); brute-force protection; secure token generation; JWT signed + expiring; refresh rotation + logout invalidation; no session fixation; MFA where required; secure single-use, time-limited reset tokens.
3. **Authorization** — auth checks on all protected routes; **IDOR** (ownership validation); no privilege escalation; admin routes guarded by checks not obscurity; field-level access; no cross-tenant access; re-auth on sensitive actions.
4. **Input Validation & Injection** — server-side validation everywhere; parameterized queries (SQLi/NoSQLi); output encoding (XSS); no command/path/SSRF/XXE/template/header injection; file upload type+size+content checks.
5. **API & Access Control** — auth where needed; return only needed data; confirmation on sensitive actions; errors hide internals; server-only keys not client-exposed; CORS not wildcard; rate limiting on critical endpoints.
6. **Business Logic** — prices/payment not client-manipulable; replay protection; required steps can't be skipped; coupons/credits not abusable; state transitions validated server-side.
7. **Data Protection & Privacy** — encrypt sensitive data at rest; HTTPS/TLS + HSTS; cookies HttpOnly+Secure+SameSite; data minimization; GDPR where applicable; sensitive data masked in logs; not in URL params.
8. **Logging & Monitoring** — no secrets/PII in logs; structured + centralized; alerts for brute force / abuse / rate-limit violations; audit logs for sensitive actions.
9. **Abuse & Rate Limiting** — limits on login/reset/API; brute-force, bot, scraping protection; CAPTCHA for high-risk; IP throttling.
10. **Dependencies & Supply Chain** — updated deps; no known CVEs (npm/yarn audit, Snyk, Trivy, Dependabot); lockfiles present; no untrusted sources.
11. **Infrastructure & Deployment** — secure CI/CD; secrets not in build logs; prod ≠ dev; no debug endpoints in prod; hardened minimal containers (not root); firewall/network rules; DB not publicly reachable; security headers; TLS configured.
12. **File Handling & Storage** — files outside public root; signed URLs; randomized filenames; malware scanning where applicable; access control on retrieval.
13. **Security Testing** — SAST/DAST; manual review of critical flows; pen testing; automated checks in CI.

## STRIDE threat model
Assets → Attack surfaces → Threat actors → Threats (Spoofing, Tampering, Repudiation,
Information disclosure, DoS, Elevation of privilege) → Mitigations → Risk (Likelihood × Impact).
Required for new architecture / CRITICAL features (auth, payments, permissions). Also run it for any
feature that introduces a new **dangerous sink** (file/record deletion, raw SQL, redirect, email/SMS
send, privilege change) even if the feature itself isn't classified CRITICAL — the sink is what makes
it dangerous, not the feature's product label. A "just attach a link" feature can feed a deletion sink
just as easily as an "admin" feature can.

## Sink-tracing (dataflow) method — required once per audit, in addition to the 13 categories
The 13-category checklist is organized by *feature/category*, which means it only catches what the
reviewer thinks to re-examine. It systematically misses vulnerabilities that live in the **interaction**
between two independently-correct pieces of code (e.g., "accept any URL here" + "delete this URL there"
— each locally reasonable, dangerous only combined). A category checklist won't surface that unless the
reviewer happens to connect the two files.

Sink-tracing runs the checklist *backwards*: pick every dangerous sink in the codebase, then find every
source that can reach it, instead of reviewing feature-by-feature.

1. **Enumerate sinks** — grep/list every call site of: file/blob deletion, raw SQL/`sql\`\`` execution,
   redirect construction, email/SMS send, privilege/role mutation, cache/session invalidation.
2. **For each sink, trace backward** — what data reaches this call? Is any of it a value the *client*
   supplied (URL, ID, path, header) that was never re-validated for ownership right before hitting the
   sink? A value validated once, three call-sites upstream, is not validated at the sink — trust must be
   re-established at the boundary that actually matters (the sink), not assumed from an earlier layer.
3. **Cross-reference against every write path that produces that sink's input** — not just the one the
   current feature touches. If path A already has the ownership check (because it was patched once) and
   path B produces the same kind of value but was added later/separately, B is unchecked until proven
   otherwise. Enumerate ALL producers, not just the one in front of you.
4. **Prefer a mechanical guard over a memorized rule** for any sink-tracing finding that gets fixed — a
   CI check (regex/AST heuristic + baseline for pre-existing cases, same shape as a lint rule) that fails
   on any NEW unguarded call site. A written rule in docs/CLAUDE.md gets followed until it's forgotten
   under time pressure; a failing CI check can't be forgotten. Don't over-engineer this into a generic
   framework — a narrow, sink-specific script (grep the known sink names, grep the known guard names,
   flag call sites with the former and not the latter) is enough and stays maintainable.

This method matters most on audits with **full, fresh scope** (re-auditing the whole codebase, not just
a diff or a single feature) — targeted reviews naturally reuse the reviewer's existing mental model of
"what's already safe," which is exactly what lets sink/source mismatches survive across multiple
targeted reviews. Schedule a full-scope sink-tracing pass periodically (e.g. monthly/quarterly, or at
a growth milestone), not only on request.

## Finding format
```
[SEC-001] Severity: CRITICAL|HIGH|MEDIUM|LOW
Category: <e.g. IDOR>
Location: <file:line / component>
Impact: <what an attacker could do>
Remediation: <specific fix, with code>
Status: OPEN | REMEDIATED | VERIFIED
```

## Verdict (always end here)
```
SECURITY AUDIT — Scope: <what>
Findings: Critical N · High N · Medium N · Low N
Verdict: APPROVED   (no open Critical/High)
        — or —
Verdict: BLOCKED — requires remediation
[finding list]
```
Policy: ANY open Critical or High = **BLOCKED**. Re-audit after the fix before approving.
