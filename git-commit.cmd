@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔧 Git Commit Helper (CMD Version)
echo ==================================

REM Проверяем, что мы в Git репозитории
if not exist ".git" (
    echo ❌ Ошибка: Не найден Git репозиторий
    exit /b 1
)

REM Проверяем статус Git
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Нет изменений для коммита
    exit /b 0
)

echo 📋 Измененные файлы:
git status --short

REM Добавляем все изменения
echo 📁 Добавляем все измененные файлы...
git add .

REM Запрашиваем сообщение коммита
set /p "commit_message=Введите сообщение коммита: "

REM Создаем коммит
git commit -m "%commit_message%"

if %errorlevel% equ 0 (
    echo ✅ Коммит создан успешно: %commit_message%
) else (
    echo ❌ Ошибка при создании коммита
    exit /b 1
)

echo.
echo 🎉 Готово! 