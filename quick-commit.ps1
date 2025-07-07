#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Быстрый коммит с простым сообщением

.DESCRIPTION
    Создает коммит с кратким сообщением, избегая проблем с кодировками

.PARAMETER Message
    Сообщение коммита (обязательно)

.EXAMPLE
    .\quick-commit.ps1 "Fix bug"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# Устанавливаем UTF-8 кодировку
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "⚡ Quick Commit" -ForegroundColor Green

# Проверяем Git репозиторий
if (-not (Test-Path ".git")) {
    Write-Host "❌ Не найден Git репозиторий" -ForegroundColor Red
    exit 1
}

# Проверяем изменения
$status = git status --porcelain
if (-not $status) {
    Write-Host "❌ Нет изменений для коммита" -ForegroundColor Yellow
    exit 0
}

# Добавляем все изменения
git add .

# Создаем коммит с простым сообщением
git commit -m $Message

Write-Host "✅ Коммит создан: $Message" -ForegroundColor Green 