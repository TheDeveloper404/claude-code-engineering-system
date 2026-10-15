---
name: performance-review
description: Use when something is slow or needs optimizing — profiling, bottlenecks, N+1 queries, missing indexes, caching, bundle size, Web Vitals (LCP/INP/CLS), pagination, load testing, or defining/validating performance budgets and SLAs. Triggers on words like slow, optimize, latency, query, index, cache, bundle.
---

# Performance Review

Self-contained, condensed from the performance-engineer role. Measure first, then optimize
the proven bottleneck — no premature optimization. Prioritize findings P1/P2/P3 by impact.

## Targets (budgets to check against)
```
API simple read   < 100ms (max 200)   |  API complex query  < 300ms (max 500)
API write         < 200ms (max 400)   |  API file upload     < 1s   (max 3s)
Page initial LCP  < 1.5s  (max 3s)    |  Page navigation     < 300ms (max 500)
DB simple query   < 10ms  (max 50)    |  DB complex query    < 100ms (max 300)
Cache lookup      < 5ms   (max 10)
Web Vitals: LCP < 2.5s · INP < 200ms · CLS < 0.1 · TTFB < 800ms · FCP < 1.8s
Load test: P95/P99 within target · error rate < 0.1%
```

## Checklist

### Frontend
- Bundle < ~200KB gzipped initial; code splitting / lazy routes; tree shaking; unused deps removed.
- Images optimized (WebP/AVIF, srcset, lazy); fonts subset + preload + `font-display: swap`; critical CSS.
- No unnecessary re-renders; memoize expensive work (useMemo/React.memo); virtualize long lists.
- GPU-accelerated animations (transform/opacity); no layout thrashing; no CLS.
- API calls batched/debounced; prefetch predictable nav; CDN for static; HTTP/2-3.

### Backend
- Response times meet targets; HTTP caching headers (ETag, Cache-Control); compression (gzip/brotli).
- No over-fetching; **pagination on every list endpoint** (never fetch all); request timeouts.
- Heavy work → background jobs/queues; connection pooling sized; no leaks (listeners, caches, closures).
- Hot data cached (Redis/in-memory); cache invalidation + TTLs defined; stampede prevention.

### Database
- **No N+1** (verify with EXPLAIN ANALYZE — join/batch instead); indexes on frequent query columns.
- No full table scans on large tables; SELECT only needed columns; indexed join columns.
- Pool sized; query timeout; slow-query logging; read replicas for read-heavy; partition huge tables.
- Archive/purge growing tables; right-sized data types; batch bulk writes.

## Load testing (when validating capacity)
Smoke · Load (expected peak) · Stress (breaking point) · Soak (leaks) · Spike (autoscale).
Success: P50/P95/P99 within target, error rate < 0.1%, throughput ≥ target. Tools: k6, Artillery, Gatling, Locust, JMeter.

## Finding format
```
[PERF-001] Priority: P1|P2|P3  Category: Frontend|Backend|Database|Infra
Component: <file/endpoint/query>
Current: <measured, e.g. "/users P95 = 2.3s">  Target: <e.g. "< 300ms P95">
Root cause: <e.g. "N+1: 1 query for users + N for roles">
Fix: <specific change>   Expected impact: <e.g. "~10x, P95 < 200ms">   Effort: Low|Med|High
```

## Verdict (end here — no essay)
```
PERFORMANCE REVIEW — Scope: <what>
Issues: P1 N · P2 N · P3 N
Verdict: PASS  (within budgets)  —or—  FINDINGS (see list)
```
