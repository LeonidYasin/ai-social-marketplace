# Устанавливаем кодировку консоли для Windows (windows-1251 для правильного отображения кириллицы)
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
[Console]::InputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
chcp 1251

# PowerShell script to restart backend and frontend with full verification
Write-Host "=== Starting Backend and Frontend with Full Verification ===" -ForegroundColor Green

# Функция для проверки занятости порта (игнорируя системные процессы)
function Test-PortInUse {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    # Фильтруем только реальные процессы (не системные Idle)
    $realConnections = $connections | Where-Object { $_.OwningProcess -ne 0 }
    return $realConnections.Count -gt 0
}

# Функция для остановки процессов на порту
function Stop-ProcessesOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Stopping $ServiceName processes on port $Port..." -ForegroundColor Yellow
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    $stoppedCount = 0
    
    foreach ($processId in $processes) {
        try {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped $ServiceName process (PID: $processId, Name: $($process.ProcessName))" -ForegroundColor Red
                $stoppedCount++
            }
        } catch {
            Write-Host "  Failed to stop process on port $Port (PID: $processId)" -ForegroundColor Yellow
        }
    }
    
    if ($stoppedCount -eq 0) {
        Write-Host "  No $ServiceName processes found on port $Port" -ForegroundColor Gray
    }
    
    return $stoppedCount
}

# Функция для остановки процессов по ключевому слову
function Stop-ProcessesByKeyword {
    param([string]$Keyword, [string]$ServiceName)
    
    Write-Host "Stopping $ServiceName processes by keyword '$Keyword'..." -ForegroundColor Yellow
    
    $processes = Get-Process -Name $Keyword -ErrorAction SilentlyContinue
    $stoppedCount = 0
    
    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped $ServiceName process (PID: $($process.Id))" -ForegroundColor Red
            $stoppedCount++
        } catch {
            Write-Host "  Failed to stop $ServiceName process (PID: $($process.Id))" -ForegroundColor Yellow
        }
    }
    
    if ($stoppedCount -eq 0) {
        Write-Host "  No $ServiceName processes found" -ForegroundColor Gray
    }
    
    return $stoppedCount
}

# Функция для ожидания освобождения порта с подробным выводом
function Wait-PortFree {
    param([int]$Port, [string]$ServiceName, [int]$MaxWaitSeconds = 30)
    
    Write-Host "Waiting for $ServiceName port $Port to be free..." -ForegroundColor Yellow
    $waitCount = 0
    
    while (Test-PortInUse -Port $Port -and $waitCount -lt $MaxWaitSeconds) {
        # Выводим информацию только о реальных процессах, держащих порт
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        $realConnections = $connections | Where-Object { $_.OwningProcess -ne 0 }
        
        if ($realConnections.Count -gt 0) {
            foreach ($conn in $realConnections) {
                $procId = $conn.OwningProcess
                try {
                    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                    if ($proc) {
                        Write-Host "  Port $Port held by PID: $procId, Name: $($proc.ProcessName)" -ForegroundColor Magenta
                    } else {
                        Write-Host "  Port $Port held by PID: $procId (process info not found)" -ForegroundColor Magenta
                    }
                } catch {
                    Write-Host "  Port $Port held by PID: $procId (error getting process info)" -ForegroundColor Magenta
                }
            }
        } else {
            Write-Host "  Port $Port only held by system processes (Idle), safe to proceed" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 1
        $waitCount++
        if ($waitCount % 5 -eq 0) {
            Write-Host "  Still waiting... ($waitCount/$MaxWaitSeconds)" -ForegroundColor Gray
        }
    }
    
    if (Test-PortInUse -Port $Port) {
        Write-Host "  WARNING: Port $Port is still in use after $MaxWaitSeconds seconds! Forcibly killing processes..." -ForegroundColor Red
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        $realConnections = $connections | Where-Object { $_.OwningProcess -ne 0 }
        
        foreach ($conn in $realConnections) {
            $procId = $conn.OwningProcess
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Killing PID: $procId, Name: $($proc.ProcessName)" -ForegroundColor Red
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                } else {
                    Write-Host "  Killing PID: $procId (process info not found)" -ForegroundColor Red
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Failed to kill PID: $procId" -ForegroundColor Yellow
            }
        }
        Start-Sleep -Seconds 2
        if (Test-PortInUse -Port $Port) {
            Write-Host "  ERROR: Port $Port is STILL in use after force kill!" -ForegroundColor Red
            return $false
        } else {
            Write-Host "  Port $Port is now free after force kill" -ForegroundColor Green
            return $true
        }
    } else {
        Write-Host "  Port $Port is now free" -ForegroundColor Green
        return $true
    }
}

