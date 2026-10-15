$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiRoot = Join-Path $projectRoot 'backend/honeybee-api'
if (-not (Test-Path -LiteralPath (Join-Path $apiRoot 'target/honeybee-api-1.0.0.jar'))) {
    throw 'Build the backend first: cd backend/honeybee-api; mvn clean package'
}
& (Join-Path $PSScriptRoot 'Test-Database.ps1')
$env:ADMIN_USERNAME = Read-Host 'Choose an admin username (3–100 letters, digits, _, ., -)'
$env:ADMIN_EMAIL = Read-Host 'Admin email'
$securePassword = Read-Host 'Unique admin password (at least 8 characters, at most 72 UTF-8 bytes)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & java -jar (Join-Path $apiRoot 'target/honeybee-api-1.0.0.jar') --spring.profiles.active=bootstrap
    if ($LASTEXITCODE -ne 0) { throw 'Administrator initialization failed. Review the validation message above.' }
    Write-Host 'Administrator initialized. Start the API normally, then open /login.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_USERNAME -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
}
