const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

class OCRCoordinatesExtractor {
    constructor() {
        this.settings = {
            baseUrl: 'http://localhost:3000',
            viewport: { width: 1920, height: 1080 },
            headless: false,
            tesseractPath: 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
        };
        
        this.logger = {
            info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
            error: (msg) => console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`)
        };
    }

    async checkTesseract() {
        try {
            const { execSync } = require('child_process');
            execSync(`"${this.settings.tesseractPath}" --version`, { stdio: 'ignore' });
            this.logger.info('✅ Tesseract найден');
        } catch (error) {
            this.logger.error('❌ Tesseract не найден. Установите Tesseract OCR.');
            throw new Error('Tesseract не установлен');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async extractTextWithOCR(imagePath) {
        try {
            const result = await Tesseract.recognize(imagePath, 'rus+eng', {
                logger: m => this.logger.info(`OCR: ${m.status}`)
            });
            return result.data.text;
        } catch (error) {
            this.logger.error(`Ошибка OCR: ${error.message}`);
            throw error;
        }
    }

    async getElementCoordinates() {
        const coordinates = [];
        
        // Получаем все кликабельные элементы
        const elements = await this.page.evaluate(() => {
            const clickableElements = [];
            
            // Функция для получения текста элемента
            const getElementText = (element) => {
                let text = '';
                
                // Проверяем различные атрибуты
                if (element.alt) text += element.alt + ' ';
                if (element.title) text += element.title + ' ';
                if (element.placeholder) text += element.placeholder + ' ';
                if (element.value) text += element.value + ' ';
                
                // Получаем текстовое содержимое
                const textContent = element.textContent || element.innerText || '';
                if (textContent.trim()) text += textContent.trim() + ' ';
                
                return text.trim();
            };
            
            // Ищем все кликабельные элементы
            const selectors = [
                'button', 'a', 'input[type="button"]', 'input[type="submit"]',
                '[role="button"]', '[onclick]', '[tabindex]',
                'div[class*="btn"]', 'div[class*="button"]',
                'span[class*="btn"]', 'span[class*="button"]'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const text = getElementText(element);
                    
                    if (rect.width > 0 && rect.height > 0 && text) {
                        clickableElements.push({
                            text: text,
                            x: Math.round(rect.left + rect.width / 2),
                            y: Math.round(rect.top + rect.height / 2),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            tagName: element.tagName.toLowerCase(),
                            className: element.className || '',
                            id: element.id || ''
                        });
                    }
                });
            });
            
            return clickableElements;
        });
        
        return elements;
    }

    async extractCoordinates() {
        this.logger.info('🚀 Начинаем извлечение OCR координат...');
        
        try {
            await this.checkTesseract();
            
            const browser = await puppeteer.launch({
                headless: this.settings.headless,
                defaultViewport: this.settings.viewport
            });
            
            this.page = await browser.newPage();
            
            // Переходим на страницу
            await this.page.goto(this.settings.baseUrl, { waitUntil: 'networkidle2' });
            await this.delay(3000);
            
            // Делаем скриншот для OCR
            const screenshotPath = 'temp_ocr_screenshot.png';
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Получаем координаты элементов через DOM
            const domCoordinates = await this.getElementCoordinates();
            
            // Извлекаем текст через OCR
            const ocrText = await this.extractTextWithOCR(screenshotPath);
            
            // Сохраняем результаты
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const result = {
                timestamp: timestamp,
                url: this.settings.baseUrl,
                ocrText: ocrText,
                coordinates: domCoordinates
            };
            
            const filename = `ocr_coordinates_${timestamp}.json`;
            fs.writeFileSync(filename, JSON.stringify(result, null, 2));
            
            this.logger.info(`✅ Координаты сохранены в ${filename}`);
            this.logger.info(`📊 Найдено ${domCoordinates.length} кликабельных элементов`);
            
            // Выводим список элементов
            domCoordinates.forEach((coord, index) => {
                this.logger.info(`${index + 1}. "${coord.text}" - (${coord.x}, ${coord.y}) - ${coord.tagName}`);
            });
            
            // Очищаем временный файл
            if (fs.existsSync(screenshotPath)) {
                fs.unlinkSync(screenshotPath);
            }
            
            await browser.close();
            
        } catch (error) {
            this.logger.error(`❌ Ошибка: ${error.message}`);
            throw error;
        }
    }
}

// Запуск
if (require.main === module) {
    const extractor = new OCRCoordinatesExtractor();
    extractor.extractCoordinates()
        .then(() => {
            console.log('✅ Извлечение координат завершено');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error.message);
            process.exit(1);
        });
}

module.exports = OCRCoordinatesExtractor; 