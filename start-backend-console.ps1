# Скрипт для запуска backend в текущем окне консоли
# Это позволит видеть стартовые сообщения

Write-Host "=== Starting Backend in Console Mode ===" -ForegroundColor Cyan
Write-Host "This will show all startup messages in this window" -ForegroundColor Yellow
Write-Host ""

# Проверяем, что мы в корневой папке проекта
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: backend folder not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Останавливаем существующие процессы на порту 8000
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }
foreach ($process in $processes) {
    try {
        $proc = Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Stopping process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Gray
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "  Failed to stop process: $($process.OwningProcess)" -ForegroundColor Red
    }
}

# Ждем освобождения порта
Write-Host "Waiting for port 8000 to be free..." -ForegroundColor Yellow
$waitCount = 0
while ((Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }).Count -gt 0 -and $waitCount -lt 10) {
    Start-Sleep -Seconds 1
    $waitCount++
    Write-Host "  Waiting... ($waitCount/10)" -ForegroundColor Gray
}

if ((Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }).Count -gt 0) {
    Write-Host "WARNING: Port 8000 may still be in use!" -ForegroundColor Red
}

# Создаем папку для логов если её нет
if (-not (Test-Path "backend/logs")) {
    New-Item -ItemType Directory -Path "backend/logs" -Force | Out-Null
    Write-Host "Created logs directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
Write-Host "You should see startup messages below:" -ForegroundColor Yellow
Write-Host ""

# Переходим в папку backend и запускаем сервер
Set-Location backend
try {
    Write-Host "Starting backend..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Запускаем напрямую в текущем окне
    node src/app.js
    
} catch {
    Write-Host "ERROR: Failed to start backend!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Возвращаемся в корневую папку
Set-Location .. 