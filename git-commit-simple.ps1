param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [Parameter(Mandatory=$false)]
    [string]$Description,
    [switch]$Push
)

# Проверка среды выполнения
if ($env:SHELL -or $env:TERM_PROGRAM -or $env:MSYSTEM) {
    Write-Output "[INFO] Вы используете bash или не-PowerShell среду."
    Write-Output "[INFO] Для коммита и пуша используйте стандартные git-команды:" 
    Write-Output "    git add [файлы]"
    Write-Output "    git commit -m '[сообщение]'"
    Write-Output "    git push"
    Write-Output "[INFO] Пример для вашего случая:" 
    Write-Output "    git add frontend/src/App.jsx frontend/src/index.js"
    Write-Output "    git commit -m '$Message\n\n$Description'"
    Write-Output "    git push"
    return
}

# Устанавливаем кодировку
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$logFile = "git-commit-simple.log"
function LogMsg($msg) {
    Write-Output $msg
    $msg | Out-File -FilePath $logFile -Encoding UTF8 -Append
}

# Очищаем лог перед запуском
if (Test-Path $logFile) { Remove-Item $logFile -Force }

LogMsg "🔧 Git Commit Helper (non-interactive)"

# Проверяем, что мы в Git репозитории
if (-not (Test-Path ".git")) {
    LogMsg "❌ Не найден Git репозиторий. Скрипт завершён без изменений."
    Get-Content $logFile
    return
}

# Проверяем статус
$status = git status --porcelain
if (-not $status) {
    LogMsg "ℹ️ Нет изменений для коммита. Всё чисто, пушить нечего."
    Get-Content $logFile
    return
}

LogMsg "📋 Изменённые файлы:"
git status --short | ForEach-Object { LogMsg $_ }

# Добавляем все изменённые файлы
git add .

# Формируем сообщение коммита
if ($Description) {
    $fullMsg = "$Message`n`n$Description"
} else {
    $fullMsg = $Message
}

# Делаем коммит
git commit -m "$fullMsg"

if ($LASTEXITCODE -eq 0) {
    LogMsg "✅ Коммит создан!"
    git log --oneline -1 | ForEach-Object { LogMsg $_ }
    if ($Push) {
        LogMsg "🚀 Выполняю git push..."
        git push | ForEach-Object { LogMsg $_ }
        if ($LASTEXITCODE -eq 0) {
            LogMsg "✅ Изменения успешно отправлены на сервер!"
        } else {
            LogMsg "❌ Ошибка при выполнении git push. Проверьте соединение или права доступа."
        }
    } else {
        LogMsg "ℹ️ Коммит создан, но не отправлен. Для автоматического пуша используйте флаг -Push."
    }
} else {
    LogMsg "❌ Ошибка при создании коммита. Проверьте git status и сообщения об ошибках выше."
}

# В конце всегда выводим лог
Get-Content $logFile 