param(
    [string]$EnvFile = (Join-Path (Split-Path -Parent $PSScriptRoot) 'backend/honeybee-api/.env'),
    [string]$PsqlPath
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'Import-Env.ps1') -Path $EnvFile
foreach ($name in @('DATABASE_URL', 'DATABASE_USERNAME', 'DATABASE_PASSWORD')) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value) -or $value -match '^(REPLACE_|YOUR_)') {
        throw "Set $name to your actual PostgreSQL value in $EnvFile. No password is configured automatically."
    }
}
if ($env:DATABASE_URL -notmatch '^jdbc:postgresql://([^/:?]+):(\d+)/([^?]+)$') {
    throw 'For localhost, use DATABASE_URL=jdbc:postgresql://localhost:5432/honeybee.'
}
$dbHost = $Matches[1]
$dbPort = $Matches[2]
$dbName = $Matches[3]
if (-not $PsqlPath) {
    $command = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($command) { $PsqlPath = $command.Source }
    else {
        foreach ($version in @('18', '17', '16')) {
            $candidate = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
            if (Test-Path -LiteralPath $candidate) { $PsqlPath = $candidate; break }
        }
    }
}
if (-not $PsqlPath -or -not (Test-Path -LiteralPath $PsqlPath)) {
    throw 'psql.exe was not found. Add your PostgreSQL bin folder to PATH or pass -PsqlPath.'
}
$previousPassword = [Environment]::GetEnvironmentVariable('PGPASSWORD', 'Process')
$previousTimeout = [Environment]::GetEnvironmentVariable('PGCONNECT_TIMEOUT', 'Process')
try {
    $env:PGPASSWORD = $env:DATABASE_PASSWORD
    $env:PGCONNECT_TIMEOUT = '5'
    & $PsqlPath -X -w -h $dbHost -p $dbPort -U $env:DATABASE_USERNAME -d $dbName -v ON_ERROR_STOP=1 -c "SELECT current_database() AS database, current_user AS username, has_schema_privilege(current_user, 'public', 'USAGE') AS schema_usage, has_schema_privilege(current_user, 'public', 'CREATE') AS schema_create;"
    if ($LASTEXITCODE -ne 0) {
        throw 'PostgreSQL connection failed. Read the psql error above and the README troubleshooting steps. Flyway and existing data were not changed.'
    }
    Write-Host 'PostgreSQL connection succeeded. Flyway will validate/apply migrations when the backend starts.'
} finally {
    [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPassword, 'Process')
    [Environment]::SetEnvironmentVariable('PGCONNECT_TIMEOUT', $previousTimeout, 'Process')
}
