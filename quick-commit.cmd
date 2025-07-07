@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ⚡ Quick Commit (CMD Version)

REM Проверяем Git репозиторий
if not exist ".git" (
    echo ❌ Не найден Git репозиторий
    exit /b 1
)

REM Проверяем изменения
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Нет изменений для коммита
    exit /b 0
)

REM Добавляем все изменения
git add .

REM Получаем сообщение из аргумента
if "%~1"=="" (
    set /p "message=Введите сообщение коммита: "
) else (
    set "message=%~1"
)

REM Создаем коммит
git commit -m "!message!"

if %errorlevel% equ 0 (
    echo ✅ Коммит создан: !message!
) else (
    echo ❌ Ошибка при создании коммита
    exit /b 1
) 