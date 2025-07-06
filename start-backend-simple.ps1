# Простой запуск backend в текущем окне
Write-Host "=== Starting Backend (Simple Mode) ===" -ForegroundColor Green
Write-Host "This will show all output in this window" -ForegroundColor Yellow
Write-Host ""

# Останавливаем существующие процессы
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Проверяем, что порт 8000 свободен
$portCheck = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "WARNING: Port 8000 is still in use!" -ForegroundColor Red
    Write-Host "Processes using port 8000:" -ForegroundColor Red
    $portCheck | ForEach-Object { 
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  PID: $($_.OwningProcess), Name: $($process.ProcessName)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Starting backend..." -ForegroundColor Green
Write-Host "You should see startup messages below:" -ForegroundColor Yellow
Write-Host ""

# Переходим в папку backend и запускаем сервер напрямую
Set-Location backend
node src/app.js 