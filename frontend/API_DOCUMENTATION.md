# API Documentation for Facebook-like Marketplace

## Overview
This document describes the API endpoints that the frontend expects from the Telegram backend.

## Base URL
- Development: `http://localhost:8000`
- Production: `https://your-domain.com`

## Authentication
All API requests (except public endpoints) require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Posts

#### GET /api/posts
Get all posts with optional filtering.

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of posts per page
- `category` (string): Filter by category
- `userId` (string): Filter by user ID

**Response:**
```json
{
  "posts": [
    {
      "id": "string",
      "userId": "string",
      "content": "string",
      "images": ["string"],
      "category": "string",
      "price": "number",
      "location": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "reactions": {
        "likes": 10,
        "hearts": 5,
        "laughs": 2
      },
      "commentsCount": 15,
      "views": 100
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### GET /api/posts/:id
Get a specific post by ID.

**Response:**
```json
{
  "id": "string",
  "userId": "string",
  "content": "string",
  "images": ["string"],
  "category": "string",
  "price": "number",
  "location": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "reactions": {
    "likes": 10,
    "hearts": 5,
    "laughs": 2
  },
  "comments": [
    {
      "id": "string",
      "userId": "string",
      "content": "string",
      "createdAt": "string"
    }
  ],
  "views": 100
}
```

#### POST /api/posts
Create a new post.

**Request Body:**
```json
{
  "content": "string",
  "images": ["string"],
  "category": "string",
  "price": "number",
  "location": "string"
}
```

#### PUT /api/posts/:id
Update an existing post.

#### DELETE /api/posts/:id
Delete a post.

#### POST /api/posts/:id/reactions
Add a reaction to a post.

**Request Body:**
```json
{
  "reaction": "like" | "heart" | "laugh" | "wow" | "sad" | "angry"
}
```

#### DELETE /api/posts/:id/reactions
Remove a reaction from a post.

**Query Parameters:**
- `reaction` (string): Type of reaction to remove

#### GET /api/posts/:id/comments
Get comments for a post.

#### POST /api/posts/:id/comments
Add a comment to a post.

**Request Body:**
```json
{
  "content": "string"
}
```

### Users

#### GET /api/users
Get all users.

#### GET /api/users/:id
Get user by ID.

**Response:**
```json
{
  "id": "string",
  "telegramId": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "avatar": "string",
  "rating": "number",
  "createdAt": "string",
  "isVerified": "boolean"
}
```

#### GET /api/users/:id/profile
Get detailed user profile.

#### PUT /api/users/:id/profile
Update user profile.

### Chat

#### GET /api/chat/messages
Get chat messages.

**Query Parameters:**
- `chatId` (string): Chat ID

#### POST /api/chat/send
Send a message.

**Request Body:**
```json
{
  "chatId": "string",
  "content": "string",
  "type": "text" | "image" | "file"
}
```

#### POST /api/chat/ai
Send message to AI assistant.

**Request Body:**
```json
{
  "message": "string",
  "context": "string"
}
```

### Telegram Integration

#### POST /api/telegram/auth
Authenticate user via Telegram.

**Request Body:**
```json
{
  "id": "number",
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "photo_url": "string",
  "auth_date": "number",
  "hash": "string"
}
```

#### POST /api/telegram/webhook
Telegram webhook endpoint for receiving updates.

#### POST /api/telegram/send
Send message via Telegram bot.

**Request Body:**
```json
{
  "chatId": "string",
  "message": "string",
  "parseMode": "HTML" | "Markdown"
}
```

### Analytics

#### GET /api/analytics
Get general analytics.

**Response:**
```json
{
  "totalUsers": 1000,
  "totalPosts": 5000,
  "totalReactions": 15000,
  "totalComments": 8000,
  "activeUsers": 150,
  "postsToday": 25,
  "reactionsToday": 300
}
```

#### GET /api/analytics/users/:id/stats
Get user statistics.

**Response:**
```json
{
  "userId": "string",
  "totalPosts": 50,
  "totalReactions": 500,
  "totalComments": 200,
  "totalViews": 5000,
  "rating": 4.8,
  "achievements": 15
}
```

### Search

#### POST /api/search
General search across all content.

**Request Body:**
```json
{
  "query": "string",
  "filters": {
    "category": "string",
    "priceMin": "number",
    "priceMax": "number",
    "location": "string"
  }
}
```

#### POST /api/search/posts
Search posts specifically.

#### POST /api/search/users
Search users.

### Notifications

#### GET /api/notifications
Get user notifications.

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "reaction" | "comment" | "message" | "achievement",
      "title": "string",
      "message": "string",
      "isRead": "boolean",
      "createdAt": "string",
      "data": {}
    }
  ]
}
```

#### PATCH /api/notifications/:id/read
Mark notification as read.

### Gamification

#### GET /api/achievements
Get all available achievements.

#### GET /api/users/:id/achievements
Get user achievements.

#### GET /api/leaderboard
Get leaderboard.

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": "string",
      "username": "string",
      "avatar": "string",
      "score": 1000,
      "level": 10,
      "achievements": 15
    }
  ]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- General endpoints: 100 requests per minute
- Search endpoints: 30 requests per minute
- Chat endpoints: 60 requests per minute

## WebSocket Events

For real-time features, the backend should support WebSocket connections:

### Events to send to client:
- `post_created`: New post created
- `post_updated`: Post updated
- `reaction_added`: Reaction added to post
- `comment_added`: Comment added to post
- `message_received`: New chat message
- `notification`: New notification

### Events to receive from client:
- `user_typing`: User is typing in chat
- `user_online`: User came online
- `user_offline`: User went offline

## Environment Variables

The frontend expects these environment variables:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token
REACT_APP_TELEGRAM_WEBHOOK=http://localhost:8000/webhook
``` 