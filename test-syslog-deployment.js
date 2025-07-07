
const axios = require('axios');

async function testSyslogDeployment() {
  const baseUrl = process.argv[2] || 'http://localhost:8000';
  
  console.log(`🧪 Тестирование syslog сервера на ${baseUrl}`);
  
  const endpoints = [
    '/api/syslog/status',
    '/api/syslog/config',
    '/api/syslog/logs?limit=10',
    '/api/syslog/render-logs?limit=10'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
      
      if (endpoint.includes('status') && response.data.data) {
        console.log(`   Сервер: ${response.data.data.isRunning ? 'Запущен' : 'Остановлен'}`);
        console.log(`   Порт: ${response.data.data.port}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }
}

testSyslogDeployment();
