# PowerShell скрипт для запуска backend и frontend
Write-Host "Запуск backend и frontend..." -ForegroundColor Green

# Запуск backend в новом окне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Небольшая пауза
Start-Sleep -Seconds 2

# Запуск frontend в новом окне  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal

Write-Host "Серверы запущены в отдельных окнах PowerShell" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan 