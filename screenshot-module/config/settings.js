module.exports = {
  // Основные настройки
  baseUrl: 'http://localhost:3000',
  outputDir: 'documentation_screenshots',
  
  // Настройки браузера
  viewport: { width: 1920, height: 1080 },
  mobileViewport: { width: 375, height: 667 },
  headless: false,
  
  // Качество и производительность
  quality: 'high', // 'low', 'medium', 'high'
  timeout: 10000,
  delay: 1000,
  retryAttempts: 3,
  
  // Настройки скриншотов
  screenshotOptions: {
    fullPage: true,
    type: 'png'
  },
  
  // Папки для разных типов скриншотов
  folders: {
    states: 'states',
    components: 'components', 
    interactions: 'interactions',
    multiuser: 'multiuser',
    elements: 'elements',
    errors: 'errors',
    logs: 'logs',
    reports: 'reports'
  },
  
  // Подпапки для элементов (для OCR)
  elementSubfolders: {
    buttons: 'buttons',
    inputs: 'inputs',
    menus: 'menus',
    icons: 'icons',
    text: 'text',
    forms: 'forms',
    modals: 'modals'
  },
  
  // Настройки логирования
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    file: 'documentation_screenshots/logs/execution.log',
    errorsFile: 'documentation_screenshots/logs/errors.log',
    screenshotsFile: 'documentation_screenshots/logs/screenshots.log'
  },
  
  // Настройки отчетов
  reports: {
    generateHtml: true,
    generateJson: true,
    generateAnalysis: true,
    templateDir: 'reports/templates'
  },
  
  // Настройки для OCR
  ocr: {
    enabled: true,
    captureElements: true,
    generateMetadata: true,
    metadataFile: 'elements_metadata.json'
  }
}; 