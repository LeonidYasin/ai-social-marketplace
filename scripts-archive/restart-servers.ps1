# Скрипт для корректного перезапуска серверов
Write-Host "Перезапуск серверов..." -ForegroundColor Yellow

# Остановка всех процессов Node.js
Write-Host "Останавливаем все процессы Node.js..." -ForegroundColor Red
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "Останавливаем процесс: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "Все процессы Node.js остановлены" -ForegroundColor Green
} else {
    Write-Host "Процессы Node.js не найдены" -ForegroundColor Blue
}

# Ждем немного для полной остановки
Write-Host "Ждем 3 секунды..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Проверяем, что все процессы остановлены
$remainingProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($remainingProcesses) {
    Write-Host "Некоторые процессы Node.js все еще работают:" -ForegroundColor Yellow
    $remainingProcesses | ForEach-Object {
        Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
    Write-Host "Попытка принудительной остановки..." -ForegroundColor Yellow
    $remainingProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Запуск серверов
Write-Host "Запускаем серверы..." -ForegroundColor Green

# Запуск backend
Write-Host "Запуск backend сервера..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal

# Ждем немного перед запуском frontend
Start-Sleep -Seconds 3

# Запуск frontend
Write-Host "Запуск frontend сервера..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal

# Ждем немного для запуска
Start-Sleep -Seconds 5

# Проверяем статус
Write-Host "Проверяем статус серверов..." -ForegroundColor Yellow
$runningProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($runningProcesses) {
    Write-Host "Серверы запущены:" -ForegroundColor Green
    $runningProcesses | ForEach-Object {
        Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "Серверы не запущены" -ForegroundColor Red
}

Write-Host "Перезапуск завершен!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Blue 