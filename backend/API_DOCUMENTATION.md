# API Документация - Facebook-подобная платформа

## Базовый URL
```
http://localhost:8000/api
```

## Аутентификация
В настоящее время используется простая аутентификация через username/password. В будущем планируется добавить JWT токены.

## Эндпоинты

### Проверка здоровья API
```
GET /health
```

**Ответ:**
```json
{
  "status": "ok",
  "message": "Backend API is running!",
  "timestamp": "2025-07-01T23:02:52.661Z"
}
```

### Пользователи

#### Получить всех пользователей
```
GET /users
```

**Ответ:**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://via.placeholder.com/150",
    "bio": "Software developer",
    "created_at": "2025-07-01T22:50:53.077Z"
  }
]
```

#### Получить пользователя по ID
```
GET /users/:id
```

**Ответ:**
```json
{
  "id": 1,
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://via.placeholder.com/150",
  "bio": "Software developer",
  "location": "New York",
  "website": "https://johndoe.com",
  "created_at": "2025-07-01T22:50:53.077Z"
}
```

#### Регистрация нового пользователя
```
POST /users/register
```

**Тело запроса:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "Иван",
  "last_name": "Иванов",
  "bio": "Описание профиля"
}
```

**Ответ:**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": 4,
    "username": "new_user",
    "first_name": "Иван",
    "last_name": "Иванов",
    "email": "user@example.com",
    "created_at": "2025-07-01T23:05:00.000Z"
  }
}
```

#### Авторизация пользователя
```
POST /users/login
```

**Тело запроса:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "message": "Авторизация успешна",
  "user": {
    "id": 1,
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Обновление профиля пользователя
```
PUT /users/:id
```

**Тело запроса:**
```json
{
  "first_name": "Обновленное имя",
  "last_name": "Обновленная фамилия",
  "bio": "Новое описание",
  "location": "Москва",
  "website": "https://newwebsite.com",
  "avatar_url": "https://newavatar.com/image.jpg"
}
```

### Посты

#### Получить все посты
```
GET /posts?page=1&limit=10&section=general
```

**Параметры запроса:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество постов на странице (по умолчанию: 10)
- `section` - фильтр по разделу (опционально)

**Ответ:**
```json
{
  "posts": [
    {
      "id": 3,
      "content": "Тестовый пост через API!",
      "media_urls": null,
      "media_type": null,
      "background_color": null,
      "privacy": "public",
      "section": "general",
      "location": null,
      "is_ai_generated": false,
      "ai_prompt": null,
      "created_at": "2025-07-01T23:03:23.470Z",
      "updated_at": "2025-07-01T23:03:23.470Z",
      "user_id": 1,
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe",
      "avatar_url": "https://via.placeholder.com/150",
      "comment_count": "0",
      "reaction_count": "0",
      "reactions": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

#### Получить пост по ID
```
GET /posts/:id
```

**Ответ:**
```json
{
  "id": 3,
  "content": "Тестовый пост через API!",
  "media_urls": null,
  "media_type": null,
  "background_color": null,
  "privacy": "public",
  "section": "general",
  "location": null,
  "is_ai_generated": false,
  "ai_prompt": null,
  "created_at": "2025-07-01T23:03:23.470Z",
  "updated_at": "2025-07-01T23:03:23.470Z",
  "user_id": 1,
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://via.placeholder.com/150",
  "comments": [],
  "reactions": []
}
```

#### Создать новый пост
```
POST /posts
```

**Тело запроса:**
```json
{
  "user_id": 1,
  "content": "Новый пост с медиа!",
  "media_urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "media_type": "image",
  "background_color": "#ff6b6b",
  "privacy": "public",
  "section": "general",
  "location": "Москва",
  "is_ai_generated": false,
  "ai_prompt": "Создай пост о путешествиях"
}
```

**Ответ:**
```json
{
  "message": "Пост успешно создан",
  "post": {
    "id": 4,
    "content": "Новый пост с медиа!",
    "created_at": "2025-07-01T23:10:00.000Z"
  }
}
```

#### Обновить пост
```
PUT /posts/:id
```

**Тело запроса:**
```json
{
  "content": "Обновленный контент поста",
  "background_color": "#4ecdc4",
  "privacy": "friends"
}
```

#### Удалить пост
```
DELETE /posts/:id
```

**Ответ:**
```json
{
  "message": "Пост удален"
}
```

#### Получить посты пользователя
```
GET /posts/user/:userId?page=1&limit=10
```

## Структура базы данных

### Таблицы:
- `users` - пользователи
- `posts` - посты
- `comments` - комментарии
- `reactions` - реакции (лайки, эмодзи)
- `friendships` - дружба/подписки
- `notifications` - уведомления
- `chats` - чаты
- `messages` - сообщения
- `user_settings` - настройки пользователей
- `analytics` - аналитика
- `gamification` - геймификация

## Коды ошибок

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверный запрос
- `401` - Не авторизован
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Создание пользователя и поста

```bash
# 1. Регистрация пользователя
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Тест",
    "last_name": "Пользователь"
  }'

# 2. Создание поста
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "content": "Мой первый пост!",
    "privacy": "public"
  }'

# 3. Получение всех постов
curl http://localhost:8000/api/posts
```

## Планы развития

- [ ] JWT аутентификация
- [ ] OAuth через социальные сети
- [ ] Загрузка медиафайлов
- [ ] Real-time уведомления через WebSocket
- [ ] Система комментариев
- [ ] Система реакций
- [ ] Чат система
- [ ] Аналитика и геймификация 