# Устанавливаем кодировку консоли для Windows (windows-1251)
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
[Console]::InputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
chcp 1251

# Простой скрипт для запуска серверов с предварительной остановкой
Write-Host "Запуск серверов..." -ForegroundColor Green

# Функция для остановки процессов по портам
function Stop-ProcessesOnPorts {
    param([int[]]$ports)
    
    foreach ($port in $ports) {
        $processes = netstat -ano | Select-String ":$port\s" | ForEach-Object {
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

# Остановить процессы на портах 3000 (frontend) и 5000/8000 (backend)
Write-Host "Останавливаю старые процессы..." -ForegroundColor Yellow
Stop-ProcessesOnPorts @(3000, 5000, 8000)

# Пауза для завершения процессов
Start-Sleep -Seconds 2

# Запуск backend
Write-Host "Запуск backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Пауза
Start-Sleep -Seconds 3

# Запуск frontend
Write-Host "Запуск frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "Серверы запущены!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan 