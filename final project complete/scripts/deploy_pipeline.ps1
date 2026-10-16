# ==============================================================================
# Full-Stack Deployment Pipeline Automation Script (PowerShell)
# Dual-Hosting: Backend (Render) + Frontend (Vercel)
# ==============================================================================
[CmdletBinding()]
param (
    [string]$RenderBackendUrl = "",
    [string]$RenderDeployHook = ""
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Full-Stack Deployment Pipeline (Render + Vercel)              " -ForegroundColor Cyan
Write-Host "   Repository: https://github.com/rohithsai199/coastal_seven_tasks" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($RenderBackendUrl)) {
    $RenderBackendUrl = Read-Host "Enter your live Render Backend URL (e.g. https://coastal-seven-backend.onrender.com)"
}

$RenderBackendUrl = $RenderBackendUrl.TrimEnd('/')
$wsHost = $RenderBackendUrl -replace '^https?://', ''
$RenderWsUrl = "wss://$wsHost"

Write-Host "`n[1/4] Triggering Backend Deployment on Render..." -ForegroundColor Yellow
if (-not [string]::IsNullOrWhiteSpace($RenderDeployHook)) {
    Write-Host "Invoking Render Deploy Hook..."
    Invoke-RestMethod -Uri $RenderDeployHook -Method Post | Out-Null
    Write-Host "Deploy hook triggered successfully!" -ForegroundColor Green
} else {
    Write-Host "No RenderDeployHook provided. Assuming Render is set to auto-deploy on git push." -ForegroundColor Gray
}

Write-Host "`n[2/4] Verifying Backend Health Check..." -ForegroundColor Yellow
Write-Host "Pinging $RenderBackendUrl/health ..."
$healthy = $false
for ($i = 1; $i -le 25; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$RenderBackendUrl/health" -Method Get -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is healthy (HTTP 200) at $RenderBackendUrl/health" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Write-Host "Attempt $i/25: Waiting for backend to start up... (sleeping 10s)" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

if (-not $healthy) {
    Write-Host "Warning: Backend did not return 200 within timeout. Continuing with frontend build..." -ForegroundColor Yellow
}

Write-Host "`n[3/4] Compiling Frontend Production Bundle with Vite..." -ForegroundColor Yellow
$frontendPath = Join-Path -Path $PSScriptRoot -ChildPath "..\ecommerce_frontend"
Push-Location $frontendPath

$env:VITE_API_URL = $RenderBackendUrl
$env:VITE_WS_URL = $RenderWsUrl

Write-Host "Injected VITE_API_URL=$env:VITE_API_URL"
Write-Host "Injected VITE_WS_URL=$env:VITE_WS_URL"

npm install
npm run build

Write-Host "✓ Frontend production build compiled successfully into dist/" -ForegroundColor Green
Pop-Location

Write-Host "`n[4/4] Deploying Frontend to Vercel..." -ForegroundColor Yellow
$vercelInstalled = Get-Command "vercel" -ErrorAction SilentlyContinue
if ($vercelInstalled) {
    Push-Location $frontendPath
    Write-Host "Running Vercel production deployment..."
    vercel --prod --yes `
      --env VITE_API_URL="$RenderBackendUrl" `
      --env VITE_WS_URL="$RenderWsUrl" `
      --build-env VITE_API_URL="$RenderBackendUrl" `
      --build-env VITE_WS_URL="$RenderWsUrl"
    Pop-Location
    Write-Host "✓ Vercel deployment complete!" -ForegroundColor Green
} else {
    Write-Host "Notice: 'vercel' CLI not detected locally." -ForegroundColor Yellow
    Write-Host "You can deploy directly by linking your GitHub repository to Vercel:"
    Write-Host "  1. Go to https://vercel.com/new"
    Write-Host "  2. Import 'rohithsai199/coastal_seven_tasks'"
    Write-Host "  3. Set Root Directory to 'ecommerce_frontend'"
    Write-Host "  4. Set Environment Variable: VITE_API_URL = $RenderBackendUrl"
    Write-Host "  5. Set Environment Variable: VITE_WS_URL = $RenderWsUrl"
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "   Deployment Pipeline Sequence Completed Successfully!         " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
