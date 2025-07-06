# Простой и надежный скрипт запуска серверов
Write-Host "=== Starting All Servers (Simple Version) ===" -ForegroundColor Green
Write-Host ""

# Шаг 1: Останавливаем все существующие процессы
Write-Host "Step 1: Stopping existing processes..." -ForegroundColor Yellow

# Останавливаем Node.js процессы
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes, stopping them..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 3
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Gray
}

# Проверяем и освобождаем порты
Write-Host ""
Write-Host "Step 2: Checking ports..." -ForegroundColor Yellow

$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "Port 8000 is busy, stopping processes..." -ForegroundColor Red
    $port8000 | ForEach-Object { 
        if ($_.OwningProcess -ne 0) {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

if ($port3000) {
    Write-Host "Port 3000 is busy, stopping processes..." -ForegroundColor Red
    $port3000 | ForEach-Object { 
        if ($_.OwningProcess -ne 0) {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Финальная проверка портов
$port8000Final = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000Final = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000Final) {
    Write-Host "WARNING: Port 8000 is still busy!" -ForegroundColor Red
} else {
    Write-Host "Port 8000 is free" -ForegroundColor Green
}

if ($port3000Final) {
    Write-Host "WARNING: Port 3000 is still busy!" -ForegroundColor Red
} else {
    Write-Host "Port 3000 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Starting servers..." -ForegroundColor Yellow

# Запускаем backend
Write-Host "Starting Backend..." -ForegroundColor Cyan
Set-Location backend
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "node src/app.js" -WindowStyle Normal -PassThru
Write-Host "Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
Set-Location ..

# Ждем немного для запуска backend
Start-Sleep -Seconds 5

# Запускаем frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Set-Location frontend
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal -PassThru
Write-Host "Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "Step 4: Final verification..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Проверяем порты
$backendPort = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($backendPort) {
    Write-Host "✅ Backend running on port 8000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend not running on port 8000" -ForegroundColor Red
}

if ($frontendPort) {
    Write-Host "✅ Frontend running on port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend not running on port 3000" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Startup Complete ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000/api" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Servers are running in separate windows." -ForegroundColor Yellow 