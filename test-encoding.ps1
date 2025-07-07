# Test encoding script
# Set console encoding for Windows (windows-1251 for proper Cyrillic display)
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
[Console]::InputEncoding = [System.Text.Encoding]::GetEncoding('windows-1251')
chcp 1251

Write-Host "=== PowerShell Encoding Test ===" -ForegroundColor Green
Write-Host "Console encoding set to windows-1251" -ForegroundColor Yellow
Write-Host "Cyrillic test: Hello, world!" -ForegroundColor Cyan

# Function for safe log reading with proper encoding
function Read-LogFile {
    param([string]$LogPath, [int]$TailLines = 10)
    
    if (-not (Test-Path $LogPath)) {
        Write-Host "    Log file not found: $LogPath" -ForegroundColor Yellow
        return @()
    }
    
    # Try different encodings for reading the log
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
            Write-Host "    Error reading with $encoding encoding - $($_.Exception.Message)" -ForegroundColor Red
            continue
        }
    }
    
    if ($lines -eq $null) {
        Write-Host "    Warning: Could not read log file with any encoding" -ForegroundColor Yellow
        return @()
    }
    
    return $lines
}

Write-Host "`n=== Log Check ===" -ForegroundColor Green

$backendLog = "backend/logs/backend.log"
$frontendLog = "backend/logs/frontend.log"

if (Test-Path $backendLog) {
    Write-Host "Backend log found: $backendLog" -ForegroundColor Green
    $backendLines = Read-LogFile -LogPath $backendLog -TailLines 3
    Write-Host "Recent backend entries:" -ForegroundColor Cyan
    foreach ($line in $backendLines) {
        Write-Host "  $line" -ForegroundColor Gray
    }
} else {
    Write-Host "Backend log not found: $backendLog" -ForegroundColor Yellow
}

if (Test-Path $frontendLog) {
    Write-Host "Frontend log found: $frontendLog" -ForegroundColor Green
    $frontendLines = Read-LogFile -LogPath $frontendLog -TailLines 3
    Write-Host "Recent frontend entries:" -ForegroundColor Cyan
    foreach ($line in $frontendLines) {
        Write-Host "  $line" -ForegroundColor Gray
    }
} else {
    Write-Host "Frontend log not found: $frontendLog" -ForegroundColor Yellow
}

Write-Host "`nTest completed!" -ForegroundColor Green 