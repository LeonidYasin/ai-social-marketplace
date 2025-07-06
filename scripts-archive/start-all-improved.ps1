# Улучшенный скрипт запуска всех серверов
Write-Host "=== Starting All Servers (Improved) ===" -ForegroundColor Green
Write-Host ""

# Останавливаем существующие процессы
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
} catch {
    Write-Host "Warning: Could not stop some processes" -ForegroundColor Yellow
}

# Проверяем порты
Write-Host "Checking ports..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "WARNING: Port 8000 is still busy!" -ForegroundColor Red
}
if ($port3000) {
    Write-Host "WARNING: Port 3000 is still busy!" -ForegroundColor Red
}

Write-Host ""

# Запускаем backend
Write-Host "=== Starting Backend ===" -ForegroundColor Cyan
Set-Location backend

try {
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node src/app.js
    }
    
    # Ждем стартовых сообщений
    $timeout = 15
    $elapsed = 0
    $started = $false
    
    while ($elapsed -lt $timeout -and -not $started) {
        Start-Sleep -Seconds 1
        $elapsed++
        
        $output = Receive-Job -Job $backendJob -Keep
        if ($output) {
            foreach ($line in $output) {
                Write-Host $line -ForegroundColor White
                if ($line -match "Backend initialization completed successfully") {
                    $started = $true
                    break
                }
            }
        }
        
        if ($elapsed % 3 -eq 0) {
            Write-Host "Waiting for backend... ($elapsed/$timeout)" -ForegroundColor Gray
        }
    }
    
    if ($started) {
        Write-Host "✅ Backend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend startup timeout!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Failed to start backend: $($_.Exception.Message)" -ForegroundColor Red
}

Set-Location ..

# Запускаем frontend
Write-Host ""
Write-Host "=== Starting Frontend ===" -ForegroundColor Cyan
Set-Location frontend

try {
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    
    # Ждем стартовых сообщений
    $timeout = 30
    $elapsed = 0
    $started = $false
    
    while ($elapsed -lt $timeout -and -not $started) {
        Start-Sleep -Seconds 1
        $elapsed++
        
        $output = Receive-Job -Job $frontendJob -Keep
        if ($output) {
            foreach ($line in $output) {
                Write-Host $line -ForegroundColor White
                if ($line -match "Compiled successfully" -or $line -match "Local:.*http://localhost:3000") {
                    $started = $true
                    break
                }
            }
        }
        
        if ($elapsed % 5 -eq 0) {
            Write-Host "Waiting for frontend... ($elapsed/$timeout)" -ForegroundColor Gray
        }
    }
    
    if ($started) {
        Write-Host "✅ Frontend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend startup timeout!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Failed to start frontend: $($_.Exception.Message)" -ForegroundColor Red
}

Set-Location ..

# Финальная проверка
Write-Host ""
Write-Host "=== Final Status Check ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2

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
Write-Host "Jobs are running in background. Use Get-Job to see them." -ForegroundColor Yellow 