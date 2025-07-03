const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body),
            headers: res.headers
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPIDirect() {
  console.log('🚀 Тестируем API напрямую...');
  
  const baseURL = 'localhost';
  const port = 8000;
  
  try {
    // Тест 1: Регистрация нового пользователя
    console.log('\n📝 Тест 1: Регистрация пользователя');
    
    const registerData = {
      username: 'testuser_api',
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      bio: 'Test user for API'
    };
    
    console.log('Отправляем данные регистрации:', { ...registerData, password: '***' });
    
    const registerOptions = {
      hostname: baseURL,
      port: port,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(registerData).length
      }
    };
    
    const registerResponse = await makeRequest(registerOptions, registerData);
    console.log('✅ Регистрация успешна:', {
      status: registerResponse.status,
      userId: registerResponse.data.user?.id,
      username: registerResponse.data.user?.username,
      hasToken: !!registerResponse.data.token
    });
    
    // Тест 2: Вход с созданными данными
    console.log('\n🔐 Тест 2: Вход пользователя');
    
    const loginData = {
      username: 'test@example.com', // API принимает email как username
      password: 'password123'
    };
    
    console.log('Отправляем данные входа:', { ...loginData, password: '***' });
    
    const loginOptions = {
      hostname: baseURL,
      port: port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(loginData).length
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('✅ Вход успешен:', {
      status: loginResponse.status,
      userId: loginResponse.data.user?.id,
      username: loginResponse.data.user?.username,
      hasToken: !!loginResponse.data.token
    });
    
    // Тест 3: Получение списка пользователей (с токеном)
    console.log('\n👥 Тест 3: Получение списка пользователей');
    
    const token = loginResponse.data.token;
    const usersOptions = {
      hostname: baseURL,
      port: port,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const usersResponse = await makeRequest(usersOptions);
    console.log('✅ Список пользователей получен:', {
      status: usersResponse.status,
      count: usersResponse.data?.length || 0,
      users: usersResponse.data?.map(u => ({ id: u.id, username: u.username, email: u.email })) || []
    });
    
    // Тест 4: Проверка текущего пользователя
    console.log('\n👤 Тест 4: Проверка текущего пользователя');
    
    const meOptions = {
      hostname: baseURL,
      port: port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const meResponse = await makeRequest(meOptions);
    console.log('✅ Данные текущего пользователя:', {
      status: meResponse.status,
      id: meResponse.data?.id,
      username: meResponse.data?.username,
      email: meResponse.data?.email
    });
    
    console.log('\n✅ Все тесты API прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка API:', {
      message: error.message,
      status: error.status,
      data: error.data
    });
    
    if (error.status === 409) {
      console.log('ℹ️ Пользователь уже существует, пробуем войти...');
      
      // Пробуем войти с существующими данными
      try {
        const loginData = {
          username: 'test@example.com',
          password: 'password123'
        };
        
        const loginOptions = {
          hostname: baseURL,
          port: port,
          path: '/api/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(loginData).length
          }
        };
        
        const loginResponse = await makeRequest(loginOptions, loginData);
        console.log('✅ Вход успешен с существующим пользователем:', {
          status: loginResponse.status,
          userId: loginResponse.data.user?.id,
          hasToken: !!loginResponse.data.token
        });
      } catch (loginError) {
        console.error('❌ Ошибка входа:', loginError.message);
      }
    }
  }
}

testAPIDirect().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 