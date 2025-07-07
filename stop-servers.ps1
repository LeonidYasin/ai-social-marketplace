# Устанавливаем кодировку консоли для Windows (windows-1251)
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
[Console]::InputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
chcp 1251

# PowerShell script to stop all servers
Write-Host "Stopping all servers..." -ForegroundColor Red

# Останавливаем процессы по портам
Write-Host "Stopping processes by ports..." -ForegroundColor Yellow

# Проверка, что порт свободен
function Test-PortFree {
    param([int]$port)
    $busy = netstat -ano | Select-String ":$port "
    return -not $busy
}

# Останавливаем процессы на порту 8000 (backend)
$processes8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($processId in $processes8000) {
    try {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process on port 8000 (PID: $processId)" -ForegroundColor Red
    } catch {
        Write-Host "Failed to stop process on port 8000 (PID: $processId)" -ForegroundColor Yellow
    }
}

# Проверяем, что процессы на портах 8000 и 3000 остановлены
$maxTries = 3
$portsToCheck = @(8000, 3000)
foreach ($port in $portsToCheck) {
    $try = 1
    while (-not (Test-PortFree $port) -and $try -le $maxTries) {
        Write-Host "Port $port is still busy. Retrying stop... (Attempt $try)" -ForegroundColor Yellow
        $processes = netstat -ano | Select-String ":$port " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                try {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "Force stopped process on port $port (PID: $processId)" -ForegroundColor Red
                } catch {
                    Write-Host "Failed to force stop process $processId on port $port" -ForegroundColor Yellow
                }
            }
        }
        Start-Sleep -Seconds 1
        $try++
    }
    if (Test-PortFree $port) {
        Write-Host "Port $port is now free." -ForegroundColor Green
    } else {
        Write-Host "WARNING: Port $port is STILL busy after $maxTries attempts!" -ForegroundColor Red
        netstat -ano | Select-String ":$port " | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
}

# Останавливаем процессы по ключевым словам
Write-Host "Stopping processes by keywords..." -ForegroundColor Yellow

# Останавливаем процессы node
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
foreach ($process in $nodeProcesses) {
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped Node.js process (PID: $($process.Id))" -ForegroundColor Red
    } catch {
        Write-Host "Failed to stop Node.js process (PID: $($process.Id))" -ForegroundColor Yellow
    }
}

Write-Host "All servers stopped!" -ForegroundColor Green 