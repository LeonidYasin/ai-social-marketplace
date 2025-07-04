# Простой скрипт для запуска серверов
Write-Host "Запуск серверов..." -ForegroundColor Green

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