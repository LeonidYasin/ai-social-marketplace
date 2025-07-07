# Универсальное руководство по деплою

## Автоматическое определение URL

Приложение теперь автоматически определяет правильные URL для API в зависимости от окружения:

### 1. Приоритет определения URL:

1. **Переменные окружения** (если установлены)
   - `REACT_APP_API_URL`
   - `REACT_APP_WS_URL`

2. **Автоматическое определение по домену:**
   - `onrender.com` → `https://social-marketplace-api.onrender.com`
   - `vercel.app` → `https://your-app.vercel.app/api`
   - `netlify.app` → `https://your-app.netlify.app/.netlify/functions/api`
   - `herokuapp.com` → `https://your-app.herokuapp.com`

3. **По умолчанию:** `http://localhost:8000` (для разработки)

## Деплой на Render.com

### Способ 1: Автоматический (рекомендуемый)
```bash
# Просто скопируйте render-template.yaml в render.yaml
cp render-template.yaml render.yaml
# Отредактируйте имена сервисов
# Закоммитьте и запушьте
git add render.yaml
git commit -m "Configure deployment"
git push
```

### Способ 2: Через веб-интерфейс
1. Создайте сервисы вручную в Render.com
2. Переменные окружения НЕ нужны - приложение само определит URL
3. Или установите переменные для переопределения

## Деплой на другие платформы

### Vercel
```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel

# Или через GitHub интеграцию
# Приложение автоматически определит URL
```

### Netlify
```bash
# Установите Netlify CLI
npm i -g netlify-cli

# Деплой
netlify deploy --prod

# Или через GitHub интеграцию
# Приложение автоматически определит URL
```

### Heroku
```bash
# Установите Heroku CLI
# Создайте приложение
heroku create your-app-name

# Деплой
git push heroku main

# Приложение автоматически определит URL
```

## Проверка конфигурации

После деплоя откройте консоль браузера и проверьте логи:

```javascript
API Configuration: {
  BASE_URL: "https://your-api-url.com",
  WS_URL: "wss://your-api-url.com",
  HOSTNAME: "your-app.onrender.com",
  DETECTION_METHOD: "Auto-detection"
}
```

## Настройка для разных проектов

### 1. Измените имена в render-template.yaml:
```yaml
name: your-app-api  # → my-awesome-app-api
name: your-app-frontend  # → my-awesome-app-frontend
name: your-app-db  # → my-awesome-app-db
```

### 2. Обновите URL в config/api.js:
```javascript
// Для Vercel
if (window.location.hostname.includes('vercel.app')) {
  return 'https://my-awesome-app.vercel.app/api';
}

// Для Netlify
if (window.location.hostname.includes('netlify.app')) {
  return 'https://my-awesome-app.netlify.app/.netlify/functions/api';
}
```

## Преимущества нового подхода

✅ **Автоматическое определение** - не нужно менять код  
✅ **Универсальность** - работает на любой платформе  
✅ **Гибкость** - можно переопределить через переменные окружения  
✅ **Простота** - минимум настроек при деплое  
✅ **Надежность** - fallback на localhost для разработки  

## Отладка

Если URL определяются неправильно:

1. Проверьте консоль браузера
2. Установите переменные окружения вручную
3. Проверьте, что домен правильно определяется
4. Обновите логику определения в `config/api.js` 