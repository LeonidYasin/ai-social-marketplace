# 🚨 Быстрое исправление ошибки Google OAuth

## ❌ Ошибка: "The OAuth client was not found" / "invalid_client"

### 🔧 Быстрое решение:

1. **Откройте** [Google Cloud Console](https://console.cloud.google.com/)
2. **Создайте проект** (если нет):
   - Нажмите на выпадающий список проектов
   - Выберите "New Project"
   - Название: `Social Marketplace`
   - Нажмите "Create"

3. **Включите API**:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Google+ API"
   - Нажмите "Enable"

4. **Создайте OAuth 2.0 Client ID**:
   - Перейдите в "APIs & Services" > "Credentials"
   - Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
   - Тип: "Web application"
   - Name: `Social Marketplace`
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:8000/api/auth/google/callback`
   - Нажмите "Create"

5. **Скопируйте данные**:
   - Client ID (например: `123456789-abcdef.apps.googleusercontent.com`)
   - Client Secret (например: `GOCSPX-abcdefghijklmnop`)

6. **Обновите конфигурацию**:
   - Откройте `backend/config.env`
   - Замените:
     ```env
     GOOGLE_CLIENT_ID=ваш-реальный-client-id
     GOOGLE_CLIENT_SECRET=ваш-реальный-client-secret
     ```

7. **Перезапустите бэкенд**:
   ```bash
   cd backend
   npm start
   ```

8. **Протестируйте**:
   - Откройте http://localhost:3000
   - Нажмите "Google" для входа

### 📋 Подробная инструкция:
См. файл `GOOGLE_OAUTH_SETUP.md`

### 🆘 Если не работает:
1. Проверьте, что API включен
2. Убедитесь, что данные скопированы правильно
3. Перезапустите серверы
4. Очистите кэш браузера 