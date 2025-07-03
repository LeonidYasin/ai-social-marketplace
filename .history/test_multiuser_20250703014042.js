const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

// Тестовые пользователи
const testUsers = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'password123',
    first_name: 'Тест',
    last_name: 'Пользователь 1'
  },
  {
    username: 'testuser2', 
    email: 'test2@example.com',
    password: 'password123',
    first_name: 'Тест',
    last_name: 'Пользователь 2'
  },
  {
    username: 'testuser3',
    email: 'test3@example.com', 
    password: 'password123',
    first_name: 'Тест',
    last_name: 'Пользователь 3'
  }
];

// Функция для регистрации пользователя
async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Пользователь ${userData.username} зарегистрирован:`, data.user.id);
      return data.token;
    } else {
      const error = await response.json();
      console.log(`❌ Ошибка регистрации ${userData.username}:`, error.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Ошибка при регистрации ${userData.username}:`, error.message);
    return null;
  }
}

// Функция для входа пользователя
async function loginUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: userData.email,
        password: userData.password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Пользователь ${userData.username} вошел:`, data.user.id);
      return data.token;
    } else {
      const error = await response.json();
      console.log(`❌ Ошибка входа ${userData.username}:`, error.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Ошибка при входе ${userData.username}:`, error.message);
    return null;
  }
}

// Функция для получения списка пользователей
async function getUsers(token) {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      console.log(`📋 Список пользователей (${users.length}):`);
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.first_name} ${user.last_name})`);
      });
      return users;
    } else {
      const error = await response.json();
      console.log(`❌ Ошибка получения пользователей:`, error.error);
      return [];
    }
  } catch (error) {
    console.error(`❌ Ошибка при получении пользователей:`, error.message);
    return [];
  }
}

// Функция для получения текущего пользователя
async function getCurrentUser(token) {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log(`👤 Текущий пользователь: ${user.username} (${user.first_name} ${user.last_name})`);
      return user;
    } else {
      const error = await response.json();
      console.log(`❌ Ошибка получения текущего пользователя:`, error.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Ошибка при получении текущего пользователя:`, error.message);
    return null;
  }
}

// Основная функция тестирования
async function testMultiUser() {
  console.log('🚀 Начинаем тестирование многопользовательской работы...\n');
  
  const tokens = [];
  
  // Регистрируем пользователей
  console.log('📝 Регистрация пользователей:');
  for (const userData of testUsers) {
    const token = await registerUser(userData);
    if (token) {
      tokens.push({ user: userData.username, token });
    }
  }
  
  console.log('\n🔐 Вход пользователей:');
  // Пытаемся войти с теми же данными
  for (const userData of testUsers) {
    const token = await loginUser(userData);
    if (token) {
      // Обновляем токен если он новый
      const existingIndex = tokens.findIndex(t => t.user === userData.username);
      if (existingIndex >= 0) {
        tokens[existingIndex].token = token;
      } else {
        tokens.push({ user: userData.username, token });
      }
    }
  }
  
  console.log('\n👥 Тестирование доступа к данным:');
  // Тестируем доступ к данным с разными токенами
  for (const { user, token } of tokens) {
    console.log(`\n--- Пользователь: ${user} ---`);
    await getCurrentUser(token);
    await getUsers(token);
  }
  
  console.log('\n✅ Тестирование завершено!');
  console.log(`📊 Всего активных токенов: ${tokens.length}`);
}

// Запускаем тест
testMultiUser().catch(console.error); 