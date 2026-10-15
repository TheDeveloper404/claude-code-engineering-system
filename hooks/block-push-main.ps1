# PreToolUse(Bash) — forbid direct push to main/master anywhere.
# Exit 2 = block. Any error = exit 0.
$ErrorActionPreference = 'Stop'
try {
  $raw = [Console]::In.ReadToEnd()
  if (-not $raw) { exit 0 }
  $j = $raw | ConvertFrom-Json
  $cmd = [string]$j.tool_input.command
  if (-not $cmd) { exit 0 }

  if ($cmd -notmatch '(?i)git\s+push\b') { exit 0 }

  if ($cmd -match '(?i)git\s+push\b.*\b(origin\s+)?(main|master)\b') {
    [Console]::Error.WriteLine("BLOCKED: direct push to main/master is forbidden. Create a branch and open a PR.")
    exit 2
  }

  # Bare push (no branch named): `git push`, `git push origin`, with common flags —
  # pushes whatever the CURRENT branch is via the tracked upstream. Strip known
  # flags/remote name; if nothing branch-like is left, resolve the current branch
  # and check IT directly instead of trusting the command text.
  $rest = $cmd -replace '(?i)^.*?git\s+push\b', ''
  $stripped = $rest -replace '(?i)(--force-with-lease(=\S+)?|--force\b|-f\b|-u\b|--set-upstream\b|--no-verify\b|--quiet\b|-q\b|--verbose\b|-v\b|--tags\b|origin\b)', ''
  $stripped = $stripped.Trim()
  if ($stripped -eq '' -or $stripped -match '^[;&|]') {
    $branch = ''
    try { $branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim() } catch { $branch = '' }
    if ($branch -eq 'main' -or $branch -eq 'master') {
      [Console]::Error.WriteLine("BLOCKED: bare 'git push' on branch '$branch' pushes directly to main/master. Create a branch and open a PR.")
      exit 2
    }
  }

  exit 0
} catch { exit 0 }
