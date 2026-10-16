$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$python = Join-Path $backendDir '.venv\Scripts\python.exe'
$apiUrl = 'http://127.0.0.1:8000'
$webUrl = 'http://127.0.0.1:5173'
$tempPath = [System.IO.Path]::GetTempPath()

if (-not (Test-Path $python)) {
    & py -3.12 -m venv (Join-Path $backendDir '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the project virtual environment. Install Python 3.12 and retry.' }
}

& $python -m pip --version *> $null
if ($LASTEXITCODE -ne 0) {
    & py -3.12 -m venv --upgrade (Join-Path $backendDir '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Could not repair the project virtual environment. Install Python 3.12 and retry.' }
}

& $python -c 'import fastapi, uvicorn, multipart, openai, pypdf, docx' 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Installing backend dependencies in VERITY\backend\.venv...'
    & $python -m pip install -r (Join-Path $backendDir 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
}

if (-not (Test-Path (Join-Path $frontendDir 'node_modules\vite'))) {
    Write-Host 'Installing frontend dependencies in VERITY\frontend...'
    Push-Location $frontendDir
    try { & npm.cmd install; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' } }
    finally { Pop-Location }
}

$apiHealthy = $false
try { $apiHealthy = (Invoke-RestMethod "$apiUrl/api/health" -TimeoutSec 2).status -eq 'ok' } catch { }
if (-not $apiHealthy) {
    $apiListener = @(Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue)
    if ($apiListener.Count -gt 0) { throw 'Port 8000 is occupied by another process. Stop it or change the API port before starting VERITY.' }
    Start-Process -FilePath $python `
        -ArgumentList @('-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000') `
        -WorkingDirectory $backendDir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $tempPath 'verity-api.stdout.log') `
        -RedirectStandardError (Join-Path $tempPath 'verity-api.stderr.log') | Out-Null
}

$webHealthy = $false
try { $webHealthy = (Invoke-WebRequest $webUrl -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { }
if (-not $webHealthy) {
    $webListener = @(Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)
    if ($webListener.Count -gt 0) { throw 'Port 5173 is occupied by another process. Stop it or change the frontend port before starting VERITY.' }
    Start-Process -FilePath 'npm.cmd' `
        -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1') `
        -WorkingDirectory $frontendDir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $tempPath 'verity-web.stdout.log') `
        -RedirectStandardError (Join-Path $tempPath 'verity-web.stderr.log') | Out-Null
}

$apiReady = $false
$webReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try { $apiReady = (Invoke-RestMethod "$apiUrl/api/health" -TimeoutSec 2).status -eq 'ok' } catch { }
    try { $webReady = (Invoke-WebRequest $webUrl -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { }
    if ($apiReady -and $webReady) { break }
    Start-Sleep -Seconds 1
}

if (-not $apiReady) { throw "VERITY API did not start. Check $tempPath\verity-api.stderr.log" }
if (-not $webReady) { throw "VERITY frontend did not start. Check $tempPath\verity-web.stderr.log" }

Write-Host "VERITY is ready: $webUrl"
Write-Host "API health: $apiUrl/api/health"
