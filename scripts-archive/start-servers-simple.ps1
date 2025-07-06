# Простой скрипт для запуска серверов с предварительной остановкой
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Запуск серверов..." -ForegroundColor Green

# Функция для остановки процессов по портам
function Stop-ProcessesOnPorts {
    param([int[]]$ports)
    
    foreach ($port in $ports) {
        $processes = netstat -ano | Select-String ":${port}\s" | ForEach-Object {
            ($_ -split '\s+')[-1]
        }
        
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                try {
                    Write-Host "Останавливаю процесс на порту $port (PID: $processId)" -ForegroundColor Red
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                } catch {
                    Write-Host "Не удалось остановить процесс $processId" -ForegroundColor Yellow
                }
            }
        }
    }
}

# Остановить старые процессы
Write-Host "Останавливаю старые процессы..." -ForegroundColor Yellow
Stop-ProcessesOnPorts @(3000, 5000, 8000)
Start-Sleep -Seconds 2

# Запуск backend
Start-Process powershell -ArgumentList "-Command", "cd backend; npm start" -WindowStyle Normal

# Пауза
Start-Sleep -Seconds 2

# Запуск frontend
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm start" -WindowStyle Normal

Write-Host "Серверы запущены" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan 