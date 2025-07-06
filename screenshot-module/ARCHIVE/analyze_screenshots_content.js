const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ScreenshotAnalyzer {
    constructor() {
        this.screenshotsDir = 'documentation_screenshots';
        this.reportPath = 'screenshots_analysis_report.json';
        this.htmlReportPath = 'screenshots_analysis_report.html';
    }

    async analyzeScreenshots() {
        console.log('🔍 Анализ содержимого скриншотов...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            totalScreenshots: 0,
            categories: {},
            detailedAnalysis: []
        };

        // Анализируем основные скриншоты
        const mainScreenshots = [
            '01_main_page.png', '02_guest_login_clicked.png', '03_guest_form.png',
            '04_login_form.png', '05_login_form_filled.png', '06_after_login.png',
            '07_user_profile.png', '09_feed_page.png', '10_feed_scrolled.png',
            '11_create_post_form.png', '12_post_form_filled.png', '13_post_created.png',
            '14_chat_page.png', '15_chat_conversation.png', '16_message_typing.png',
            '17_message_sent.png', '18_left_sidebar.png', '19_right_sidebar.png',
            '21_notifications_panel.png', '22_search_form.png', '23_search_results.png',
            '24_mobile_main.png'
        ];

        for (const screenshot of mainScreenshots) {
            const screenshotPath = path.join(this.screenshotsDir, screenshot);
            if (fs.existsSync(screenshotPath)) {
                const analysisResult = await this.analyzeSingleScreenshot(screenshotPath, screenshot);
                analysis.detailedAnalysis.push(analysisResult);
                analysis.totalScreenshots++;
            }
        }

        // Анализируем скриншоты по категориям
        const categories = ['states', 'components', 'interactions', 'multiuser'];
        
        for (const category of categories) {
            const categoryDir = path.join(this.screenshotsDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.png'));
                analysis.categories[category] = [];
                
                for (const file of files) {
                    const screenshotPath = path.join(categoryDir, file);
                    const analysisResult = await this.analyzeSingleScreenshot(screenshotPath, `${category}/${file}`);
                    analysis.categories[category].push(analysisResult);
                    analysis.totalScreenshots++;
                }
            }
        }

        // Сохраняем отчет
        fs.writeFileSync(this.reportPath, JSON.stringify(analysis, null, 2));
        await this.generateHtmlReport(analysis);
        
        console.log(`✅ Анализ завершен! Проанализировано ${analysis.totalScreenshots} скриншотов`);
        console.log(`📄 Отчет сохранен: ${this.reportPath}`);
        console.log(`🌐 HTML отчет: ${this.htmlReportPath}`);
        
        return analysis;
    }

    async analyzeSingleScreenshot(screenshotPath, relativePath) {
        console.log(`🔍 Анализ: ${relativePath}`);
        
        const analysis = {
            filename: path.basename(screenshotPath),
            relativePath: relativePath,
            fullPath: screenshotPath,
            timestamp: new Date().toISOString(),
            ocrText: '',
            uiElements: [],
            colors: {},
            dimensions: {},
            analysis: {}
        };

        try {
            // Получаем размеры изображения
            const dimensions = await this.getImageDimensions(screenshotPath);
            analysis.dimensions = dimensions;

            // OCR анализ
            const ocrText = await this.performOCR(screenshotPath);
            analysis.ocrText = ocrText;

            // Анализ UI элементов
            const uiElements = await this.analyzeUIElements(ocrText, relativePath);
            analysis.uiElements = uiElements;

            // Анализ цветов
            const colors = await this.analyzeColors(screenshotPath);
            analysis.colors = colors;

            // Детальный анализ содержимого
            analysis.analysis = this.analyzeContent(ocrText, uiElements, relativePath);

        } catch (error) {
            analysis.error = error.message;
            console.error(`❌ Ошибка анализа ${relativePath}:`, error.message);
        }

        return analysis;
    }

    async getImageDimensions(imagePath) {
        try {
            const { execSync } = require('child_process');
            const result = execSync(`identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf8' });
            const [width, height] = result.trim().split('x').map(Number);
            return { width, height };
        } catch (error) {
            return { width: 0, height: 0 };
        }
    }

    async performOCR(imagePath) {
        try {
            const tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
            const command = `${tesseractPath} "${imagePath}" stdout -l rus+eng --psm 6`;
            const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
            return result.trim();
        } catch (error) {
            console.warn(`⚠️ OCR не удался для ${imagePath}: ${error.message}`);
            return '';
        }
    }

    async analyzeUIElements(ocrText, relativePath) {
        const elements = [];
        
        // Поиск кнопок
        const buttonPatterns = [
            /кнопк[аи]/gi, /button/gi, /нажми/gi, /клик/gi,
            /войти/gi, /войти как гость/gi, /продолжить/gi,
            /создать/gi, /отправить/gi, /поиск/gi, /лайк/gi
        ];
        
        buttonPatterns.forEach(pattern => {
            const matches = ocrText.match(pattern);
            if (matches) {
                elements.push({
                    type: 'button',
                    text: matches[0],
                    count: matches.length
                });
            }
        });

        // Поиск полей ввода
        const inputPatterns = [
            /поле/gi, /input/gi, /email/gi, /пароль/gi, /password/gi,
            /сообщение/gi, /message/gi, /пост/gi, /post/gi
        ];
        
        inputPatterns.forEach(pattern => {
            const matches = ocrText.match(pattern);
            if (matches) {
                elements.push({
                    type: 'input',
                    text: matches[0],
                    count: matches.length
                });
            }
        });

        // Поиск текста
        const textPatterns = [
            /привет/gi, /hello/gi, /добро пожаловать/gi, /welcome/gi,
            /профиль/gi, /profile/gi, /лента/gi, /feed/gi, /чат/gi, /chat/gi
        ];
        
        textPatterns.forEach(pattern => {
            const matches = ocrText.match(pattern);
            if (matches) {
                elements.push({
                    type: 'text',
                    text: matches[0],
                    count: matches.length
                });
            }
        });

        return elements;
    }

    async analyzeColors(imagePath) {
        try {
            const { execSync } = require('child_process');
            const command = `magick "${imagePath}" -format "%[colorspace] %[mean]" info:`;
            const result = execSync(command, { encoding: 'utf8' });
            return { colorspace: result.trim() };
        } catch (error) {
            return { colorspace: 'unknown' };
        }
    }

    analyzeContent(ocrText, uiElements, relativePath) {
        const analysis = {
            hasLoginForm: false,
            hasGuestButton: false,
            hasFeed: false,
            hasChat: false,
            hasProfile: false,
            hasPostCreation: false,
            hasNotifications: false,
            hasSearch: false,
            hasSidebar: false,
            isMobile: false,
            detectedFeatures: [],
            textContent: ocrText.substring(0, 500) + (ocrText.length > 500 ? '...' : '')
        };

        const text = ocrText.toLowerCase();
        
        // Анализ функций
        if (text.includes('войти') || text.includes('login') || text.includes('email') || text.includes('пароль')) {
            analysis.hasLoginForm = true;
            analysis.detectedFeatures.push('Форма входа');
        }
        
        if (text.includes('гость') || text.includes('guest')) {
            analysis.hasGuestButton = true;
            analysis.detectedFeatures.push('Гостевой вход');
        }
        
        if (text.includes('лента') || text.includes('feed') || text.includes('пост')) {
            analysis.hasFeed = true;
            analysis.detectedFeatures.push('Лента постов');
        }
        
        if (text.includes('чат') || text.includes('chat') || text.includes('сообщение')) {
            analysis.hasChat = true;
            analysis.detectedFeatures.push('Чат');
        }
        
        if (text.includes('профиль') || text.includes('profile')) {
            analysis.hasProfile = true;
            analysis.detectedFeatures.push('Профиль');
        }
        
        if (text.includes('создать') || text.includes('create') || text.includes('новый пост')) {
            analysis.hasPostCreation = true;
            analysis.detectedFeatures.push('Создание поста');
        }
        
        if (text.includes('уведомления') || text.includes('notifications')) {
            analysis.hasNotifications = true;
            analysis.detectedFeatures.push('Уведомления');
        }
        
        if (text.includes('поиск') || text.includes('search')) {
            analysis.hasSearch = true;
            analysis.detectedFeatures.push('Поиск');
        }
        
        if (text.includes('панель') || text.includes('sidebar') || text.includes('меню')) {
            analysis.hasSidebar = true;
            analysis.detectedFeatures.push('Боковая панель');
        }
        
        if (relativePath.includes('mobile') || text.includes('мобильн')) {
            analysis.isMobile = true;
            analysis.detectedFeatures.push('Мобильная версия');
        }

        return analysis;
    }

    async generateHtmlReport(analysis) {
        const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Анализ скриншотов - Подробный отчет</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1, h2, h3 { color: #333; }
        .summary { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .screenshot-analysis { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .features { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .feature { background: #4CAF50; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        .error { background: #f44336; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        .text-content { background: #f9f9f9; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
        .ui-elements { margin: 10px 0; }
        .element { background: #e3f2fd; padding: 5px 10px; margin: 5px; border-radius: 3px; display: inline-block; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Подробный анализ скриншотов</h1>
        
        <div class="summary">
            <h2>📊 Общая статистика</h2>
            <p><strong>Всего скриншотов:</strong> ${analysis.totalScreenshots}</p>
            <p><strong>Время анализа:</strong> ${analysis.timestamp}</p>
        </div>

        <div class="grid">
            ${analysis.detailedAnalysis.map(screenshot => `
                <div class="screenshot-analysis">
                    <h3>📸 ${screenshot.filename}</h3>
                    <p><strong>Путь:</strong> ${screenshot.relativePath}</p>
                    <p><strong>Размеры:</strong> ${screenshot.dimensions.width}x${screenshot.dimensions.height}</p>
                    
                    ${screenshot.error ? `
                        <div class="error">❌ Ошибка: ${screenshot.error}</div>
                    ` : `
                        <div class="features">
                            ${screenshot.analysis.detectedFeatures.map(feature => 
                                `<span class="feature">${feature}</span>`
                            ).join('')}
                        </div>
                        
                        <div class="ui-elements">
                            <strong>UI элементы:</strong><br>
                            ${screenshot.uiElements.map(element => 
                                `<span class="element">${element.type}: ${element.text} (${element.count})</span>`
                            ).join('')}
                        </div>
                        
                        <div class="text-content">
                            <strong>Распознанный текст:</strong><br>
                            ${screenshot.analysis.textContent || 'Текст не распознан'}
                        </div>
                    `}
                </div>
            `).join('')}
        </div>

        <h2>📁 Анализ по категориям</h2>
        ${Object.entries(analysis.categories).map(([category, screenshots]) => `
            <h3>${category.toUpperCase()}</h3>
            <div class="grid">
                ${screenshots.map(screenshot => `
                    <div class="screenshot-analysis">
                        <h4>${screenshot.filename}</h4>
                        <div class="features">
                            ${screenshot.analysis.detectedFeatures.map(feature => 
                                `<span class="feature">${feature}</span>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

        fs.writeFileSync(this.htmlReportPath, html);
    }
}

// Запуск анализа
async function main() {
    const analyzer = new ScreenshotAnalyzer();
    await analyzer.analyzeScreenshots();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ScreenshotAnalyzer; 