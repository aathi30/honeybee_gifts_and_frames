$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot 'Test-Database.ps1')
Push-Location (Join-Path $projectRoot 'backend/honeybee-api')
try {
    & mvn spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'Backend startup failed. Inspect the final Caused by message in the output.' }
} finally { Pop-Location }
