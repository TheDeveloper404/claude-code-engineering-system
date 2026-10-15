// Unit tests for install.mjs's pure functions. Run: node --test tests/install.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { agentToToml, assembleAgentsMd, fillClaudeDir, forClaude, forCodex, mergeSettings, parseFrontmatter } from "../install.mjs";

test("mergeSettings: personal scalar wins, permission lists union, hooks keep template first", () => {
  const template = {
    effortLevel: "medium",
    permissions: { allow: ["Bash(npm run *)", "Bash(git add *)"] },
    hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ command: "a" }] }] },
    enabledPlugins: { x: true, y: false },
  };
  const personal = {
    effortLevel: "high",
    permissions: { allow: ["Bash(git add *)", "WebFetch(domain:example.org)"], additionalDirectories: ["/p"] },
    hooks: { PreToolUse: [{ matcher: "*", hooks: [{ command: "b" }] }], Stop: [{ hooks: [{ command: "c" }] }] },
    enabledPlugins: { y: true },
  };
  const m = mergeSettings(template, personal);
  assert.equal(m.effortLevel, "high");
  assert.deepEqual(m.permissions.allow, ["Bash(npm run *)", "Bash(git add *)", "WebFetch(domain:example.org)"]);
  assert.deepEqual(m.permissions.additionalDirectories, ["/p"]);
  assert.deepEqual(m.hooks.PreToolUse.map((g) => g.hooks[0].command), ["a", "b"]);
  assert.equal(m.hooks.Stop[0].hooks[0].command, "c");
  assert.deepEqual(m.enabledPlugins, { x: true, y: true });
  assert.equal(template.effortLevel, "medium", "template is not mutated");
});

test("fillClaudeDir puts the real config dir into hook commands", () => {
  const s = fillClaudeDir({ hooks: { Stop: [{ hooks: [{ command: 'node "<CLAUDE_DIR>\\hooks\\x.js"' }] }] } }, "C:\\cfg");
  assert.equal(s.hooks.Stop[0].hooks[0].command, 'node "C:\\cfg\\hooks\\x.js"');
});

test("forClaude / forCodex path and file-name rewrites", () => {
  assert.equal(forClaude("read `~/.claude/docs/review-flow.md`", "C:\\cfg"), "read `C:/cfg/docs/review-flow.md`");
  assert.equal(forCodex("read `~/.claude/docs/review-flow.md` per CLAUDE.md"), "read `~/.codex/docs/review-flow.md` per AGENTS.md");
});

test("parseFrontmatter reads folded descriptions", () => {
  const { meta, body } = parseFrontmatter("---\nname: x\ndescription: >\n  line one\n  line two\ntools: Read\n---\nBody\n");
  assert.equal(meta.name, "x");
  assert.equal(meta.description, "line one line two");
  assert.equal(body, "Body\n");
});

test("agentToToml escapes quotes, backslashes and triple quotes", () => {
  const toml = agentToToml('---\nname: rev\ndescription: Says "hi"\n---\nUse C:\\path and """ and CLAUDE.md\n', "read-only");
  assert.match(toml, /^name = "rev"$/m);
  assert.match(toml, /^description = "Says \\"hi\\""$/m);
  assert.match(toml, /^sandbox_mode = "read-only"$/m);
  assert.ok(toml.includes('Use C:\\\\path and ""\\" and AGENTS.md'));
});

test("assembleAgentsMd: header, rules without frontmatter, personal last", () => {
  const out = assembleAgentsMd({
    header: "# H\n",
    claudeMd: "Global CLAUDE.md rules",
    rules: ["---\npaths:\n  - x\n---\nRule A"],
    personal: "Mine",
  });
  assert.equal(out, "# H\n\n---\n\nGlobal AGENTS.md rules\n\n---\n\nRule A\n\n---\n\nMine\n");
});
