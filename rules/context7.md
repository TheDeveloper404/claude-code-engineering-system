When to use / not use Context7: see the context7 MCP server instructions (injected at session start; not repeated here).

Also use it BEFORE theorizing about a library/framework's exact runtime behavior (e.g. what a specific
function does or doesn't preserve) — call context7 as the FIRST step of debugging, not after guessing
wrong once or twice. A confidently-stated wrong theory costs more trust than an extra doc lookup.

## Steps

1. Always start with `resolve-library-id` using the library name and the user's question, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and the user's full question (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g. routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
