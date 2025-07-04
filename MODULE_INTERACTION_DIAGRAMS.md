# Диаграммы взаимодействия модулей

## 1. Общая архитектура системы

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   Frontend      │ ◄──────────────────► │    Backend      │
│   (React)       │                      │   (Node.js)     │
└─────────────────┘                      └─────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│   Browser       │                      │   PostgreSQL    │
│   Storage       │                      │   Database      │
└─────────────────┘                      └─────────────────┘
```

## 2. Поток аутентификации

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Frontend   │    │  Backend    │    │   Google    │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Click Login    │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ 2. Redirect to    │                   │
       │                   │ OAuth URL         │                   │
       │                   │──────────────────►│                   │
       │                   │                   │ 3. OAuth Request  │
       │                   │                   │──────────────────►│
       │                   │                   │                   │ 4. User Auth
       │                   │                   │                   │◄─────────────────
       │                   │                   │ 5. OAuth Callback │
       │                   │                   │◄──────────────────│
       │                   │ 6. JWT Token      │                   │
       │                   │◄──────────────────│                   │
       │ 7. App Ready      │                   │                   │
       │◄──────────────────│                   │                   │
```

## 3. Поток создания поста

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Frontend   │    │  Backend    │    │  Database   │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Create Post    │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ 2. POST /api/posts│                   │
       │                   │ (with JWT)        │                   │
       │                   │──────────────────►│                   │
       │                   │                   │ 3. Validate Token │
       │                   │                   │──────────────────►│
       │                   │                   │ 4. Save Post      │
       │                   │                   │──────────────────►│
       │                   │                   │ 5. Post Created   │
       │                   │                   │◄──────────────────│
       │                   │ 6. Success        │                   │
       │                   │ Response          │                   │
       │                   │◄──────────────────│                   │
       │ 7. UI Updated     │                   │                   │
       │◄──────────────────│                   │                   │
```

## 4. WebSocket поток сообщений

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  User A     │    │  Frontend   │    │  Backend    │    │  User B     │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Send Message   │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ 2. 'sendMessage'  │                   │
       │                   │ WebSocket Event   │                   │
       │                   │──────────────────►│                   │
       │                   │                   │ 3. Save to DB     │
       │                   │                   │──────────────────►│
       │                   │                   │ 4. 'newMessage'   │
       │                   │                   │ Event to User B   │
       │                   │                   │──────────────────►│
       │                   │                   │                   │ 5. Receive
       │                   │                   │                   │ Message
       │                   │                   │                   │◄─────────────────
       │                   │ 6. 'messageSent'  │                   │
       │                   │ Confirmation      │                   │
       │                   │◄──────────────────│                   │
       │ 7. UI Updated     │                   │                   │
       │◄──────────────────│                   │                   │
```

## 5. Структура компонентов Frontend

```
App.jsx
├── AppBar.jsx
├── SidebarLeft.jsx
├── SidebarRight.jsx
├── Feed.jsx
│   └── PostCard.jsx
├── ChatDialog.jsx
├── Analytics.jsx
├── Notifications.jsx
├── Gamification.jsx
├── UserSettings.jsx
└── Search.jsx
```

## 6. Структура Backend

```
app.js (Main Server)
├── Routes
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── reactions.js
│   ├── feed.js
│   ├── messages.js
│   └── telegram.js
├── Controllers
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   ├── messageController.js
│   └── telegramController.js
├── Models
│   ├── user.js
│   ├── post.js
│   ├── comment.js
│   ├── reaction.js
│   └── message.js
├── Middleware
│   └── checkAdmin.js
├── Utils
│   └── db.js
└── WebSocket (Socket.io)
```

