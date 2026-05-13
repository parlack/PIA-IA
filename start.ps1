param(
    [switch]$Mobile
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cartilla de Vacunacion Digital PIA-IA"   -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:8000"        -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000"        -ForegroundColor Yellow
Write-Host "  Swagger:  http://localhost:8000/docs"   -ForegroundColor Yellow
if ($Mobile) {
    Write-Host "  Mobile:   Expo (escanea el QR)"     -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Tip: usa .\start.ps1 -Mobile para incluir la app movil." -ForegroundColor DarkGray
Write-Host "  Presiona Ctrl+C o ENTER para detener todo." -ForegroundColor DarkGray
Write-Host ""

$projectRoot = $PSScriptRoot

$backend = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$projectRoot\backend'; python -m uvicorn main:app --reload --port 8000" -PassThru -WindowStyle Normal

$frontend = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$projectRoot\frontend'; npm run dev" -PassThru -WindowStyle Normal

$mobile = $null
if ($Mobile) {
    $mobile = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$projectRoot\mobile'; npm start" -PassThru -WindowStyle Normal
}

Write-Host "[OK] Backend  PID: $($backend.Id)" -ForegroundColor Green
Write-Host "[OK] Frontend PID: $($frontend.Id)" -ForegroundColor Green
if ($mobile) {
    Write-Host "[OK] Mobile   PID: $($mobile.Id)" -ForegroundColor Green
}
Write-Host ""

try {
    Write-Host "Procesos corriendo. Presiona ENTER para detener..." -ForegroundColor DarkGray
    Read-Host | Out-Null
}
finally {
    Write-Host ""
    Write-Host "Deteniendo procesos..." -ForegroundColor Red

    if (!$backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  Backend detenido."  -ForegroundColor DarkGray
    }
    if (!$frontend.HasExited) {
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  Frontend detenido." -ForegroundColor DarkGray
    }
    if ($mobile -and !$mobile.HasExited) {
        Stop-Process -Id $mobile.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  Mobile detenido." -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "Listo. Hasta pronto." -ForegroundColor Green
}
