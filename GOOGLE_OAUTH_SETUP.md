# 🚀 Настройка Google OAuth для социальной сети

## ⚠️ Ошибка "invalid_client" - что делать?

Если вы видите ошибку "The OAuth client was not found" или "invalid_client", это означает, что Google OAuth не настроен правильно. Следуйте этой инструкции:

## 📋 Шаг 1: Создание проекта в Google Cloud Console

1. **Перейдите** на [Google Cloud Console](https://console.cloud.google.com/)
2. **Войдите** в свой Google аккаунт
3. **Создайте новый проект**:
   - Нажмите на выпадающий список проектов вверху
   - Выберите "New Project"
   - Введите название: `Social Marketplace`
   - Нажмите "Create"

## 🔧 Шаг 2: Включение Google+ API

1. **Перейдите** в "APIs & Services" > "Library"
2. **Найдите** "Google+ API" в поиске
3. **Нажмите** на "Google+ API"
4. **Нажмите** "Enable" (Включить)

## 🔑 Шаг 3: Создание OAuth 2.0 учетных данных

1. **Перейдите** в "APIs & Services" > "Credentials"
2. **Нажмите** "Create Credentials" > "OAuth 2.0 Client IDs"
3. **Выберите** тип приложения "Web application"
4. **Заполните форму**:
   - **Name**: `Social Marketplace`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8000/api/auth/google/callback
     ```
5. **Нажмите** "Create"

## 📝 Шаг 4: Получение учетных данных

После создания вы получите:
- **Client ID** (например: `123456789-abcdef.apps.googleusercontent.com`)
- **Client Secret** (например: `GOCSPX-abcdefghijklmnop`)

**⚠️ Сохраните эти данные!**

## ⚙️ Шаг 5: Обновление конфигурации

1. **Откройте** файл `backend/config.env`
2. **Замените** значения на ваши:
   ```env
   GOOGLE_CLIENT_ID=ваш-реальный-client-id
   GOOGLE_CLIENT_SECRET=ваш-реальный-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
   ```

## 🔄 Шаг 6: Перезапуск серверов

1. **Остановите** бэкенд (Ctrl+C)
2. **Запустите** заново:
   ```bash
   cd backend
   npm start
   ```

## 🧪 Шаг 7: Тестирование

1. **Откройте** http://localhost:3000
2. **Нажмите** "Настройки пользователя"
3. **Выберите** "Google" для входа
4. **Выполните** авторизацию в Google
5. **Вы должны быть** перенаправлены обратно в приложение

## 🔒 Безопасность

⚠️ **Важно**: 
- **Никогда не коммитьте** `config.env` в Git
- **В продакшене используйте** HTTPS
- **Обновите redirect URIs** для продакшена
- **Используйте сильные секреты**

## 🛠️ Устранение неполадок

### Ошибка "redirect_uri_mismatch"
- Проверьте, что redirect URI в Google Console точно совпадает с `GOOGLE_CALLBACK_URL`
- Убедитесь, что нет лишних пробелов

### Ошибка "invalid_client"
- Проверьте Client ID и Client Secret
- Убедитесь, что API включен
- Проверьте, что проект выбран правильно

### Ошибка CORS
- Проверьте настройки CORS в `backend/src/app.js`
- Убедитесь, что фронтенд работает на http://localhost:3000

## 🌐 Для продакшена

1. **Обновите Authorized origins**:
   ```
   https://yourdomain.com
   ```
2. **Обновите Redirect URIs**:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```
3. **Включите HTTPS** в настройках сессий
4. **Используйте переменные окружения** для секретов

## 📞 Поддержка

Если у вас возникли проблемы:
1. Проверьте, что все шаги выполнены точно
2. Убедитесь, что API включен в Google Cloud Console
3. Проверьте, что учетные данные скопированы правильно
4. Перезапустите серверы после изменения конфигурации

## Шаг 8: Обновление базы данных

Запустите SQL скрипт для добавления поля `google_id`:

```sql
-- Добавить поле google_id в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE;

-- Создать индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

## Дополнительные настройки

### Для продакшена:
1. Обновите Authorized origins:
   ```
   https://yourdomain.com
   ```
2. Обновите Redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```
3. Включите HTTPS в настройках сессий
4. Используйте переменные окружения для секретов 