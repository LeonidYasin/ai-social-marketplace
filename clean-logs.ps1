# Script for cleaning and rotating logs
param(
    [int]$DaysToKeep = 7,
    [switch]$Force
)

Write-Host "Cleaning logs older than $DaysToKeep days..." -ForegroundColor Cyan

# Check if logs directory exists
$logsDir = "backend/logs"
if (-not (Test-Path $logsDir)) {
    Write-Host "ERROR: Directory $logsDir not found" -ForegroundColor Red
    exit 1
}

# Function to clean old log files
function Clean-OldLogs {
    param(
        [string]$Directory,
        [int]$Days
    )
    
    $cutoffDate = (Get-Date).AddDays(-$Days)
    $files = Get-ChildItem -Path $Directory -File -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    if ($files.Count -gt 0) {
        Write-Host "Removing $($files.Count) old log files..." -ForegroundColor Yellow
        foreach ($file in $files) {
            Write-Host "  Removing: $($file.Name) (last modified: $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Gray
            Remove-Item $file.FullName -Force
        }
    } else {
        Write-Host "No old log files found" -ForegroundColor Green
    }
}

# Function to rotate large log files
function Rotate-LargeLogs {
    param(
        [string]$Directory,
        [int]$MaxSizeMB = 50
    )
    
    $files = Get-ChildItem -Path $Directory -File -Filter "*.log"
    
    foreach ($file in $files) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        
        if ($sizeMB -gt $MaxSizeMB) {
            $backupName = "$($file.BaseName)_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
            $backupPath = Join-Path $Directory $backupName
            
            Write-Host "Rotating file $($file.Name) (size: ${sizeMB}MB) -> $backupName" -ForegroundColor Yellow
            
            # Create backup
            Copy-Item $file.FullName $backupPath
            
            # Clear original file
            Clear-Content $file.FullName
            
            Write-Host "File $($file.Name) cleared, backup saved" -ForegroundColor Green
        }
    }
}

# Function to compress old backups
function Compress-OldBackups {
    param(
        [string]$Directory
    )
    
    $backupFiles = Get-ChildItem -Path $Directory -File -Filter "*_*.log" | Where-Object { $_.Name -match '\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$' }
    
    foreach ($file in $backupFiles) {
        $zipName = "$($file.BaseName).zip"
        $zipPath = Join-Path $Directory $zipName
        
        if (-not (Test-Path $zipPath)) {
            Write-Host "Compressing $($file.Name) -> $zipName" -ForegroundColor Blue
            
            try {
                Compress-Archive -Path $file.FullName -DestinationPath $zipPath -Force
                Remove-Item $file.FullName -Force
                Write-Host "File $($file.Name) compressed and removed" -ForegroundColor Green
            } catch {
                Write-Host "Error compressing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# Main logic
try {
    # Clean old logs
    Clean-OldLogs -Directory $logsDir -Days $DaysToKeep
    
    # Rotate large files
    Rotate-LargeLogs -Directory $logsDir -MaxSizeMB 50
    
    # Compress old backups
    Compress-OldBackups -Directory $logsDir
    
    # Show statistics
    $currentFiles = Get-ChildItem -Path $logsDir -File
    $totalSize = ($currentFiles | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "Log statistics:" -ForegroundColor Cyan
    Write-Host "  Total files: $($currentFiles.Count)" -ForegroundColor White
    Write-Host "  Total size: ${totalSizeMB}MB" -ForegroundColor White
    
    $currentFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "    $($_.Name): ${sizeMB}MB" -ForegroundColor Gray
    }
    
    Write-Host "Log cleanup completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error during log cleanup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 