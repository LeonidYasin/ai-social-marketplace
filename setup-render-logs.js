const axios = require('axios');

class RenderLogsSetup {
  constructor(serviceUrl) {
    this.serviceUrl = serviceUrl;
    this.syslogEndpoint = `${serviceUrl}:514`;
  }

  async checkSyslogStatus() {
    try {
      const response = await axios.get(`${this.serviceUrl}/api/syslog/status`);
      console.log('✅ Syslog сервер работает:', response.data.data);
      return true;
    } catch (error) {
      console.error('❌ Syslog сервер недоступен:', error.message);
      return false;
    }
  }

  async testSyslogConnection() {
    try {
      // Отправляем тестовое сообщение
      const dgram = require('dgram');
      const client = dgram.createSocket('udp4');
      
      const testMessage = '<14>Jan 15 10:30:00 render-test render: Test log streaming setup';
      
      return new Promise((resolve) => {
        const host = this.serviceUrl.replace('https://', '').replace('http://', '').split(':')[0];
        client.send(testMessage, 514, host, (err) => {
          client.close();
          if (err) {
            console.error('❌ Ошибка отправки тестового сообщения:', err.message);
            resolve(false);
          } else {
            console.log('✅ Тестовое сообщение отправлено');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ Ошибка тестирования syslog:', error.message);
      return false;
    }
  }

  generateSetupInstructions() {
    console.log('\n📋 Инструкции по настройке Log Streaming в Render:');
    console.log('=' .repeat(60));
    console.log('\n1. Откройте Render Dashboard');
    console.log('2. Перейдите в настройки вашего сервиса');
    console.log('3. Найдите раздел "Logs"');
    console.log('4. Включите "Log Streaming"');
    console.log('5. Настройте параметры:');
    console.log(`   - Protocol: UDP`);
    console.log(`   - Host: ${this.serviceUrl.replace('https://', '').replace('http://', '')}`);
    console.log(`   - Port: 514`);
    const host = this.serviceUrl.replace('https://', '').replace('http://', '').split(':')[0];
    console.log(`   - Log Endpoint: ${host}:514`);
    console.log('\n6. Сохраните настройки');
    console.log('\n7. Проверьте работу:');
    console.log(`   curl ${this.serviceUrl}/api/syslog/status`);
    console.log(`   curl ${this.serviceUrl}/api/syslog/logs?limit=5`);
  }

  async runSetup() {
    console.log('🚀 Настройка Log Streaming для Render');
    console.log('=' .repeat(50));
    console.log(`Service URL: ${this.serviceUrl}`);
    console.log(`Syslog Endpoint: ${this.syslogEndpoint}`);
    console.log('');

    // Проверяем статус syslog сервера
    const isRunning = await this.checkSyslogStatus();
    if (!isRunning) {
      console.log('❌ Syslog сервер не работает. Проверьте деплой.');
      return false;
    }

    // Тестируем соединение
    const connectionOk = await this.testSyslogConnection();
    if (!connectionOk) {
      console.log('❌ Проблемы с сетевым соединением.');
      return false;
    }

    // Генерируем инструкции
    this.generateSetupInstructions();

    console.log('\n✅ Настройка завершена!');
    console.log('\n📝 Следующие шаги:');
    console.log('1. Выполните инструкции выше в Render Dashboard');
    console.log('2. Подождите несколько минут для поступления логов');
    console.log('3. Проверьте логи через API');

    return true;
  }
}

// Использование
const serviceUrl = process.argv[2];
if (!serviceUrl) {
  console.log('❌ Укажите URL сервиса:');
  console.log('node setup-render-logs.js https://your-app.onrender.com');
  process.exit(1);
}

const setup = new RenderLogsSetup(serviceUrl);
setup.runSetup().catch(console.error); 