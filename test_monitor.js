const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_DIR = './test_logs';

// Создаем директорию для логов если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class SystemMonitor {
  constructor() {
    this.logs = [];
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
      processes: []
    };
    this.startTime = Date.now();
    this.isMonitoring = false;
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  warning(message) {
    this.log(message, 'WARNING');
  }

  saveLogs(filename) {
    const filepath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filepath, this.logs.join('\n'));
  }

  saveMetrics(filename) {
    const filepath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.metrics, null, 2));
  }

  // Получение информации о CPU
  getCPUInfo() {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => {
      return acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }, 0);
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle / total);
    
    return {
      cores: cpus.length,
      usage: Math.round(usage * 100) / 100,
      model: cpus[0].model,
      speed: cpus[0].speed
    };
  }

  // Получение информации о памяти
  getMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = (usedMem / totalMem) * 100;
    
    return {
      total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      usage: Math.round(usagePercent * 100) / 100
    };
  }

  // Получение информации о диске
  getDiskInfo() {
    try {
      // Простая проверка доступного места в текущей директории
      const stats = fs.statSync('.');
      return {
        available: 'N/A', // Требуется дополнительная библиотека для получения точной информации
        total: 'N/A',
        usage: 'N/A'
      };
    } catch (error) {
      return {
        available: 'N/A',
        total: 'N/A',
        usage: 'N/A',
        error: error.message
      };
    }
  }

  // Получение информации о сети
  getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = {};
    
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(interface => {
        if (interface.family === 'IPv4' && !interface.internal) {
          networkInfo[name] = {
            address: interface.address,
            netmask: interface.netmask,
            mac: interface.mac
          };
        }
      });
    });
    
    return networkInfo;
  }

  // Получение информации о процессах
  getProcessInfo() {
    return {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  // Получение информации о системе
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };
  }

  // Сбор всех метрик
  collectMetrics() {
    const timestamp = Date.now();
    
    const metrics = {
      timestamp,
      cpu: this.getCPUInfo(),
      memory: this.getMemoryInfo(),
      disk: this.getDiskInfo(),
      network: this.getNetworkInfo(),
      process: this.getProcessInfo(),
      system: this.getSystemInfo()
    };

    // Сохраняем метрики
    Object.keys(this.metrics).forEach(key => {
      if (metrics[key]) {
        this.metrics[key].push({
          timestamp,
          ...metrics[key]
        });
      }
    });

    return metrics;
  }

  // Вывод текущих метрик
  displayMetrics(metrics) {
    console.clear();
    console.log('🖥️  МОНИТОРИНГ СИСТЕМЫ');
    console.log('='.repeat(50));
    
    // CPU
    console.log(`💻 CPU: ${metrics.cpu.usage}% (${metrics.cpu.cores} ядер)`);
    console.log(`   Модель: ${metrics.cpu.model}`);
    console.log(`   Частота: ${metrics.cpu.speed} MHz`);
    
    // Memory
    console.log(`🧠 Память: ${metrics.memory.usage}%`);
    console.log(`   Использовано: ${metrics.memory.used} GB / ${metrics.memory.total} GB`);
    console.log(`   Свободно: ${metrics.memory.free} GB`);
    
    // System
    console.log(`🖥️  Система: ${metrics.system.platform} ${metrics.system.arch}`);
    console.log(`   Загрузка: ${metrics.system.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
    console.log(`   Время работы: ${Math.round(metrics.system.uptime / 3600)} часов`);
    
    // Process
    const memUsage = metrics.process.memory;
    console.log(`📊 Процесс: PID ${metrics.process.pid}`);
    console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
    console.log(`   Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
    
    // Network
    const networkInterfaces = Object.keys(metrics.network);
    if (networkInterfaces.length > 0) {
      console.log(`🌐 Сеть: ${networkInterfaces.join(', ')}`);
      networkInterfaces.forEach(iface => {
        console.log(`   ${iface}: ${metrics.network[iface].address}`);
      });
    }
    
    console.log('='.repeat(50));
    console.log(`⏰ Время мониторинга: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
  }

  // Запуск мониторинга
  startMonitoring(interval = 2000) {
    if (this.isMonitoring) {
      this.warning('⚠️ Мониторинг уже запущен');
      return;
    }

    this.isMonitoring = true;
    this.log(`🚀 Запуск мониторинга системы (интервал: ${interval}ms)`);
    
    const monitorInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }

      const metrics = this.collectMetrics();
      this.displayMetrics(metrics);
      
      // Проверка критических значений
      this.checkCriticalValues(metrics);
      
    }, interval);

    // Сохраняем интервал для остановки
    this.monitorInterval = monitorInterval;
  }

  // Остановка мониторинга
  stopMonitoring() {
    if (!this.isMonitoring) {
      this.warning('⚠️ Мониторинг не запущен');
      return;
    }

    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    this.log('🛑 Мониторинг остановлен');
  }

  // Проверка критических значений
  checkCriticalValues(metrics) {
    // Проверка CPU
    if (metrics.cpu.usage > 90) {
      this.warning(`⚠️ Высокая загрузка CPU: ${metrics.cpu.usage}%`);
    }
    
    // Проверка памяти
    if (metrics.memory.usage > 90) {
      this.error(`❌ Критическая загрузка памяти: ${metrics.memory.usage}%`);
    } else if (metrics.memory.usage > 80) {
      this.warning(`⚠️ Высокая загрузка памяти: ${metrics.memory.usage}%`);
    }
    
    // Проверка свободной памяти
    if (metrics.memory.free < 1) {
      this.error(`❌ Критически мало свободной памяти: ${metrics.memory.free} GB`);
    }
  }

  // Генерация отчета о производительности
  generatePerformanceReport() {
    this.log('📊 Генерация отчета о производительности...');
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        samples: 0,
        avgCPU: 0,
        avgMemory: 0,
        maxCPU: 0,
        maxMemory: 0,
        minCPU: 100,
        minMemory: 100
      },
      details: this.metrics,
      recommendations: []
    };

    // Анализ метрик
    if (this.metrics.cpu.length > 0) {
      const cpuValues = this.metrics.cpu.map(m => m.usage);
      report.summary.samples = cpuValues.length;
      report.summary.avgCPU = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
      report.summary.maxCPU = Math.max(...cpuValues);
      report.summary.minCPU = Math.min(...cpuValues);
    }

    if (this.metrics.memory.length > 0) {
      const memoryValues = this.metrics.memory.map(m => m.usage);
      report.summary.avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
      report.summary.maxMemory = Math.max(...memoryValues);
      report.summary.minMemory = Math.min(...memoryValues);
    }

    // Генерация рекомендаций
    if (report.summary.avgCPU > 70) {
      report.recommendations.push('Высокая средняя загрузка CPU - рассмотрите оптимизацию');
    }

    if (report.summary.avgMemory > 80) {
      report.recommendations.push('Высокая средняя загрузка памяти - добавьте RAM или оптимизируйте');
    }

    if (report.summary.maxCPU > 95) {
      report.recommendations.push('Пиковые нагрузки CPU - проверьте процессы');
    }

    if (report.summary.maxMemory > 95) {
      report.recommendations.push('Пиковые нагрузки памяти - возможны утечки памяти');
    }

    // Сохраняем отчет
    const reportFile = path.join(LOG_DIR, 'performance_monitor_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Отчет о производительности сохранен в ${reportFile}`);
    
    return report;
  }

  // Мониторинг во время выполнения тестов
  async monitorDuringTests(testCommand, testArgs = []) {
    this.log('🔍 Запуск мониторинга во время выполнения тестов...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      // Запускаем мониторинг
      this.startMonitoring(1000); // Обновляем каждую секунду
      
      // Запускаем тест
      const testProcess = spawn('node', [testCommand, ...testArgs], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let testOutput = '';
      let testError = '';

      testProcess.stdout.on('data', (data) => {
        testOutput += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        testError += data.toString();
      });

      testProcess.on('close', (code) => {
        // Останавливаем мониторинг
        this.stopMonitoring();
        
        // Генерируем отчет
        const report = this.generatePerformanceReport();
        
        this.log(`✅ Тест завершен с кодом: ${code}`);
        
        resolve({
          testCode: code,
          testOutput,
          testError,
          performanceReport: report
        });
      });

      testProcess.on('error', (error) => {
        this.stopMonitoring();
        reject(error);
      });
    });
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  const monitor = new SystemMonitor();
  
  try {
    if (args.length === 0) {
      // Простой мониторинг
      console.log('🖥️ Запуск мониторинга системы...');
      console.log('Нажмите Ctrl+C для остановки\n');
      
      monitor.startMonitoring(2000);
      
      // Обработка сигнала завершения
      process.on('SIGINT', () => {
        monitor.stopMonitoring();
        const report = monitor.generatePerformanceReport();
        monitor.saveLogs('system_monitor.log');
        process.exit(0);
      });
      
    } else if (args[0] === 'test' && args[1]) {
      // Мониторинг во время теста
      const testFile = args[1];
      const testArgs = args.slice(2);
      
      if (!fs.existsSync(testFile)) {
        console.error(`❌ Файл теста не найден: ${testFile}`);
        process.exit(1);
      }
      
      const result = await monitor.monitorDuringTests(testFile, testArgs);
      monitor.saveLogs('test_monitor.log');
      
      console.log('\n📊 Результаты мониторинга во время теста:');
      console.log(`   - Код завершения теста: ${result.testCode}`);
      console.log(`   - Средняя загрузка CPU: ${result.performanceReport.summary.avgCPU.toFixed(2)}%`);
      console.log(`   - Средняя загрузка памяти: ${result.performanceReport.summary.avgMemory.toFixed(2)}%`);
      
    } else {
      console.log('Использование:');
      console.log('  node test_monitor.js                    - Простой мониторинг');
      console.log('  node test_monitor.js test <test_file>   - Мониторинг во время теста');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = SystemMonitor; 