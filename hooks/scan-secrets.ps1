# PreToolUse(Bash) — block `git commit` when staged diff contains hardcoded secrets.
# Exit 2 = block (stderr shown to Claude). Any error = exit 0 (never break the session).
$ErrorActionPreference = 'Stop'
try {
  $raw = [Console]::In.ReadToEnd()
  if (-not $raw) { exit 0 }
  $j = $raw | ConvertFrom-Json
  $cmd = [string]$j.tool_input.command
  if (-not $cmd) { exit 0 }

  # Only inspect git commit invocations.
  if ($cmd -notmatch '(?i)(^|[;&|\s])git\s+commit\b') { exit 0 }

  $staged = git diff --cached --unified=0 2>$null | Out-String
  if (-not $staged) { exit 0 }

  # password = "value" | api_key: 'value' | access_token=... (8+ chars)
  $re = '(?i)(password|passwd|secret|api[_-]?key|api[_-]?secret|access[_-]?key|private[_-]?key|auth[_-]?token|client[_-]?secret)\s*[:=]\s*["'']?[^\s"'']{8,}'
  if ($staged -match $re) {
    [Console]::Error.WriteLine("BLOCKED: possible hardcoded secret in staged changes. Review 'git diff --cached' and move it to env/secret manager.")
    exit 2
  }
  exit 0
} catch { exit 0 }
