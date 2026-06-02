#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$IP = '192.168.0.12'

# 1. Install mkcert if not present
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando mkcert..." -ForegroundColor Cyan
    winget install --id FiloSottile.mkcert --silent --accept-package-agreements
    refreshenv
}

# 2. Install local CA
Write-Host "Instalando CA local..." -ForegroundColor Cyan
mkcert -install

# 3. Generate cert for IP + localhost
Write-Host "Generando certificado para $IP ..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
mkcert $IP localhost 127.0.0.1

# 4. Rename to expected names
$files = Get-ChildItem -Path "$PSScriptRoot" -Filter "$IP+*"
$pem = $files | Where-Object { $_.Name -notmatch '-key' } | Select-Object -First 1
$key = $files | Where-Object { $_.Name -match '-key' } | Select-Object -First 1
if ($pem -and $key) {
    Move-Item -LiteralPath $pem.FullName -Destination "$PSScriptRoot\server.pem" -Force
    Move-Item -LiteralPath $key.FullName -Destination "$PSScriptRoot\server-key.pem" -Force
    Write-Host "Certificados generados correctamente!" -ForegroundColor Green
} else {
    Write-Host "Error: No se encontraron los archivos generados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Para iniciar el frontend con HTTPS:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  python serve.py 4200 dist/frontend/browser" -ForegroundColor White
Write-Host ""
Write-Host "Luego en tu celular accede a:" -ForegroundColor Yellow
Write-Host "  https://$IP`:4200" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: El navegador mostrará advertencia de riesgo." -ForegroundColor Gray
Write-Host "Presiona 'Avanzado' y luego 'Proceder a $IP (no seguro)'" -ForegroundColor Gray