# Функция для проверки запуска сервера
function Test-ServerStarted {
    param([int]$Port, [string]$ServiceName, [int]$MaxWaitSeconds = 30)
    
    Write-Host "Checking if $ServiceName started on port $Port..." -ForegroundColor Yellow
    $waitCount = 0
    
    while (-not (Test-PortInUse -Port $Port) -and $waitCount -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds 1
        $waitCount++
        Write-Host "  Waiting for $ServiceName to start... ($waitCount/$MaxWaitSeconds)" -ForegroundColor Gray
    }
    
    if (Test-PortInUse -Port $Port) {
        Write-Host "  $ServiceName is running on port $Port" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ERROR: $ServiceName failed to start on port $Port!" -ForegroundColor Red
        return $false
    }
}

# Функция для проверки HTTP ответа сервера
function Test-ServerResponse {
    param([string]$Url, [string]$ServiceName, [int]$MaxWaitSeconds = 10)
    
    Write-Host "Testing $ServiceName HTTP response at $Url..." -ForegroundColor Yellow
    $waitCount = 0
    
    while ($waitCount -lt $MaxWaitSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  $ServiceName HTTP response: OK (Status: $($response.StatusCode))" -ForegroundColor Green
                return $true
            } else {
                Write-Host "  $ServiceName HTTP response: Unexpected status $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            # Ожидаемо для frontend, который может еще не готов
            if ($ServiceName -eq "Frontend") {
                Write-Host "  $ServiceName not ready yet... ($waitCount/$MaxWaitSeconds)" -ForegroundColor Gray
            } else {
                Write-Host "  $ServiceName HTTP error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        $waitCount++
    }
    
    if ($ServiceName -eq "Backend") {
        Write-Host "  WARNING: $ServiceName HTTP test failed, but server may still be starting..." -ForegroundColor Yellow
        return $true
    } else {
        Write-Host "  WARNING: $ServiceName HTTP test failed" -ForegroundColor Yellow
        return $false
    }
}

# Функция для безопасного чтения логов с правильной кодировкой
function Read-LogFile {
    param([string]$LogPath, [int]$TailLines = 10)
    
    if (-not (Test-Path $LogPath)) {
        return @()
    }
    
    # Пробуем разные кодировки для чтения лога
    $lines = $null
    $encodings = @('UTF8', 'Default', 'ASCII', 'Unicode')
    
    foreach ($encoding in $encodings) {
        try {
            if ($TailLines -gt 0) {
                $lines = Get-Content $LogPath -Tail $TailLines -Encoding $encoding -ErrorAction Stop
            } else {
                $lines = Get-Content $LogPath -Encoding $encoding -ErrorAction Stop
            }
            Write-Host "    Successfully read log with $encoding encoding" -ForegroundColor Gray
            break
        } catch {
            continue
        }
    }
    
    if ($lines -eq $null) {
        Write-Host "    Warning: Could not read log file with any encoding" -ForegroundColor Yellow
        return @()
    }
    
    return $lines
}

# Функция для проверки логов
function Test-LogFiles {
    Write-Host "Checking log files..." -ForegroundColor Yellow
    
    $backendLog = "backend/logs/backend.log"
    $frontendLog = "backend/logs/frontend.log"
    
    if (Test-Path $backendLog) {
        $backendSize = (Get-Item $backendLog).Length
        Write-Host "  Backend log exists: $backendLog (Size: $backendSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "  Backend log not found: $backendLog" -ForegroundColor Yellow
    }
    
    if (Test-Path $frontendLog) {
        $frontendSize = (Get-Item $frontendLog).Length
        Write-Host "  Frontend log exists: $frontendLog (Size: $frontendSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "  Frontend log not found: $frontendLog" -ForegroundColor Yellow
    }
}

# Функция для проверки стартовых сообщений backend в логе
function Test-BackendStartupMessages {
    Write-Host "Checking Backend startup messages in log..." -ForegroundColor Yellow
    
    $backendLog = "backend/logs/backend.log"
    if (-not (Test-Path $backendLog)) {
        Write-Host "  Backend log file not found!" -ForegroundColor Red
        return $false
    }
    
    # Ищем последние стартовые сообщения об успешном запуске
    $startupMessages = @()
    $startupTime = $null
    $startupPort = $null
    
    # Читаем весь лог и ищем последние стартовые сообщения
    $allLogs = Read-LogFile -LogPath $backendLog -TailLines 0
    $startupSequence = @()
    
    for ($i = $allLogs.Count - 1; $i -ge 0; $i--) {
        $line = $allLogs[$i]
        
        # Проверяем, что это строка с временной меткой
        if ($line -match '^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]') {
            $timestampStr = $matches[1]
            
            # Ищем сообщения о запуске
            if ($line -match 'Server started on port (\d+)') {
                $startupTime = $timestampStr
                $startupPort = $matches[1]
                $startupSequence = @($line)
                
                # Ищем связанные сообщения (в пределах 10 строк вперед)
                for ($j = $i + 1; $j -le [Math]::Min($allLogs.Count - 1, $i + 10); $j++) {
                    $relatedLine = $allLogs[$j]
                    if ($relatedLine -match 'API available at' -or 
                        $relatedLine -match 'WebSocket server running' -or
                        $relatedLine -match 'Backend server listening' -or
                        $relatedLine -match 'Backend initialization completed') {
                        $startupSequence += $relatedLine
                    }
                }
                break
            }
        }
    }
    
    if ($startupSequence.Count -gt 0) {
        Write-Host "  [OK] Found backend startup sequence:" -ForegroundColor Green
        
        # Показываем время запуска
        if ($startupTime) {
            $startupDateTime = [DateTime]::ParseExact($startupTime, 'yyyy-MM-ddTHH:mm:ss.fffZ', $null)
            $localTime = $startupDateTime.ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss')
            Write-Host "    Startup Time: $localTime" -ForegroundColor Cyan
        }
        
        # Показываем порт
        if ($startupPort) {
            Write-Host "    Port: $startupPort" -ForegroundColor Cyan
        }
        
        # Показываем IP адрес (извлекаем из логов)
        $ipAddress = "localhost"
        foreach ($msg in $startupSequence) {
            if ($msg -match 'Backend server listening on ([^:]+):(\d+)') {
                $ipAddress = $matches[1]
                break
            }
        }
        Write-Host "    IP Address: $ipAddress" -ForegroundColor Cyan
        
        # Показываем точные цитаты из лога
        Write-Host "    Startup Log Entries:" -ForegroundColor Cyan
        foreach ($msg in $startupSequence) {
            Write-Host "      $msg" -ForegroundColor Gray
        }
        
        return $true
    } else {
        Write-Host "  [WARN] No backend startup messages found in log" -ForegroundColor Yellow
        return $false
    }
}

# Функция для проверки активности логирования backend
function Test-BackendLogging {
    Write-Host "Testing Backend logging activity..." -ForegroundColor Yellow
    
    $backendLog = "backend/logs/backend.log"
    if (-not (Test-Path $backendLog)) {
        Write-Host "  Backend log file not found!" -ForegroundColor Red
        return $false
    }
    
    # Запоминаем размер лога
    $initialSize = (Get-Item $backendLog).Length
    Write-Host "  Initial log size: $initialSize bytes" -ForegroundColor Gray
    
    # Делаем несколько тестовых запросов к backend для генерации лога
    try {
        # Запрос к health endpoint
        $response1 = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        # Запрос к test endpoint
        $response2 = Invoke-WebRequest -Uri "http://localhost:8000/api/test" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        # Запрос к несуществующему endpoint для генерации ошибки
        try {
            $response3 = Invoke-WebRequest -Uri "http://localhost:8000/api/nonexistent" -TimeoutSec 5 -ErrorAction SilentlyContinue
        } catch {
            # Ожидаемая ошибка 404
        }
        
        # Запрос с неправильным методом для генерации ошибки
        try {
            $response4 = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method POST -Body "invalid" -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        } catch {
            # Ожидаемая ошибка
        }
        
        # Запрос к endpoint, который точно вызовет ошибку JSON parsing
        try {
            $response5 = Invoke-WebRequest -Uri "http://localhost:8000/api/posts" -Method POST -Body "invalid json" -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        } catch {
            # Ожидаемая ошибка JSON parsing
        }
        
        Start-Sleep -Seconds 3  # Увеличиваем время ожидания записи в лог
        
        $newSize = (Get-Item $backendLog).Length
        Write-Host "  New log size: $newSize bytes" -ForegroundColor Gray
        
        # Проверяем, что лог увеличился или остался стабильным (что означает активность)
        if ($newSize -gt $initialSize) {
            Write-Host "  [OK] Backend logging is active (log size increased by $($newSize - $initialSize) bytes)" -ForegroundColor Green
            return $true
        } else {
            # Проверяем, есть ли новые записи в логе (последние 5 секунд)
            $recentLogs = Read-LogFile -LogPath $backendLog -TailLines 10 | Where-Object { 
                $_ -match '\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' -and 
                [DateTime]::ParseExact($_.Split('[')[1].Split(']')[0], 'yyyy-MM-ddTHH:mm:ss.fffZ', $null) -gt (Get-Date).AddSeconds(-10)
            }
            
            if ($recentLogs.Count -gt 0) {
                Write-Host "  [OK] Backend logging is active (found $($recentLogs.Count) recent log entries)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "  [WARN] Backend log size did not increase and no recent entries found" -ForegroundColor Yellow
                return $false
            }
        }
    } catch {
        Write-Host "  [ERROR] Failed to test backend logging: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Функция для проверки активности логирования frontend
function Test-FrontendLogging {
    Write-Host "Testing Frontend logging activity..." -ForegroundColor Yellow
    
    $frontendLog = "backend/logs/frontend.log"
    
    # Директория для логов frontend уже существует в backend/logs
    $frontendLogsDir = Split-Path $frontendLog -Parent
    if (-not (Test-Path $frontendLogsDir)) {
        Write-Host "  [ERROR] Backend logs directory not found!" -ForegroundColor Red
        return $false
    }
    
    # Запоминаем размер лога если он существует
    $initialSize = 0
    if (Test-Path $frontendLog) {
        $initialSize = (Get-Item $frontendLog).Length
        Write-Host "  Initial frontend log size: $initialSize bytes" -ForegroundColor Gray
    } else {
        Write-Host "  Frontend log file does not exist yet" -ForegroundColor Gray
    }
    
    # Отправляем несколько тестовых логов через API
    try {
        $testLogData1 = @{
            level = "info"
            message = "Frontend logging test 1 from PowerShell script"
            data = @{
                timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                test = $true
                step = 1
            }
        }
        
        $testLogData2 = @{
            level = "warn"
            message = "Frontend logging test 2 from PowerShell script"
            data = @{
                timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                test = $true
                step = 2
            }
        }
        
        # Отправляем первый лог
        Write-Host "  Sending test log 1..." -ForegroundColor Gray
        $response1 = Invoke-WebRequest -Uri "http://localhost:8000/api/client-log" -Method POST -Body (ConvertTo-Json $testLogData1) -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "  Response 1 status: $($response1.StatusCode)" -ForegroundColor Gray
        
        Start-Sleep -Seconds 1
        
        # Отправляем второй лог
        Write-Host "  Sending test log 2..." -ForegroundColor Gray
        $response2 = Invoke-WebRequest -Uri "http://localhost:8000/api/client-log" -Method POST -Body (ConvertTo-Json $testLogData2) -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "  Response 2 status: $($response2.StatusCode)" -ForegroundColor Gray
        
        Start-Sleep -Seconds 3  # Увеличиваем время ожидания записи в лог
        
        if (Test-Path $frontendLog) {
            $newSize = (Get-Item $frontendLog).Length
            Write-Host "  New frontend log size: $newSize bytes" -ForegroundColor Gray
            
            if ($newSize -gt $initialSize) {
                Write-Host "  [OK] Frontend logging is active (log size increased by $($newSize - $initialSize) bytes)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "  [WARN] Frontend log size did not increase" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "  [WARN] Frontend log file still not created after API calls" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "  [ERROR] Failed to test frontend logging: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Функция для проверки последних записей в логах
function Show-RecentLogEntries {
    Write-Host "Showing recent log entries..." -ForegroundColor Yellow
    
    $backendLog = "backend/logs/backend.log"
    $frontendLog = "backend/logs/frontend.log"
    
    if (Test-Path $backendLog) {
        Write-Host "  Recent Backend log entries:" -ForegroundColor Cyan
        $backendLines = Read-LogFile -LogPath $backendLog -TailLines 3
        foreach ($line in $backendLines) {
            Write-Host "    $line" -ForegroundColor Gray
        }
    }
    
    if (Test-Path $frontendLog) {
        Write-Host "  Recent Frontend log entries:" -ForegroundColor Cyan
        $frontendLines = Read-LogFile -LogPath $frontendLog -TailLines 3
        foreach ($line in $frontendLines) {
            Write-Host "    $line" -ForegroundColor Gray
        }
    }
}

# ===== ОСНОВНОЙ ПРОЦЕСС =====

Write-Host "`n=== STEP 1: Stopping Existing Processes ===" -ForegroundColor Cyan

# Останавливаем процессы на портах
$backendStopped = Stop-ProcessesOnPort -Port 8000 -ServiceName "Backend"
$frontendStopped = Stop-ProcessesOnPort -Port 3000 -ServiceName "Frontend"

# Останавливаем процессы по ключевым словам
$nodeStopped = Stop-ProcessesByKeyword -Keyword "node" -ServiceName "Node.js"

Write-Host "`n=== STEP 2: Verifying Ports Are Free ===" -ForegroundColor Cyan

# Проверяем освобождение портов
$backendPortFree = Wait-PortFree -Port 8000 -ServiceName "Backend"
$frontendPortFree = Wait-PortFree -Port 3000 -ServiceName "Frontend"

if (-not $backendPortFree -or -not $frontendPortFree) {
    Write-Host "WARNING: Some ports may still be in use!" -ForegroundColor Red
    Write-Host "You may need to manually stop processes or restart the system." -ForegroundColor Yellow
}

Write-Host "`n=== STEP 3: Starting Servers ===" -ForegroundColor Cyan

# Создаем директории для логов если их нет
if (-not (Test-Path "backend/logs")) {
    New-Item -ItemType Directory -Path "backend/logs" -Force | Out-Null
}
if (-not (Test-Path "frontend/logs")) {
    New-Item -ItemType Directory -Path "frontend/logs" -Force | Out-Null
}

# Запускаем backend
Write-Host "Starting Backend..." -ForegroundColor Green
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal -PassThru
Write-Host "  Backend process started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Ждем запуска backend
Start-Sleep -Seconds 5

# Запускаем frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal -PassThru
Write-Host "  Frontend process started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host "`n=== STEP 4: Verifying Server Startup ===" -ForegroundColor Cyan

# Проверяем запуск серверов
$backendStarted = Test-ServerStarted -Port 8000 -ServiceName "Backend"
$frontendStarted = Test-ServerStarted -Port 3000 -ServiceName "Frontend"

if (-not $backendStarted) {
    Write-Host "ERROR: Backend failed to start!" -ForegroundColor Red
    exit 1
}

if (-not $frontendStarted) {
    Write-Host "WARNING: Frontend may not have started properly" -ForegroundColor Yellow
}

Write-Host "`n=== STEP 5: Testing HTTP Responses ===" -ForegroundColor Cyan

# Ждем еще немного для полного запуска
Start-Sleep -Seconds 3

# Тестируем HTTP ответы
$backendHttpOk = Test-ServerResponse -Url "http://localhost:8000/api/health" -ServiceName "Backend"
$frontendHttpOk = Test-ServerResponse -Url "http://localhost:3000" -ServiceName "Frontend"

Write-Host "`n=== STEP 6: Checking Backend Startup Messages ===" -ForegroundColor Cyan

# Проверяем стартовые сообщения backend
$backendStartupOk = Test-BackendStartupMessages

Write-Host "`n=== STEP 7: Testing Logging Activity ===" -ForegroundColor Cyan

# Проверяем активность логирования
$backendLoggingOk = Test-BackendLogging
$frontendLoggingOk = Test-FrontendLogging

Write-Host "`n=== STEP 8: Checking Log Files ===" -ForegroundColor Cyan

# Проверяем логи
Test-LogFiles

Write-Host "`n=== STEP 9: Recent Log Entries ===" -ForegroundColor Cyan

# Показываем последние записи в логах
Show-RecentLogEntries

Write-Host "`n=== STEP 10: Final Status ===" -ForegroundColor Cyan

# Итоговая проверка
$allGood = $true

if ($backendStarted) {
    Write-Host "[OK] Backend: RUNNING on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend: FAILED to start" -ForegroundColor Red
    $allGood = $false
}

if ($backendStartupOk) {
    Write-Host "[OK] Backend Startup: SUCCESSFUL" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend Startup: NO STARTUP MESSAGES FOUND" -ForegroundColor Yellow
    $allGood = $false
}

if ($frontendStarted) {
    Write-Host "[OK] Frontend: RUNNING on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend: FAILED to start" -ForegroundColor Red
    $allGood = $false
}

if ($backendHttpOk) {
    Write-Host "[OK] Backend HTTP: RESPONDING" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend HTTP: MAY NOT BE READY" -ForegroundColor Yellow
}

if ($frontendHttpOk) {
    Write-Host "[OK] Frontend HTTP: RESPONDING" -ForegroundColor Green
} else {
    Write-Host "[WARN] Frontend HTTP: MAY NOT BE READY" -ForegroundColor Yellow
}

if ($backendLoggingOk -or $backendStartupOk) {
    Write-Host "[OK] Backend Logging: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend Logging: MAY NOT BE WORKING" -ForegroundColor Yellow
    $allGood = $false
}

if ($frontendLoggingOk) {
    Write-Host "[OK] Frontend Logging: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "[WARN] Frontend Logging: MAY NOT BE WORKING" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Backend Process ID: $($backendProcess.Id)" -ForegroundColor White
Write-Host "Frontend Process ID: $($frontendProcess.Id)" -ForegroundColor White
Write-Host "Backend URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "`n[SUCCESS] All servers started successfully!" -ForegroundColor Green
    Write-Host "You can now open http://localhost:3000 in your browser" -ForegroundColor White
} else {
    Write-Host "`n[WARNING] Some issues detected. Check the logs above." -ForegroundColor Yellow
}

Write-Host "`nScript completed. Servers are running in separate windows." -ForegroundColor Green
Write-Host "Use .\stop-servers.ps1 to stop all servers." -ForegroundColor Yellow 