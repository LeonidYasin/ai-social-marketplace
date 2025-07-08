#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Создает коммит с правильной кодировкой UTF-8

.DESCRIPTION
    Скрипт для создания Git коммитов с подробным описанием,
    избегая проблем с кодировками в PowerShell

.PARAMETER Message
    Краткое сообщение коммита (обязательно)

.PARAMETER Description
    Подробное описание коммита (опционально)

.PARAMETER Files
    Список файлов для коммита (по умолчанию все измененные)

.EXAMPLE
    .\git-commit.ps1 -Message "Fix encoding issues"

.EXAMPLE
    .\git-commit.ps1 -Message "Add new feature" -Description "Add user authentication system"

.EXAMPLE
    .\git-commit.ps1 -Message "Update docs" -Files "README.md", "docs/*"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Files,

    [switch]$Force, # Не спрашивать подтверждение
    [switch]$Push   # Автоматически пушить после коммита
)

# Устанавливаем UTF-8 кодировку
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🔧 Git Commit Helper" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

# Проверяем, что мы в Git репозитории
if (-not (Test-Path ".git")) {
    Write-Host "❌ Ошибка: Не найден Git репозиторий" -ForegroundColor Red
    exit 1
}

# Проверяем статус Git
$status = git status --porcelain
if (-not $status) {
    Write-Host "❌ Нет изменений для коммита" -ForegroundColor Yellow
    exit 0
}

Write-Host "📋 Измененные файлы:" -ForegroundColor Cyan
git status --short

# Добавляем файлы в staging area
if ($Files) {
    Write-Host "📁 Добавляем указанные файлы..." -ForegroundColor Cyan
    foreach ($file in $Files) {
        if (Test-Path $file) {
            git add $file
            Write-Host "  ✅ Добавлен: $file" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Файл не найден: $file" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "📁 Добавляем все измененные файлы..." -ForegroundColor Cyan
    git add .
}

# Создаем временный файл для сообщения коммита
$tempFile = [System.IO.Path]::GetTempFileName()

try {
    # Записываем основное сообщение
    $Message | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Добавляем подробное описание, если указано
    if ($Description) {
        "" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
        $Description | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    }
    
    # Добавляем информацию о файлах
    "" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    "## Files changed:" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    git diff --cached --name-only | ForEach-Object {
        "  - $_" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    }
    
    # Добавляем статистику
    "" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    "## Statistics:" | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    $stats = git diff --cached --stat
    $stats | Out-File -FilePath $tempFile -Encoding UTF8 -Append
    
    # Показываем содержимое файла коммита
    Write-Host "📝 Сообщение коммита:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Get-Content $tempFile | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
    }
    
    # Запрашиваем подтверждение, если не указан -Force
    if (-not $Force) {
        Write-Host ""
        $confirm = Read-Host "🤔 Создать коммит? (y/N)"
        if ($confirm -ne 'y' -and $confirm -ne 'Y') {
            Write-Host "❌ Коммит отменен" -ForegroundColor Yellow
            exit 0
        }
    }

    # Создаем коммит
    git commit -F $tempFile
    
    Write-Host ""
    Write-Host "✅ Коммит создан успешно!" -ForegroundColor Green

    # Автоматический push, если указан -Push
    if ($Push) {
        Write-Host "🚀 Выполняю git push..." -ForegroundColor Cyan
        git push
    }

    # Показываем последний коммит
    Write-Host ""
    Write-Host "📋 Последний коммит:" -ForegroundColor Cyan
    git log --oneline -1
    
} finally {
    # Удаляем временный файл
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

Write-Host ""
Write-Host "🎉 Готово!" -ForegroundColor Green 