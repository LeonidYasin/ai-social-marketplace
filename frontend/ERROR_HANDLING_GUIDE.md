# Руководство по обработке ошибок

## Обзор

Система обработки ошибок в приложении была полностью переработана для обеспечения лучшего пользовательского опыта и автоматического восстановления после сбоев.

## Компоненты системы

### 1. BackendManager (`services/backendManager.js`)

Основной компонент для управления подключением к бэкенду:

- **Автоматическая проверка здоровья** бэкенда каждые 30 секунд
- **Умная обработка ошибок** с классификацией по типам
- **Автоматический запуск бэкенда** при обнаружении проблем
- **Красивые уведомления** с возможностью действий

#### Основные методы:

```javascript
// Проверка здоровья бэкенда
await backendManager.checkBackendHealth()

// Обработка ошибки подключения
const errorInfo = await backendManager.handleConnectionError(error, endpoint)

// Показать уведомление об ошибке
backendManager.showErrorNotification(errorInfo)

// Повторная попытка подключения
await backendManager.retryConnection()

// Настройка параметров
backendManager.configure({
  autoStartEnabled: true,
  maxRetries: 3,
  retryDelay: 2000
})
```

### 2. ErrorDisplay (`components/ErrorDisplay.jsx`)

Компонент для красивого отображения ошибок:

```jsx
<ErrorDisplay 
  error="Текст ошибки"
  onRetry={() => retryFunction()}
  onDismiss={() => setError(null)}
  variant="error" // error, warning, info, success
  title="Заголовок ошибки"
  actions={[
    {
      label: 'Действие',
      icon: <Icon />,
      action: () => actionFunction(),
      variant: 'outlined'
    }
  ]}
/>
```

### 3. BackendStatus (`components/BackendStatus.jsx`)

Компонент для отображения статуса бэкенда в AppBar:

- Показывает текущий статус подключения
- Кнопка для ручной проверки
- Настройки автоматического запуска
- Инструкции по ручному запуску

## Типы ошибок и их обработка

### 1. Backend Unavailable (ERR_CONNECTION_REFUSED)

**Причина:** Бэкенд не запущен или недоступен

**Действия:**
- Автоматическая попытка запуска бэкенда
- Показ инструкций по ручному запуску
- Fallback к локальным данным

**Сообщение пользователю:**
```
Сервер недоступен. Пытаемся запустить автоматически...
```

### 2. Timeout Error

**Причина:** Сервер отвечает слишком долго

**Действия:**
- Повторная попытка подключения
- Предложение проверить сеть

**Сообщение пользователю:**
```
Превышено время ожидания. Возможно, сервер перегружен.
```

### 3. Authentication Error (401)

**Причина:** Истекла сессия или неверные учетные данные

**Действия:**
- Перенаправление на страницу входа
- Очистка локальных данных

**Сообщение пользователю:**
```
Ваша сессия истекла. Пожалуйста, войдите в систему снова.
```

### 4. Server Error (500)

**Причина:** Внутренняя ошибка сервера

**Действия:**
- Сохранение отчета об ошибке
- Повторная попытка
- Уведомление разработчиков

**Сообщение пользователю:**
```
Произошла внутренняя ошибка сервера. Наша команда уже работает над её устранением.
```

## Автоматический запуск бэкенда

### Как это работает:

1. **Обнаружение проблемы:** BackendManager обнаруживает, что бэкенд недоступен
2. **Попытка автоматического запуска:** Отправляется запрос к `/api/admin/start-backend`
3. **Проверка результата:** Проверяется, запустился ли сервер
4. **Уведомление пользователя:** Показывается статус операции

### Endpoint для автоматического запуска:

```javascript
POST /api/admin/start-backend
{
  "port": 8000,
  "retryAttempt": 1
}
```

### Ответ:

```javascript
{
  "success": true,
  "message": "Сервер запущен успешно",
  "status": "started",
  "port": 8000
}
```

## Настройка системы

### Конфигурация BackendManager:

```javascript
backendManager.configure({
  autoStartEnabled: true,    // Включить автозапуск
  maxRetries: 3,            // Максимум попыток
  retryDelay: 2000,         // Задержка между попытками (мс)
  backendPort: 8000         // Порт бэкенда
});
```

### Мониторинг здоровья:

```javascript
// Запустить мониторинг
backendManager.startHealthMonitoring();

// Остановить мониторинг
backendManager.stopHealthMonitoring();

// Получить статус
const status = backendManager.getBackendStatus();
```

## Интеграция в компоненты

### В API запросах:

```javascript
try {
  const response = await apiRequest('/endpoint');
  return response;
} catch (error) {
  // Автоматическая обработка через BackendManager
  const errorInfo = await backendManager.handleConnectionError(error, '/endpoint');
  backendManager.showErrorNotification(errorInfo);
  throw error;
}
```

### В компонентах:

```jsx
import ErrorDisplay from './ErrorDisplay';

// В компоненте
const [error, setError] = useState(null);

// При ошибке
<ErrorDisplay 
  error={error}
  onRetry={retryFunction}
  onDismiss={() => setError(null)}
  variant="error"
  title="Ошибка загрузки данных"
/>
```

## Логирование ошибок

### Автоматическое логирование:

- Все ошибки автоматически логируются через `logger.logApiError()`
- Ошибки сохраняются в localStorage для последующей отправки
- Отчеты об ошибках отправляются при восстановлении соединения

### Ручное логирование:

```javascript
import logger from './services/logging';

logger.logError('Описание ошибки', error);
logger.logWarning('Предупреждение', data);
logger.logInfo('Информация', data);
```

## Лучшие практики

### 1. Всегда используйте ErrorDisplay для ошибок

```jsx
// ❌ Плохо
{error && <Alert severity="error">{error}</Alert>}

// ✅ Хорошо
<ErrorDisplay 
  error={error}
  onRetry={retryFunction}
  onDismiss={() => setError(null)}
/>
```

### 2. Обрабатывайте разные типы ошибок

```javascript
if (error.message.includes('Failed to fetch')) {
  // Ошибка подключения
} else if (error.message.includes('401')) {
  // Ошибка авторизации
} else if (error.message.includes('500')) {
  // Серверная ошибка
}
```

### 3. Предоставляйте fallback данные

```javascript
try {
  const data = await apiRequest('/data');
  setData(data);
} catch (error) {
  // Показываем локальные данные при ошибке
  setData(fallbackData);
}
```

### 4. Используйте BackendStatus в AppBar

```jsx
import BackendStatus from './BackendStatus';

// В AppBar
<BackendStatus />
```

## Отладка

### Проверка статуса бэкенда:

```javascript
// В консоли браузера
console.log(backendManager.getBackendStatus());
```

### Просмотр логов:

```javascript
// API логи
console.log(window.apiLogs);

// Ошибки в localStorage
console.log(JSON.parse(localStorage.getItem('errorReports')));
```

### Принудительная проверка здоровья:

```javascript
// В консоли браузера
await backendManager.checkBackendHealth();
```

## Заключение

Новая система обработки ошибок обеспечивает:

- ✅ **Автоматическое восстановление** после сбоев
- ✅ **Информативные сообщения** для пользователей
- ✅ **Красивый UI** для отображения ошибок
- ✅ **Автоматический запуск** бэкенда
- ✅ **Подробное логирование** для отладки
- ✅ **Fallback данные** при недоступности сервера

Система значительно улучшает пользовательский опыт и снижает количество обращений в поддержку. 