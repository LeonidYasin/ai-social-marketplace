# Git Commit Guide - Избежание проблем с кодировками

## Проблема

В PowerShell при создании коммитов с многострочными описаниями на русском языке могут возникать проблемы с кодировками, что приводит к искажению текста в сообщениях коммитов.

## Решение

Созданы скрипты для правильного создания коммитов в PowerShell и CMD:

### 1. `git-commit.ps1` - Полный коммит с описанием

Создает коммит с подробным описанием, статистикой файлов и подтверждением.

**Использование:**
```powershell
# Простой коммит
.\git-commit.ps1 -Message "Fix encoding issues"

# Коммит с описанием
.\git-commit.ps1 -Message "Add authentication" -Description "Implement user login system with JWT tokens"

# Коммит конкретных файлов
.\git-commit.ps1 -Message "Update docs" -Files "README.md", "docs/*"
```

**Особенности:**
- ✅ Правильная UTF-8 кодировка
- ✅ Подробное описание коммита
- ✅ Список измененных файлов
- ✅ Статистика изменений
- ✅ Предварительный просмотр
- ✅ Подтверждение перед созданием

### 2. `quick-commit.ps1` - Быстрый коммит

Создает простой коммит с кратким сообщением.

**Использование:**
```powershell
.\quick-commit.ps1 "Fix bug"
.\quick-commit.ps1 "Update README"
.\quick-commit.ps1 "Add new feature"
```

**Особенности:**
- ✅ Правильная UTF-8 кодировка
- ✅ Быстрое создание
- ✅ Автоматическое добавление всех изменений

### 3. `git-commit.cmd` - CMD версия полного коммита

**Использование:**
```cmd
git-commit.cmd
```

**Особенности:**
- ✅ Правильная UTF-8 кодировка (chcp 65001)
- ✅ Интерактивный ввод сообщения
- ✅ Автоматическое добавление всех изменений

### 4. `quick-commit.cmd` - CMD версия быстрого коммита

**Использование:**
```cmd
quick-commit.cmd "Fix bug"
quick-commit.cmd
```

**Особенности:**
- ✅ Правильная UTF-8 кодировка (chcp 65001)
- ✅ Поддержка аргументов командной строки
- ✅ Интерактивный ввод, если аргумент не указан

## Альтернативные способы

### 1. Использование файла для сообщения коммита

```powershell
# Создаем файл с сообщением
"Fix encoding issues" | Out-File -FilePath commit-msg.txt -Encoding UTF8
"" | Out-File -FilePath commit-msg.txt -Encoding UTF8 -Append
"Подробное описание изменений" | Out-File -FilePath commit-msg.txt -Encoding UTF8 -Append

# Создаем коммит
git add .
git commit -F commit-msg.txt

# Удаляем временный файл
Remove-Item commit-msg.txt
```

### 2. Использование Git GUI

```powershell
# Открываем Git GUI
git gui
```

### 3. Использование Git Bash

```bash
# В Git Bash (избегает проблем PowerShell)
git add .
git commit -m "Fix encoding issues"
```

### 4. Настройка PowerShell для UTF-8

Добавьте в профиль PowerShell:
```powershell
# В $PROFILE
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

## Рекомендации

1. **Для простых коммитов:** используйте `quick-commit.cmd` или `quick-commit.ps1`
2. **Для важных изменений:** используйте `git-commit.cmd` или `git-commit.ps1` с описанием
3. **Для критических коммитов:** используйте Git GUI или Git Bash
4. **Избегайте:** длинных многострочных сообщений напрямую в PowerShell
5. **Предпочтительно:** используйте CMD версии для лучшей совместимости с кодировками

## Примеры использования

### Обычная разработка
```powershell
.\quick-commit.ps1 "Fix typo in README"
.\quick-commit.ps1 "Update dependencies"
```

### Важные изменения
```powershell
.\git-commit.ps1 -Message "Implement user authentication" -Description "Add JWT-based authentication system with login/logout functionality. Includes password hashing and session management."
```

### Исправления багов
```powershell
.\git-commit.ps1 -Message "Fix database connection encoding" -Description "Resolve encoding issues on Windows and Linux. Implement universal encoding detection and force UTF-8 in production environment."
```

## Проверка результата

После создания коммита проверьте его содержимое:
```powershell
git log --oneline -1
git show --stat
```

Это поможет убедиться, что сообщение коммита корректно отображается. 