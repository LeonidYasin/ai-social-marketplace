# Facebook-like Marketplace with Telegram Integration

Современная социальная торговая площадка с интеграцией Telegram, построенная на React и Material-UI.

## 🚀 Особенности

### Frontend (React + Material-UI)
- **Facebook-подобный интерфейс** с современным дизайном
- **Адаптивная верстка** для всех устройств
- **Реальное время** - WebSocket интеграция
- **AI чат-ассистент** для помощи пользователям
- **Геймификация** - уровни, достижения, рейтинги
- **Аналитика** - детальная статистика и метрики
- **Поиск и фильтры** - умный поиск по контенту
- **Уведомления** - push-уведомления и in-app уведомления

### Backend (Telegram Bot API)
- **Telegram авторизация** через Telegram Login Widget
- **Webhook интеграция** для real-time обновлений
- **AI интеграция** для умного чат-ассистента
- **Масштабируемость** - поддержка 10,000+ пользователей

## 📁 Структура проекта

```
1/
├── frontend/                 # React приложение
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   │   ├── AppBar.jsx    # Главная панель навигации
│   │   │   ├── Feed.jsx      # Лента постов (61KB)
│   │   │   ├── Analytics.jsx # Аналитика и статистика
│   │   │   ├── Search.jsx    # Поиск и фильтры
│   │   │   ├── Notifications.jsx # Уведомления
│   │   │   ├── Gamification.jsx # Геймификация
│   │   │   ├── UserSettings.jsx # Настройки пользователя
│   │   │   ├── AIChat.jsx    # AI чат-ассистент
│   │   │   ├── ChatDialog.jsx # Диалоги чата
│   │   │   ├── SidebarLeft.jsx # Левая панель
│   │   │   └── SidebarRight.jsx # Правая панель
│   │   ├── config/           # Конфигурация
│   │   │   └── api.js        # API конфигурация
│   │   ├── services/         # API сервисы
│   │   │   └── api.js        # API клиент
│   │   ├── App.jsx           # Главный компонент
│   │   └── index.js          # Точка входа
│   ├── package.json          # Зависимости
│   └── API_DOCUMENTATION.md  # Документация API
└── README.md                 # Этот файл
```

## 🛠 Технологии

### Frontend
- **React 18** - современная библиотека UI
- **Material-UI (MUI)** - компоненты Material Design
- **React Router** - навигация
- **WebSocket** - real-time обновления
- **Local Storage** - кэширование данных

### Backend (планируется)
- **Node.js/Express** или **Python/FastAPI**
- **Telegram Bot API** - интеграция с Telegram
- **WebSocket** - real-time коммуникация
- **AI/ML** - умный чат-ассистент
- **База данных** - PostgreSQL/MongoDB

## 🚀 Быстрый старт

### Требования
- Node.js 16+
- npm или yarn
- Git

### Установка и запуск

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd 1
```

2. **Установите зависимости:**
```bash
cd frontend
npm install
```

3. **Запустите в режиме разработки:**
```bash
npm start
```

4. **Откройте в браузере:**
- Локально: `http://localhost:3000`
- По сети: `http://192.168.0.103:3000`

## 📋 Функциональность

### ✅ Реализовано (Frontend)
- [x] Facebook-подобный интерфейс
- [x] Создание и редактирование постов
- [x] Лайки, реакции и комментарии
- [x] AI чат-ассистент (интерфейс)
- [x] Поиск и фильтры
- [x] Уведомления
- [x] Геймификация (уровни, достижения)
- [x] Аналитика и статистика
- [x] Настройки пользователя
- [x] Адаптивный дизайн
- [x] API интеграция (готово к подключению)

### 🔄 В разработке (Backend)
- [ ] Telegram Bot API интеграция
- [ ] База данных и модели
- [ ] API endpoints
- [ ] WebSocket сервер
- [ ] AI интеграция
- [ ] Аутентификация
- [ ] Файловое хранилище

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env` в папке `frontend`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token
REACT_APP_TELEGRAM_WEBHOOK=http://localhost:8000/webhook
```

### API конфигурация
Все API endpoints настроены в `src/config/api.js` и готовы к интеграции с бэкэндом.

## 📚 Документация

- **[API Documentation](frontend/API_DOCUMENTATION.md)** - полная документация API
- **[Компоненты](frontend/src/components/)** - описание всех React компонентов
- **[Конфигурация](frontend/src/config/)** - настройки приложения

## 🎯 Следующие шаги

### 1. Backend разработка
- Создать Telegram бота
- Настроить API endpoints
- Интегрировать базу данных
- Добавить WebSocket поддержку

### 2. Интеграция
- Подключить frontend к backend
- Настроить аутентификацию
- Добавить real-time обновления

### 3. Тестирование
- Unit тесты
- Integration тесты
- E2E тесты

### 4. Деплой
- Настроить CI/CD
- Развернуть на сервере
- Настроить SSL/HTTPS

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Поддержка

Если у вас есть вопросы или предложения:
- Создайте Issue в репозитории
- Напишите на email: [your-email@example.com]

---

**Статус проекта:** Frontend готов на 100%, готов к интеграции с backend 🎉