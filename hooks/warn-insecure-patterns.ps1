# PreToolUse(Edit|Write|MultiEdit) — warn on insecure code patterns by asking the user
# to confirm before the write. Non-blocking: emits permissionDecision "ask".
# Any error = exit 0 (never break the session).
$ErrorActionPreference = 'Stop'
try {
  $raw = [Console]::In.ReadToEnd()
  if (-not $raw) { exit 0 }
  $j = $raw | ConvertFrom-Json
  $ti = $j.tool_input

  # Gather the text being written across Write/Edit/MultiEdit shapes.
  $parts = @()
  if ($ti.content)    { $parts += [string]$ti.content }
  if ($ti.new_string) { $parts += [string]$ti.new_string }
  if ($ti.edits)      { foreach ($e in $ti.edits) { if ($e.new_string) { $parts += [string]$e.new_string } } }
  $text = ($parts -join "`n")
  if (-not $text) { exit 0 }

  $hits = @()
  if ($text -match '(?i)Access-Control-Allow-Origin\s*["'':,]?\s*\*') { $hits += 'wildcard CORS (Access-Control-Allow-Origin: *)' }
  if ($text -match '(?i)localStorage\.setItem\(\s*["''][^"'']*(token|jwt|secret|password)') { $hits += 'sensitive token stored in localStorage (prefer HttpOnly cookie)' }
  if ($text -match '(?i)(^|[^.\w])eval\s*\(') { $hits += 'eval() - code execution risk' }
  if ($text -match '(?i)dangerouslySetInnerHTML') { $hits += 'dangerouslySetInnerHTML - XSS risk, sanitize input' }
  if ($text -match '(?i)(md5|sha1)\s*\(.*(pass|pwd|secret)') { $hits += 'weak hash (md5/sha1) for secret - use bcrypt/argon2' }

  if ($hits.Count -gt 0) {
    $reason = "Insecure pattern(s) detected: " + ($hits -join '; ') + ". Confirm this is intentional."
    $out = @{
      hookSpecificOutput = @{
        hookEventName            = 'PreToolUse'
        permissionDecision       = 'ask'
        permissionDecisionReason = $reason
      }
    } | ConvertTo-Json -Compress -Depth 5
    [Console]::Out.WriteLine($out)
    exit 0
  }
  exit 0
} catch { exit 0 }
