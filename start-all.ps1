# Запуск backend
Start-Process powershell -ArgumentList "cd backend; npm install; npm run dev" -NoNewWindow

# Запуск frontend
Start-Process powershell -ArgumentList "cd frontend; npm install; npm start" -NoNewWindow

Write-Host "Backend и frontend запускаются в отдельных окнах."
Write-Host "Проверьте консоли для вывода ошибок." 