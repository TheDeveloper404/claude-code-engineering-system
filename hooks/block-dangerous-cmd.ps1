# PreToolUse(Bash) — block irreversible / destructive shell commands.
# Exit 2 = block. Any error = exit 0.
$ErrorActionPreference = 'Stop'
try {
  $raw = [Console]::In.ReadToEnd()
  if (-not $raw) { exit 0 }
  $j = $raw | ConvertFrom-Json
  $cmd = [string]$j.tool_input.command
  if (-not $cmd) { exit 0 }

  $patterns = @(
    'rm\s+-rf?\s+(/|~|\$HOME)(\s|$)',          # rm -rf / | ~ | $HOME
    'rm\s+-[a-z]*r[a-z]*f.*\s/\*',             # rm -rf /*
    '(?i)Remove-Item\s+.*-Recurse.*\s[A-Za-z]:\\(\s|$|")', # Remove-Item -Recurse C:\
    '(?i)\bformat\s+[A-Za-z]:',                # format C: (drive letter, not --format)
    '(?i)\bmkfs(\.\w+)?\s+/dev/',              # mkfs /dev/...
    '(?i)git\s+reset\s+--hard\b',              # destructive reset
    '(?i)git\s+clean\s+-[a-z]*f[a-z]*d',       # git clean -fd(x)
    '(?i)git\s+push\b.*--force\b(?!-with-lease)', # force push (not lease)
    '>\s*/dev/sd[a-z]',                        # write to raw disk
    '\bdd\s+.*of=/dev/sd[a-z]',                # dd to disk
    '(?i)\bDROP\s+(DATABASE|SCHEMA)\b',        # drop database
    '(?i)\bTRUNCATE\s+TABLE\b',                # truncate
    '(?i)drizzle-kit\s+(push|migrate)\b',      # Drizzle schema push/migrate from terminal
    '(?i)\b(npm|pnpm|yarn|bun)\s+run\s+db:(push|migrate)\b', # db:push/db:migrate script alias
    ':\(\)\s*\{\s*:\|:&\s*\}'                  # fork bomb
  )
  foreach ($p in $patterns) {
    if ($cmd -match $p) {
      [Console]::Error.WriteLine("BLOCKED: dangerous/irreversible command detected (matched: $p). If truly intended, run it manually outside the agent.")
      exit 2
    }
  }
  exit 0
} catch { exit 0 }
