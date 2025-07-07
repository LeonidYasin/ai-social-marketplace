
const axios = require('axios');

class SyslogMonitor {
  constructor(baseUrl, interval = 5 * 60 * 1000) {
    this.baseUrl = baseUrl;
    this.interval = interval;
    this.isRunning = false;
  }
  
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/syslog/status`);
      const status = response.data.data;
      
      const timestamp = new Date().toISOString();
      
      if (status.isRunning) {
        console.log(`[${timestamp}] ✅ Syslog сервер работает на порту ${status.port}`);
      } else {
        console.log(`[${timestamp}] ❌ Syslog сервер остановлен`);
      }
      
      return status.isRunning;
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ❌ Ошибка проверки: ${error.message}`);
      return false;
    }
  }
  
  async getLogs(limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/syslog/logs?limit=${limit}`);
      return response.data.data.logs;
    } catch (error) {
      console.error('Ошибка получения логов:', error.message);
      return [];
    }
  }
  
  start() {
    if (this.isRunning) {
      console.log('Мониторинг уже запущен');
      return;
    }
    
    this.isRunning = true;
    console.log(`🚀 Запуск мониторинга syslog сервера (${this.baseUrl})`);
    console.log(`⏰ Интервал проверки: ${this.interval / 1000} секунд`);
    
    // Первая проверка
    this.checkHealth();
    
    // Периодические проверки
    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, this.interval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('🛑 Мониторинг остановлен');
    }
  }
}

// Использование
const baseUrl = process.argv[2] || 'http://localhost:8000';
const monitor = new SyslogMonitor(baseUrl);

monitor.start();

// Обработка завершения
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});
