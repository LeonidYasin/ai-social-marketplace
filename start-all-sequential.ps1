Write-Host "=== Установка и запуск backend ==="
cd backend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Ошибка установки зависимостей backend"; exit 1 }
npm run dev
if ($LASTEXITCODE -ne 0) { Write-Host "Ошибка запуска backend"; exit 1 }
cd ..

Write-Host "=== Установка и запуск frontend ==="
cd frontend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Ошибка установки зависимостей frontend"; exit 1 }
npm start
if ($LASTEXITCODE -ne 0) { Write-Host "Ошибка запуска frontend"; exit 1 } 