## 7. Поток данных в состоянии Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    App State                                │
├─────────────────────────────────────────────────────────────┤
│ currentUser: {                                              │
│   id: "123",                                                │
│   name: "John Doe",                                         │
│   email: "john@example.com",                                │
│   username: "johndoe"                                       │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ chats: {                                                    │
│   "user456": {                                              │
│     userId: "user456",                                      │
│     messages: [                                             │
│       { text: "Hello", isUser: true, timestamp: 1234567890 }│
│     ]                                                       │
│   }                                                         │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ feedData: {                                                 │
│   posts: [                                                  │
│     { id: "1", content: "Post content", user_id: "123" }   │
│   ],                                                        │
│   userReactions: { "1": "like" },                          │
│   comments: { "1": [...] }                                 │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ realUsers: [                                                │
│   { id: "456", name: "Jane Doe", username: "janedoe" }     │
│ ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

## 8. Схема базы данных

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     users       │    │     posts       │    │   comments      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ username        │◄───┤ user_id (FK)    │◄───┤ post_id (FK)    │
│ email           │    │ content         │    │ user_id (FK)    │
│ first_name      │    │ privacy         │    │ created_at      │
│ last_name       │    │ created_at      │    │ updated_at      │
│ avatar_url      │    │ updated_at      │    │ content         │
│ google_id       │    └─────────────────┘    └─────────────────┘
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   reactions     │    │    messages     │    │ notifications   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ user_id (FK)    │    │ sender_id (FK)  │    │ user_id (FK)    │
│ post_id (FK)    │    │ receiver_id (FK)│    │ from_user_id    │
│ reaction_type   │    │ content         │    │ notification_type│
│ created_at      │    │ created_at      │    │ content         │
└─────────────────┘    └─────────────────┘    │ is_read         │
                                              │ created_at      │
                                              └─────────────────┘
```

## 9. Поток ошибок и обработка

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │  Backend    │    │  Database   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. API Request    │                   │
       │──────────────────►│                   │
       │                   │ 2. DB Query       │
       │                   │──────────────────►│
       │                   │                   │ 3. DB Error
       │                   │                   │◄─────────────────
       │                   │ 4. Error Handler  │
       │                   │◄──────────────────│
       │ 5. Error Response │                   │
       │◄──────────────────│                   │
       │ 6. UI Error       │                   │
       │ Display           │                   │
       │◄──────────────────│                   │
```

## 10. Поток кэширования и оптимизации

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │  Backend    │    │  Database   │
│   Cache     │    │   Cache     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Check Local    │                   │
       │ Cache             │                   │
       │◄──────────────────│                   │
       │ 2. Cache Miss     │                   │
       │──────────────────►│                   │
       │                   │ 3. Check Server   │
       │                   │ Cache             │
       │                   │◄──────────────────│
       │                   │ 4. Cache Miss     │
       │                   │──────────────────►│
       │                   │                   │ 5. DB Query
       │                   │                   │◄─────────────────
       │                   │ 6. Cache Response │
       │                   │◄──────────────────│
       │ 7. Cache Response │                   │
       │◄──────────────────│                   │
```

## 11. Поток уведомлений

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  User A     │    │  Backend    │    │  Database   │    │  User B     │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Like Post      │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ 2. Save Reaction  │                   │
       │                   │──────────────────►│                   │
       │                   │ 3. Create         │                   │
       │                   │ Notification      │                   │
       │                   │──────────────────►│                   │
       │                   │ 4. WebSocket      │                   │
       │                   │ Notification      │                   │
       │                   │──────────────────►│                   │
       │                   │                   │                   │ 5. Receive
       │                   │                   │                   │ Notification
       │                   │                   │                   │◄─────────────────
```

## 12. Поток поиска

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │  Backend    │    │  Database   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Search Query   │                   │
       │──────────────────►│                   │
       │                   │ 2. Search Users   │
       │                   │──────────────────►│
       │                   │ 3. Search Posts   │
       │                   │──────────────────►│
       │                   │ 4. Combined       │
       │                   │ Results           │
       │                   │◄──────────────────│
       │ 5. Search Results │                   │
       │◄──────────────────│                   │
       │ 6. Display        │                   │
       │ Results           │                   │
       │◄──────────────────│                   │
```

Эти диаграммы показывают основные потоки данных и взаимодействия между модулями системы, что поможет в отладке и тестировании. 