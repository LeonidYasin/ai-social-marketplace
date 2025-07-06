# Скрипт для последовательного запуска с предварительной остановкой
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=== Последовательный запуск серверов ===" -ForegroundColor Green

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

Write-Host "=== Установка и запуск backend ===" -ForegroundColor Cyan
cd backend
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Ошибка установки зависимостей backend" -ForegroundColor Red
    exit 1 
}

# Запуск backend в отдельном окне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
cd ..

Start-Sleep -Seconds 3

Write-Host "=== Установка и запуск frontend ===" -ForegroundColor Cyan
cd frontend
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Ошибка установки зависимостей frontend" -ForegroundColor Red
    exit 1 
}

# Запуск frontend в отдельном окне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"
cd ..

Write-Host "Серверы запущены в отдельных окнах!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan 