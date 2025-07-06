const fs = require('fs');
const path = require('path');

// Класс для логирования
class Logger {
    constructor(config) {
        this.config = config;
        this.logs = [];
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logEntry);
        this.logs.push(logEntry);
        
        // Записываем в файл
        if (this.config.file) {
            fs.appendFileSync(this.config.file, logEntry + '\n');
        }
        
        // Отдельные файлы для ошибок
        if (level === 'error' && this.config.errorsFile) {
            fs.appendFileSync(this.config.errorsFile, logEntry + '\n');
        }
    }

    info(message) {
        this.log('info', message);
    }

    warn(message) {
        this.log('warn', message);
    }

    error(message) {
        this.log('error', message);
    }

    debug(message) {
        if (this.config.level === 'debug') {
            this.log('debug', message);
        }
    }
}

// Функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Универсальное ожидание элемента
async function waitForElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        return false;
    }
}

// Универсальный клик
async function clickElement(page, selector, description = '') {
    try {
        await waitForElement(page, selector);
        await page.click(selector);
        console.log(`✅ Клик: ${description || selector}`);
        await delay(1000);
        return true;
    } catch (error) {
        console.log(`❌ Ошибка клика ${description || selector}: ${error.message}`);
        return false;
    }
}

// Клик по кнопке с текстом
async function clickButtonByText(page, text, description = '') {
    const buttons = await page.$$('button, .MuiButtonBase-root, [role="button"]');
    
    for (const btn of buttons) {
        const btnText = await page.evaluate(el => el.textContent?.trim(), btn);
        if (btnText === text) {
            await btn.click();
            console.log(`✅ Клик по кнопке: "${text}" - ${description}`);
            await delay(1000);
            return true;
        }
    }
    
    const errorMsg = `Кнопка с текстом "${text}" не найдена (${description})`;
    console.log(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
}

// Заполнение поля
async function fillInput(page, selector, value, description = '') {
    try {
        await waitForElement(page, selector);
        await page.type(selector, value);
        console.log(`✅ Заполнено поле: ${description || selector}`);
        return true;
    } catch (error) {
        console.log(`❌ Ошибка заполнения поля ${description || selector}: ${error.message}`);
        return false;
    }
}

// Поиск элемента по тексту
async function findElementByText(page, text, tagName = '*') {
    const elements = await page.$$(tagName);
    
    for (const element of elements) {
        const elementText = await page.evaluate(el => el.textContent?.trim(), element);
        if (elementText && elementText.includes(text)) {
            return element;
        }
    }
    
    return null;
}

// Получение координат элемента
async function getElementCoordinates(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element) return null;
        
        const box = await element.boundingBox();
        return {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height)
        };
    } catch (error) {
        return null;
    }
}

// Скриншот элемента
async function screenshotElement(page, selector, filepath, description = '') {
    try {
        const element = await page.$(selector);
        if (!element) {
            console.log(`❌ Элемент не найден: ${selector}`);
            return false;
        }
        
        await element.screenshot({ path: filepath });
        console.log(`📸 Скриншот элемента: ${description || selector}`);
        return true;
    } catch (error) {
        console.log(`❌ Ошибка скриншота элемента ${selector}: ${error.message}`);
        return false;
    }
}

// Проверка видимости элемента
async function isElementVisible(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element) return false;
        
        const isVisible = await page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   el.offsetWidth > 0 && 
                   el.offsetHeight > 0;
        }, element);
        
        return isVisible;
    } catch (error) {
        return false;
    }
}

// Ожидание загрузки страницы
async function waitForPageLoad(page, timeout = 10000) {
    try {
        await page.waitForLoadState('networkidle', { timeout });
        return true;
    } catch (error) {
        console.log(`⚠️ Страница не загрузилась полностью: ${error.message}`);
        return false;
    }
}

// Получение текста элемента
async function getElementText(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element) return null;
        
        return await page.evaluate(el => el.textContent?.trim(), element);
    } catch (error) {
        return null;
    }
}

// Проверка наличия ошибок на странице
async function checkForErrors(page) {
    const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
        return Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    return errors;
}

// Создание папки если не существует
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Генерация уникального имени файла
function generateUniqueFilename(baseName, extension = 'png') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseName}_${timestamp}_${random}.${extension}`;
}

// Валидация настроек
function validateSettings(settings) {
    const required = ['baseUrl', 'outputDir', 'viewport'];
    const missing = required.filter(key => !settings[key]);
    
    if (missing.length > 0) {
        throw new Error(`Отсутствуют обязательные настройки: ${missing.join(', ')}`);
    }
    
    return true;
}

module.exports = {
    Logger,
    delay,
    waitForElement,
    clickElement,
    clickButtonByText,
    fillInput,
    findElementByText,
    getElementCoordinates,
    screenshotElement,
    isElementVisible,
    waitForPageLoad,
    getElementText,
    checkForErrors,
    ensureDirectoryExists,
    generateUniqueFilename,
    validateSettings
}; 