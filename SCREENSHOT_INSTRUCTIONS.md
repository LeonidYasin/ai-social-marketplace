# Инструкция по созданию скриншотов для анализа

## 🎯 Цель
Создать полный набор скриншотов для анализа состояния приложения и дополнения документации.

## 🚀 Быстрый запуск

### 1. Запуск серверов
```powershell
# В PowerShell из корневой директории проекта
.\start-servers.ps1
```

### 2. Создание скриншотов
```bash
node create_documentation_screenshots.js
```

## 📁 Структура скриншотов

Все скриншоты будут сохранены в папке `./documentation_screenshots/` со следующей структурой:

```
documentation_screenshots/
├── states/           # Состояния приложения
├── components/       # Компоненты UI
├── interactions/     # Взаимодействия пользователя
├── multiuser/        # Многопользовательские сценарии
├── errors/           # Состояния ошибок
└── screenshot_list.json  # Список всех скриншотов
```

## 📸 Необходимые скриншоты

### Состояния (states/)
1. **01_initial_page.png** - Начальная страница
2. **02_guest_mode.png** - Гостевой режим
3. **03_login_form.png** - Форма входа
4. **04_main_page.png** - Главная страница после входа
5. **05_post_creation.png** - Создание поста
6. **06_menu_open.png** - Открытое меню
7. **07_chat_open.png** - Открытый чат
8. **08_profile_page.png** - Страница профиля

### Компоненты (components/)
1. **01_appbar.png** - AppBar компонент
2. **02_sidebar_left.png** - Левая панель
3. **03_sidebar_right.png** - Правая панель
4. **04_feed.png** - Лента постов
5. **05_post_card.png** - Карточка поста
6. **06_chat_dialog.png** - Диалог чата
7. **07_notifications.png** - Уведомления
8. **08_search.png** - Поиск

### Взаимодействия (interactions/)
1. **01_before_like.png** - До лайка
2. **02_after_like.png** - После лайка
3. **03_comment_form.png** - Форма комментария
4. **04_share_menu.png** - Меню поделиться
5. **05_post_field_focused.png** - Поле поста в фокусе
6. **06_post_with_text.png** - Пост с текстом

### Многопользовательские (multiuser/)
1. **01_user1_initial.png** - Пользователь 1 - начальное состояние
2. **02_user2_initial.png** - Пользователь 2 - начальное состояние
3. **03_user1_post_created.png** - Пользователь 1 создал пост
4. **04_user2_sees_post.png** - Пользователь 2 видит пост
5. **05_user2_liked_post.png** - Пользователь 2 лайкнул пост
6. **06_user1_sees_like.png** - Пользователь 1 видит лайк

### Ошибки (errors/)
1. **01_invalid_email.png** - Ошибка неверного email
2. **02_empty_post.png** - Ошибка пустого поста

## 🔧 Ручное создание скриншотов

Если автоматический скрипт не работает, создайте скриншоты вручную:

### 1. Начальная страница
- Откройте http://localhost:3000
- Сделайте скриншот полной страницы
- Сохраните как `states/01_initial_page.png`

### 2. Гостевой режим
- Нажмите "Продолжить как гость"
- Сделайте скриншот
- Сохраните как `states/02_guest_mode.png`

### 3. Форма входа
- Нажмите "Войти"
- Сделайте скриншот формы
- Сохраните как `states/03_login_form.png`

### 4. Главная страница
- Войдите в систему
- Сделайте скриншот главной страницы
- Сохраните как `states/04_main_page.png`

### 5. Создание поста
- Нажмите на поле "Что у вас нового?"
- Сделайте скриншот
- Сохраните как `states/05_post_creation.png`

### 6. Меню
- Найдите и нажмите кнопку меню
- Сделайте скриншот открытого меню
- Сохраните как `states/06_menu_open.png`

### 7. Чат
- Найдите и нажмите кнопку чата
- Сделайте скриншот открытого чата
- Сохраните как `states/07_chat_open.png`

### 8. Профиль
- Найдите и нажмите кнопку профиля
- Сделайте скриншот страницы профиля
- Сохраните как `states/08_profile_page.png`

## 📋 Требования к скриншотам

1. **Разрешение**: Минимум 1920x1080
2. **Формат**: PNG
3. **Полная страница**: Включайте весь контент страницы
4. **Качество**: Высокое качество без сжатия
5. **Браузер**: Chrome или Edge
6. **Масштаб**: 100% (без зума)

## 🎯 Ключевые элементы для анализа

### Тексты для поиска:
- "Продолжить как гость"
- "Войти"
- "Что у вас нового?"
- "ОТПРАВИТЬ"
- "Нравится"
- "Комментировать"
- "Поделиться"
- "Обзор"
- "Топ посты"
- "Достижения"

### data-testid атрибуты:
- "MenuIcon"
- "SmartToyIcon"
- "AccountCircleIcon"
- "NotificationsIcon"
- "SearchIcon"
- "SendButton"

## 📤 Отправка скриншотов

После создания всех скриншотов:

1. Упакуйте папку `documentation_screenshots/` в ZIP архив
2. Отправьте архив через чат
3. Укажите, какие элементы нужно проанализировать дополнительно

## 🔍 Анализ скриншотов

После получения скриншотов я смогу:

1. **Проанализировать структуру UI** - определить все элементы интерфейса
2. **Определить состояния** - классифицировать разные экраны приложения
3. **Найти ключевые элементы** - локализовать кнопки, поля, меню
4. **Дополнить документацию** - обновить описание компонентов
5. **Улучшить OCR бота** - настроить поиск элементов
6. **Создать тестовые сценарии** - разработать новые тесты

## ❓ Часто задаваемые вопросы

**Q: Что делать, если скрипт не работает?**
A: Создайте скриншоты вручную по инструкции выше.

**Q: Нужны ли скриншоты всех состояний?**
A: Да, чем больше состояний, тем лучше анализ.

**Q: Можно ли использовать другие браузеры?**
A: Рекомендуется Chrome или Edge для лучшей совместимости.

**Q: Что делать с ошибками?**
A: Сделайте скриншоты ошибок и отправьте их для анализа.

**Q: Нужны ли скриншоты мобильной версии?**
A: Пока достаточно десктопной версии.

## 📞 Поддержка

Если у вас возникли проблемы:
1. Проверьте, что серверы запущены
2. Убедитесь, что приложение работает на http://localhost:3000
3. Попробуйте создать скриншоты вручную
4. Обратитесь за помощью с описанием проблемы 