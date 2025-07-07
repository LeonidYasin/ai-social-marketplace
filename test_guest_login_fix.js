const fetch = require('node-fetch');

async function testGuestLogin() {
  console.log('🧪 Тестирование гостевого входа...');
  
  try {
    // Тест 1: Регистрация гостевого пользователя
    console.log('\n1️⃣ Тестируем регистрацию гостевого пользователя...');
    
    const browserId = 'test_browser_' + Math.random().toString(36).slice(-6);
    const uniqueSuffix = Math.random().toString(36).slice(-6);
    const username = `guest_${browserId.slice(0, 8)}_${uniqueSuffix}`;
    const email = `guest_${browserId}_${uniqueSuffix}@example.com`;
    const password = Math.random().toString(36).slice(-8);
    
    const registerData = {
      username: username,
      email: email,
      password: password,
      first_name: 'Гость',
      last_name: browserId.slice(0, 4),
      bio: 'Гостевой пользователь'
    };
    
    console.log('📝 Данные для регистрации:', {
      username: registerData.username,
      email: registerData.email,
      first_name: registerData.first_name,
      last_name: registerData.last_name
    });
    
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    console.log('📊 Статус регистрации:', registerResponse.status);
    
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Регистрация успешна!');
      console.log('👤 Пользователь ID:', registerResult.user.id);
      console.log('🔑 Токен получен:', registerResult.token ? 'Да' : 'Нет');
      
      // Сохраняем данные для входа
      const guestData = {
        username: username,
        password: password,
        email: email
      };
      
      // Тест 2: Вход с созданными данными
      console.log('\n2️⃣ Тестируем вход с созданными данными...');
      
      const loginResponse = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });
      
      console.log('📊 Статус входа:', loginResponse.status);
      
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        console.log('✅ Вход успешен!');
        console.log('👤 Пользователь:', loginResult.user.username);
        console.log('🔑 Токен получен:', loginResult.token ? 'Да' : 'Нет');
        
        // Тест 3: Получение профиля с токеном
        console.log('\n3️⃣ Тестируем получение профиля с токеном...');
        
        const profileResponse = await fetch('http://localhost:8000/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log('📊 Статус получения профиля:', profileResponse.status);
        
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          console.log('✅ Профиль получен!');
          console.log('👤 Имя:', profileResult.user.first_name, profileResult.user.last_name);
          console.log('📧 Email:', profileResult.user.email);
        } else {
          console.log('❌ Ошибка получения профиля');
          const errorText = await profileResponse.text();
          console.log('🔍 Ошибка:', errorText);
        }
        
      } else {
        console.log('❌ Ошибка входа');
        const errorText = await loginResponse.text();
        console.log('🔍 Ошибка:', errorText);
      }
      
    } else {
      console.log('❌ Ошибка регистрации');
      const errorText = await registerResponse.text();
      console.log('🔍 Ошибка:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error('📋 Стек ошибки:', error.stack);
  }
}

// Запускаем тест
testGuestLogin().then(() => {
  console.log('\n🏁 Тест завершен');
  process.exit(0);
}).catch(error => {
  console.error('💥 Ошибка в тесте:', error);
  process.exit(1);
}); 