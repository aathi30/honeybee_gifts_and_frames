param([Parameter(Mandatory=$true)][string]$Path)
if (-not (Test-Path -LiteralPath $Path)) { throw "Environment file not found: $Path" }
Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $pair = $line.Split('=', 2)
        if ($pair.Count -ne 2 -or $pair[0] -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw 'Invalid environment file entry.' }
        [Environment]::SetEnvironmentVariable($pair[0], $pair[1], 'Process')
    }
}
