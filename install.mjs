#!/usr/bin/env node
// Installs this repository — the single source of truth — into Claude Code and Codex.
//   node install.mjs            install
//   node install.mjs --dry-run  only list what would change
//
// Claude Code: $CLAUDE_CONFIG_DIR (else ~/.claude) gets CLAUDE.md, rules/, docs/, agents/, commands/,
//   hooks/, skills/ and a settings.json = settings.json here merged with <config>/personal/settings.personal.json.
// Codex: $CODEX_HOME (else ~/.codex) gets a generated AGENTS.md (codex/AGENTS.header.md + CLAUDE.md +
//   rules/ + <config>/personal/AGENTS.personal.md), docs/, and agents/*.toml; skills go to ~/.agents/skills.
// Personal, private additions live ONLY in <config>/personal/ — never in this repository.
//
// Never deletes anything in a target; a file it overwrites is first copied to
// <config>/backups/install-<timestamp>/.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_DIRS = ["rules", "docs", "agents", "commands", "hooks", "skills"];

/** Splits `---` frontmatter (simple `key: value` and folded `key: >` blocks) from the body. */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1];
      meta[key] = kv[2] === ">" || kv[2] === "|" ? "" : kv[2].trim();
    } else if (key && /^\s+\S/.test(line)) {
      meta[key] = (meta[key] ? meta[key] + " " : "") + line.trim();
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

/** Claude Code side: `~/.claude` in text becomes the real config dir. */
export function forClaude(text, claudeDir) {
  return text.split("~/.claude").join(claudeDir.replace(/\\/g, "/"));
}

/** Codex side: docs live under ~/.codex, and the instruction file is AGENTS.md. */
export function forCodex(text) {
  return text.split("~/.claude/docs/").join("~/.codex/docs/").split("CLAUDE.md").join("AGENTS.md");
}

/** One Codex agent .toml from a Claude Code agent .md. */
export function agentToToml(md, sandboxMode) {
  const { meta, body } = parseFrontmatter(md);
  const str = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const multi = forCodex(body.trim()).replace(/\\/g, "\\\\").replace(/"""/g, '""\\"');
  return (
    `name = ${str(meta.name)}\n` +
    `description = ${str(meta.description ?? "")}\n` +
    `sandbox_mode = ${str(sandboxMode)}\n` +
    `developer_instructions = """\n${multi}\n"""\n`
  );
}

/** The generated Codex AGENTS.md: header, global rules, every rule file (frontmatter dropped), personal part. */
export function assembleAgentsMd({ header, claudeMd, rules, personal }) {
  const parts = [header.trimEnd(), claudeMd.trim(), ...rules.map((r) => parseFrontmatter(r).body.trim())];
  if (personal) parts.push(personal.trim());
  return forCodex(parts.join("\n\n---\n\n")) + "\n";
}

/**
 * settings.json = template merged with the personal file: personal scalars and
 * objects win key by key, permission lists are unions, and each hook event keeps
 * the template's hooks first, then the personal ones.
 */
export function mergeSettings(template, personal) {
  const out = structuredClone(template);
  for (const [k, v] of Object.entries(personal ?? {})) {
    if (k === "hooks") {
      out.hooks ??= {};
      for (const [ev, groups] of Object.entries(v)) out.hooks[ev] = [...(out.hooks[ev] ?? []), ...groups];
    } else if (k === "permissions") {
      const p = { ...(out.permissions ?? {}) };
      for (const [pk, pv] of Object.entries(v)) {
        p[pk] = Array.isArray(pv) && Array.isArray(p[pk]) ? [...new Set([...p[pk], ...pv])] : pv;
      }
      out.permissions = p;
    } else if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") {
      out[k] = { ...out[k], ...v };
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Template hook commands carry <CLAUDE_DIR>; the installed ones carry the real (native) path. */
export function fillClaudeDir(settings, claudeDir) {
  const s = structuredClone(settings);
  for (const groups of Object.values(s.hooks ?? {})) {
    for (const g of groups) for (const h of g.hooks ?? []) if (h.command) h.command = h.command.split("<CLAUDE_DIR>").join(claudeDir);
  }
  return s;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);

/** Every file to write: { label, root, rel, content }. */
export function planOutputs({ claudeDir, codexDir, agentsSkillsDir }) {
  const personalDir = path.join(claudeDir, "personal");
  const outs = [];
  const add = (label, root, rel, content) => outs.push({ label, root, rel, content });

  // --- Claude Code
  const personalClaude = readIf(path.join(personalDir, "CLAUDE.personal.md"));
  const claudeMd = fs.readFileSync(path.join(SRC, "CLAUDE.md"), "utf8");
  add("claude", claudeDir, "CLAUDE.md", forClaude(claudeMd.trimEnd() + (personalClaude ? "\n\n---\n\n" + personalClaude.trim() : "") + "\n", claudeDir));
  for (const d of CLAUDE_DIRS) {
    for (const f of walk(path.join(SRC, d))) {
      const rel = path.relative(SRC, f);
      const buf = fs.readFileSync(f);
      add("claude", claudeDir, rel, f.endsWith(".md") ? forClaude(buf.toString("utf8"), claudeDir) : buf);
    }
  }
  const template = JSON.parse(fs.readFileSync(path.join(SRC, "settings.json"), "utf8"));
  const personalSettings = readIf(path.join(personalDir, "settings.personal.json"));
  const settings = fillClaudeDir(mergeSettings(template, personalSettings ? JSON.parse(personalSettings) : {}), claudeDir);
  add("claude", claudeDir, "settings.json", JSON.stringify(settings, null, 2) + "\n");

  // --- Codex
  const ruleFiles = fs.readdirSync(path.join(SRC, "rules")).filter((f) => f.endsWith(".md")).sort();
  add(
    "codex",
    codexDir,
    "AGENTS.md",
    assembleAgentsMd({
      header: fs.readFileSync(path.join(SRC, "codex", "AGENTS.header.md"), "utf8"),
      claudeMd,
      rules: ruleFiles.map((f) => fs.readFileSync(path.join(SRC, "rules", f), "utf8")),
      personal: readIf(path.join(personalDir, "AGENTS.personal.md")),
    })
  );
  for (const f of walk(path.join(SRC, "docs"))) add("codex", codexDir, path.relative(SRC, f), forCodex(fs.readFileSync(f, "utf8")));
  const sandbox = JSON.parse(fs.readFileSync(path.join(SRC, "codex", "agents.json"), "utf8")).sandbox_mode;
  for (const f of fs.readdirSync(path.join(SRC, "agents")).filter((x) => x.endsWith(".md"))) {
    const name = f.replace(/\.md$/, "");
    add("codex", codexDir, path.join("agents", `${name}.toml`), agentToToml(fs.readFileSync(path.join(SRC, "agents", f), "utf8"), sandbox[name] ?? "read-only"));
  }
  for (const f of walk(path.join(SRC, "skills"))) {
    const rel = path.relative(path.join(SRC, "skills"), f);
    if (!rel.includes(path.sep)) continue; // skills/README.md is Claude-only
    const buf = fs.readFileSync(f);
    add("agents-skills", agentsSkillsDir, rel, f.endsWith(".md") ? forCodex(buf.toString("utf8")) : buf);
  }
  return outs;
}

function main() {
  const dry = process.argv.includes("--dry-run");
  const home = os.homedir();
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(home, ".claude");
  const codexDir = process.env.CODEX_HOME || path.join(home, ".codex");
  const agentsSkillsDir = path.join(home, ".agents", "skills");
  const backupRoot = path.join(claudeDir, "backups", `install-${new Date().toISOString().replace(/[:.]/g, "-")}`);

  const counts = { new: 0, changed: 0, same: 0 };
  for (const o of planOutputs({ claudeDir, codexDir, agentsSkillsDir })) {
    const target = path.join(o.root, o.rel);
    const next = Buffer.isBuffer(o.content) ? o.content : Buffer.from(o.content, "utf8");
    const prev = fs.existsSync(target) ? fs.readFileSync(target) : null;
    if (prev && prev.equals(next)) {
      counts.same++;
      continue;
    }
    counts[prev ? "changed" : "new"]++;
    console.log(`${prev ? "changed" : "new    "}  ${o.label.padEnd(13)} ${target}`);
    if (dry) continue;
    if (prev) {
      const b = path.join(backupRoot, o.label, o.rel);
      fs.mkdirSync(path.dirname(b), { recursive: true });
      fs.writeFileSync(b, prev);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, next);
  }
  console.log(`\n${dry ? "[dry-run] " : ""}${counts.new} new, ${counts.changed} changed, ${counts.same} unchanged.`);
  if (!dry && counts.changed) console.log(`Previous versions: ${backupRoot}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
