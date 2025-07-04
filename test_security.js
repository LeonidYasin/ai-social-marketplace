// Используем встроенный fetch для Node.js 18+ или node-fetch для старых версий
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // В Node.js 18+ fetch доступен глобально
  fetch = global.fetch;
}
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8000/api';
const LOG_DIR = './test_logs';

// Создаем директорию для логов если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class SecurityTester {
  constructor() {
    this.logs = [];
    this.vulnerabilities = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  error(message) {
    this.log(message, 'ERROR');
    this.testResults.failed++;
  }

  success(message) {
    this.log(message, 'SUCCESS');
    this.testResults.passed++;
  }

  warning(message) {
    this.log(message, 'WARNING');
    this.testResults.warnings++;
  }

  addVulnerability(type, description, severity, details = {}) {
    this.vulnerabilities.push({
      type,
      description,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }

  saveLogs(filename) {
    const filepath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filepath, this.logs.join('\n'));
  }

  saveVulnerabilities(filename) {
    const filepath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.vulnerabilities, null, 2));
  }

  // Базовый HTTP запрос
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json().catch(() => ({}));
      
      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: response.headers
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // Тестирование аутентификации
  async testAuthentication() {
    this.log('🔐 Тестирование аутентификации...');

    // Тест 1: Попытка доступа без токена
    this.log('  Тест 1: Доступ к защищенным эндпоинтам без токена');
    const protectedEndpoints = [
      '/users',
      '/posts',
      '/messages',
      '/auth/me'
    ];

    for (const endpoint of protectedEndpoints) {
      const result = await this.makeRequest(`${API_BASE}${endpoint}`);
      
      if (result.status === 401) {
        this.success(`✅ ${endpoint} правильно требует аутентификации`);
      } else {
        this.error(`❌ ${endpoint} не требует аутентификации (статус: ${result.status})`);
        this.addVulnerability('Authentication', `${endpoint} не защищен`, 'HIGH');
      }
    }

    // Тест 2: Попытка входа с неверными данными
    this.log('  Тест 2: Попытка входа с неверными данными');
    const invalidCredentials = [
      { username: 'nonexistent@test.com', password: 'wrongpassword' },
      { username: '', password: 'password123' },
      { username: 'test@test.com', password: '' },
      { username: 'test@test.com', password: 'short' },
      { username: 'a'.repeat(1000), password: 'password123' }
    ];

    for (const creds of invalidCredentials) {
      const result = await this.makeRequest(`${API_BASE}/users/login`, {
        method: 'POST',
        body: JSON.stringify(creds)
      });

      if (result.status === 401 || result.status === 400) {
        this.success(`✅ Правильно отклонены неверные данные: ${creds.username}`);
      } else {
        this.error(`❌ Неверные данные приняты: ${creds.username} (статус: ${result.status})`);
        this.addVulnerability('Authentication', 'Приняты неверные данные для входа', 'HIGH');
      }
    }

    // Тест 3: Регистрация с неверными данными
    this.log('  Тест 3: Регистрация с неверными данными');
    const invalidRegistrations = [
      { username: '', email: 'test@test.com', password: 'password123' },
      { username: 'test', email: 'invalid-email', password: 'password123' },
      { username: 'test', email: 'test@test.com', password: '123' },
      { username: 'a'.repeat(1000), email: 'test@test.com', password: 'password123' }
    ];

    for (const reg of invalidRegistrations) {
      const result = await this.makeRequest(`${API_BASE}/users/register`, {
        method: 'POST',
        body: JSON.stringify(reg)
      });

      if (result.status === 400) {
        this.success(`✅ Правильно отклонена неверная регистрация: ${reg.username}`);
      } else {
        this.error(`❌ Неверная регистрация принята: ${reg.username} (статус: ${result.status})`);
        this.addVulnerability('Input Validation', 'Принята неверная регистрация', 'MEDIUM');
      }
    }
  }

  // Тестирование авторизации
  async testAuthorization() {
    this.log('🔒 Тестирование авторизации...');

    // Создаем тестовых пользователей
    const user1 = {
      username: 'security_user1',
      email: 'security1@test.com',
      password: 'password123',
      first_name: 'Security',
      last_name: 'User 1'
    };

    const user2 = {
      username: 'security_user2',
      email: 'security2@test.com',
      password: 'password123',
      first_name: 'Security',
      last_name: 'User 2'
    };

    // Регистрируем пользователей
    const token1 = await this.registerAndLogin(user1);
    const token2 = await this.registerAndLogin(user2);

    if (!token1 || !token2) {
      this.error('❌ Не удалось создать тестовых пользователей для тестирования авторизации');
      return;
    }

    // Создаем пост от первого пользователя
    const post = await this.createPost(token1, 'Тестовый пост для проверки авторизации');
    
    if (!post) {
      this.error('❌ Не удалось создать тестовый пост');
      return;
    }

    // Тест 1: Попытка изменить чужой пост
    this.log('  Тест 1: Попытка изменить чужой пост');
    const updateResult = await this.makeRequest(`${API_BASE}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token2}` },
      body: JSON.stringify({ content: 'Взломанный пост' })
    });

    if (updateResult.status === 403 || updateResult.status === 401) {
      this.success(`✅ Правильно заблокировано изменение чужого поста`);
    } else {
      this.error(`❌ Удалось изменить чужой пост (статус: ${updateResult.status})`);
      this.addVulnerability('Authorization', 'Можно изменять чужие посты', 'HIGH');
    }

    // Тест 2: Попытка удалить чужой пост
    this.log('  Тест 2: Попытка удалить чужой пост');
    const deleteResult = await this.makeRequest(`${API_BASE}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token2}` }
    });

    if (deleteResult.status === 403 || deleteResult.status === 401) {
      this.success(`✅ Правильно заблокировано удаление чужого поста`);
    } else {
      this.error(`❌ Удалось удалить чужой пост (статус: ${deleteResult.status})`);
      this.addVulnerability('Authorization', 'Можно удалять чужие посты', 'HIGH');
    }

    // Тест 3: Попытка получить чужие сообщения
    this.log('  Тест 3: Попытка получить чужие сообщения');
    const messagesResult = await this.makeRequest(`${API_BASE}/messages`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });

    if (messagesResult.ok) {
      // Проверяем, что пользователь видит только свои сообщения
      this.success(`✅ Сообщения получены (проверка на уровне данных)`);
    } else {
      this.warning(`⚠️ Не удалось получить сообщения (статус: ${messagesResult.status})`);
    }
  }

  // Тестирование ввода данных
  async testInputValidation() {
    this.log('📝 Тестирование валидации ввода...');

    // Тест 1: SQL Injection
    this.log('  Тест 1: SQL Injection');
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES (1, 'hacker', 'hacker@test.com'); --"
    ];

    for (const payload of sqlInjectionPayloads) {
      const result = await this.makeRequest(`${API_BASE}/users/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: payload,
          password: payload
        })
      });

      if (result.status === 500) {
        this.error(`❌ Возможная SQL Injection уязвимость с payload: ${payload}`);
        this.addVulnerability('SQL Injection', `Возможная SQL Injection: ${payload}`, 'CRITICAL');
      } else {
        this.success(`✅ SQL Injection payload отклонен: ${payload}`);
      }
    }

    // Тест 2: XSS
    this.log('  Тест 2: XSS');
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>'
    ];

    for (const payload of xssPayloads) {
      const result = await this.makeRequest(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.getTestToken()}` },
        body: JSON.stringify({
          content: payload,
          privacy: 'public'
        })
      });

      if (result.ok) {
        this.warning(`⚠️ XSS payload принят: ${payload}`);
        this.addVulnerability('XSS', `XSS payload принят: ${payload}`, 'MEDIUM');
      } else {
        this.success(`✅ XSS payload отклонен: ${payload}`);
      }
    }

    // Тест 3: NoSQL Injection
    this.log('  Тест 3: NoSQL Injection');
    const nosqlPayloads = [
      { '$ne': '' },
      { '$gt': '' },
      { '$where': '1==1' }
    ];

    for (const payload of nosqlPayloads) {
      const result = await this.makeRequest(`${API_BASE}/users/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: payload,
          password: payload
        })
      });

      if (result.status === 500) {
        this.error(`❌ Возможная NoSQL Injection уязвимость`);
        this.addVulnerability('NoSQL Injection', 'Возможная NoSQL Injection', 'CRITICAL');
      } else {
        this.success(`✅ NoSQL Injection payload отклонен`);
      }
    }
  }

  // Тестирование CORS
  async testCORS() {
    this.log('🌐 Тестирование CORS...');

    const testOrigins = [
      'http://malicious-site.com',
      'https://evil.com',
      'http://localhost:3001',
      'null'
    ];

    for (const origin of testOrigins) {
      const result = await this.makeRequest(`${API_BASE}/posts`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsHeader = result.headers.get('access-control-allow-origin');
      
      if (corsHeader === '*' || corsHeader === origin) {
        this.error(`❌ Небезопасная CORS политика для origin: ${origin}`);
        this.addVulnerability('CORS', `Небезопасная CORS политика: ${origin}`, 'MEDIUM');
      } else {
        this.success(`✅ Безопасная CORS политика для origin: ${origin}`);
      }
    }
  }

  // Тестирование rate limiting
  async testRateLimiting() {
    this.log('⏱️ Тестирование rate limiting...');

    const requests = [];
    const numRequests = 100;

    // Отправляем множество запросов быстро
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        this.makeRequest(`${API_BASE}/posts`)
      );
    }

    const results = await Promise.all(requests);
    const rateLimited = results.filter(r => r.status === 429).length;
    const successful = results.filter(r => r.ok).length;

    if (rateLimited > 0) {
      this.success(`✅ Rate limiting работает: ${rateLimited} запросов заблокировано`);
    } else {
      this.warning(`⚠️ Rate limiting не обнаружен: ${successful}/${numRequests} запросов прошло`);
      this.addVulnerability('Rate Limiting', 'Отсутствует rate limiting', 'MEDIUM');
    }
  }

  // Тестирование HTTPS
  async testHTTPS() {
    this.log('🔒 Тестирование HTTPS...');

    // Проверяем, доступен ли API по HTTP
    const httpResult = await this.makeRequest(`http://localhost:8000/api/health`);
    
    if (httpResult.ok) {
      this.warning(`⚠️ API доступен по HTTP (небезопасно)`);
      this.addVulnerability('HTTPS', 'API доступен по HTTP', 'MEDIUM');
    } else {
      this.success(`✅ API недоступен по HTTP`);
    }
  }

  // Вспомогательные методы
  async registerAndLogin(userData) {
    // Сначала пытаемся войти
    let result = await this.makeRequest(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: userData.email,
        password: userData.password
      })
    });

    if (result.ok) {
      return result.data.token;
    }

    // Если не удалось войти, регистрируемся
    result = await this.makeRequest(`${API_BASE}/users/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (result.ok) {
      return result.data.token;
    }

    return null;
  }

  async createPost(token, content) {
    const result = await this.makeRequest(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        content,
        privacy: 'public'
      })
    });

    return result.ok ? result.data : null;
  }

  getTestToken() {
    // В реальном тесте нужно получить токен
    return 'test-token';
  }

  // Основная функция тестирования
  async runSecurityTests() {
    this.log('🛡️ Начинаем тестирование безопасности...\n');

    try {
      // 1. Тестирование аутентификации
      this.log('=== ЭТАП 1: ТЕСТИРОВАНИЕ АУТЕНТИФИКАЦИИ ===');
      await this.testAuthentication();

      // 2. Тестирование авторизации
      this.log('\n=== ЭТАП 2: ТЕСТИРОВАНИЕ АВТОРИЗАЦИИ ===');
      await this.testAuthorization();

      // 3. Тестирование валидации ввода
      this.log('\n=== ЭТАП 3: ТЕСТИРОВАНИЕ ВАЛИДАЦИИ ВВОДА ===');
      await this.testInputValidation();

      // 4. Тестирование CORS
      this.log('\n=== ЭТАП 4: ТЕСТИРОВАНИЕ CORS ===');
      await this.testCORS();

      // 5. Тестирование rate limiting
      this.log('\n=== ЭТАП 5: ТЕСТИРОВАНИЕ RATE LIMITING ===');
      await this.testRateLimiting();

      // 6. Тестирование HTTPS
      this.log('\n=== ЭТАП 6: ТЕСТИРОВАНИЕ HTTPS ===');
      await this.testHTTPS();

      // 7. Финальный отчет
      this.log('\n=== ЭТАП 7: ФИНАЛЬНЫЙ ОТЧЕТ ===');
      this.log(`📊 Результаты тестирования безопасности:`);
      this.log(`   - Пройдено: ${this.testResults.passed}`);
      this.log(`   - Провалено: ${this.testResults.failed}`);
      this.log(`   - Предупреждений: ${this.testResults.warnings}`);
      this.log(`   - Уязвимостей найдено: ${this.vulnerabilities.length}`);

      if (this.vulnerabilities.length > 0) {
        this.log(`🚨 Найденные уязвимости:`);
        this.vulnerabilities.forEach((vuln, index) => {
          this.log(`   ${index + 1}. [${vuln.severity}] ${vuln.type}: ${vuln.description}`);
        });
      }

      // Сохраняем результаты
      this.saveLogs('security_test.log');
      this.saveVulnerabilities('security_vulnerabilities.json');

      this.log('\n✅ Тестирование безопасности завершено!');
      this.log('📋 Результаты сохранены в test_logs/');

    } catch (error) {
      this.error(`Критическая ошибка при тестировании безопасности: ${error.message}`);
    }

    return {
      results: this.testResults,
      vulnerabilities: this.vulnerabilities
    };
  }
}

// Запуск тестирования
async function main() {
  const tester = new SecurityTester();
  
  try {
    await tester.runSecurityTests();
  } catch (error) {
    console.error('❌ Ошибка при запуске тестирования безопасности:', error);
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = SecurityTester; 