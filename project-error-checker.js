#!/usr/bin/env node

/**
 * Комплексная проверка проекта и поиск ошибок
 * Проверяет логи, конфигурацию, подключения и потенциальные проблемы
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

class ProjectErrorChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.renderApiUrl = 'https://social-marketplace-api.onrender.com';
    this.renderFrontendUrl = 'https://social-marketplace-frontend.onrender.com';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(colorize(`${prefix} [${timestamp}] ${message}`, type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'));
  }

  error(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  info(message) {
    this.info.push(message);
    this.log(message, 'info');
  }

  // Проверка файлов логов
  checkLogFiles() {
    this.info('🔍 Проверка файлов логов...');
    
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      this.error('Папка logs не существует');
      return;
    }

    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.json'));
    
    if (logFiles.length === 0) {
      this.warning('Нет файлов логов в папке logs');
      return;
    }

    this.info(`Найдено ${logFiles.length} файлов логов`);

    // Проверяем последние логи на ошибки
    const latestLogs = logFiles
      .map(file => ({ file, mtime: fs.statSync(path.join(logsDir, file)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 3);

    for (const { file } of latestLogs) {
      try {
        const logPath = path.join(logsDir, file);
        const logContent = fs.readFileSync(logPath, 'utf8');
        const logData = JSON.parse(logContent);

        if (logData.logs) {
          const errors = logData.logs.filter(log => 
            log.level?.toLowerCase() === 'error' || 
            log.message?.toLowerCase().includes('error')
          );

          if (errors.length > 0) {
            this.error(`Найдено ${errors.length} ошибок в файле ${file}`);
            errors.slice(0, 3).forEach(error => {
              this.error(`  - ${error.message}`);
            });
          }
        }
      } catch (error) {
        this.error(`Ошибка при чтении файла ${file}: ${error.message}`);
      }
    }
  }

  // Проверка конфигурации
  checkConfiguration() {
    this.info('🔧 Проверка конфигурации...');

    // Проверяем config.env
    const configPath = path.join(__dirname, 'backend', 'config.env');
    if (!fs.existsSync(configPath)) {
      this.error('Файл backend/config.env не существует');
    } else {
      this.info('Файл config.env найден');
    }

    // Проверяем package.json
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.error('Файл package.json не найден');
    } else {
      try {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (!packageData.dependencies) {
          this.warning('В package.json нет зависимостей');
        }
      } catch (error) {
        this.error(`Ошибка при чтении package.json: ${error.message}`);
      }
    }

    // Проверяем backend/package.json
    const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
    if (!fs.existsSync(backendPackagePath)) {
      this.error('Файл backend/package.json не найден');
    } else {
      try {
        const backendPackageData = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
        const requiredDeps = ['express', 'cors', 'helmet', 'pg'];
        const missingDeps = requiredDeps.filter(dep => !backendPackageData.dependencies?.[dep]);
        
        if (missingDeps.length > 0) {
          this.error(`Отсутствуют зависимости в backend: ${missingDeps.join(', ')}`);
        }
      } catch (error) {
        this.error(`Ошибка при чтении backend/package.json: ${error.message}`);
      }
    }
  }

  // Проверка подключения к Render
  async checkRenderConnection() {
    this.info('🌐 Проверка подключения к Render...');

    const endpoints = [
      { name: 'Backend Health', url: `${this.renderApiUrl}/api/health` },
      { name: 'Frontend', url: this.renderFrontendUrl }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.url, { timeout: 10000 });
        if (response.status === 200) {
          this.info(`✅ ${endpoint.name}: HTTP ${response.status}`);
        } else {
          this.warning(`⚠️ ${endpoint.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        this.error(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  // HTTP запрос
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Project-Error-Checker/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 10000
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: { raw: data }
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  // Проверка структуры проекта
  checkProjectStructure() {
    this.info('📁 Проверка структуры проекта...');

    const requiredDirs = [
      'backend',
      'frontend',
      'logs',
      'backend/src',
      'backend/src/routes',
      'backend/src/utils',
      'frontend/src',
      'frontend/src/components'
    ];

    const requiredFiles = [
      'backend/src/app.js',
      'backend/package.json',
      'frontend/package.json',
      'render.yaml'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        this.error(`Папка ${dir} не существует`);
      } else {
        this.info(`✅ Папка ${dir} найдена`);
      }
    }

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        this.error(`Файл ${file} не найден`);
      } else {
        this.info(`✅ Файл ${file} найден`);
      }
    }
  }

  // Проверка потенциальных проблем в коде
  checkCodeIssues() {
    this.info('🔍 Проверка потенциальных проблем в коде...');

    const filesToCheck = [
      'backend/src/app.js',
      'backend/src/utils/db.js',
      'backend/src/utils/logger.js'
    ];

    for (const file of filesToCheck) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        this.error(`Файл ${file} не найден для проверки`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем на потенциальные проблемы
        const issues = this.analyzeCodeForIssues(content, file);
        
        if (issues.length > 0) {
          this.warning(`Найдено ${issues.length} потенциальных проблем в ${file}`);
          issues.forEach(issue => {
            this.warning(`  - ${issue}`);
          });
        }
      } catch (error) {
        this.error(`Ошибка при проверке файла ${file}: ${error.message}`);
      }
    }
  }

  // Анализ кода на потенциальные проблемы
  analyzeCodeForIssues(content, filename) {
    const issues = [];

    // Проверяем на console.log в production
    if (content.includes('console.log') && filename.includes('backend')) {
      issues.push('Использование console.log в production коде');
    }

    // Проверяем на хардкод паролей
    if (content.includes('password') && content.includes('"') && !content.includes('process.env')) {
      issues.push('Возможный хардкод паролей');
    }

    // Проверяем на необработанные ошибки
    if (content.includes('catch') && content.includes('console.error') && !content.includes('logger.error')) {
      issues.push('Использование console.error вместо logger');
    }

    // Проверяем на отсутствие обработки ошибок
    if (content.includes('require(') && !content.includes('try') && !content.includes('catch')) {
      issues.push('Возможно отсутствие обработки ошибок при require');
    }

    return issues;
  }

  // Генерация отчета
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(colorize('📊 ОТЧЕТ О ПРОВЕРКЕ ПРОЕКТА', 'cyan'));
    console.log('='.repeat(60));

    console.log(colorize(`\n❌ Ошибки (${this.errors.length}):`, 'red'));
    if (this.errors.length === 0) {
      console.log(colorize('  ✅ Ошибок не найдено', 'green'));
    } else {
      this.errors.forEach((error, index) => {
        console.log(colorize(`  ${index + 1}. ${error}`, 'red'));
      });
    }

    console.log(colorize(`\n⚠️ Предупреждения (${this.warnings.length}):`, 'yellow'));
    if (this.warnings.length === 0) {
      console.log(colorize('  ✅ Предупреждений нет', 'green'));
    } else {
      this.warnings.forEach((warning, index) => {
        console.log(colorize(`  ${index + 1}. ${warning}`, 'yellow'));
      });
    }

    console.log(colorize(`\nℹ️ Информация (${this.info.length}):`, 'blue'));
    this.info.forEach((info, index) => {
      console.log(colorize(`  ${index + 1}. ${info}`, 'blue'));
    });

    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(colorize('🎉 Проект в хорошем состоянии!', 'green'));
    } else if (this.errors.length === 0) {
      console.log(colorize('⚠️ Есть предупреждения, но критических ошибок нет', 'yellow'));
    } else {
      console.log(colorize('❌ Найдены критические ошибки, требуется исправление', 'red'));
    }
    
    console.log('='.repeat(60));
  }

  // Основной метод проверки
  async run() {
    console.log(colorize('🚀 Запуск комплексной проверки проекта...', 'cyan'));
    console.log(colorize(`📅 Время: ${new Date().toISOString()}`, 'gray'));
    console.log('');

    this.checkProjectStructure();
    this.checkConfiguration();
    this.checkLogFiles();
    this.checkCodeIssues();
    await this.checkRenderConnection();

    this.generateReport();
  }
}

// Запуск проверки
async function main() {
  const checker = new ProjectErrorChecker();
  await checker.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`💥 Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = ProjectErrorChecker; 