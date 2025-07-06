const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRTestBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init() {
        console.log('🤖 Инициализация OCR тест-бота...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox']
        });
        
        this.page = await this.browser.newPage();
        console.log('✅ Браузер запущен');
    }

    async takeScreenshot(name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/step${this.stepCounter.toString().padStart(2, '0')}_${name}.png`;
        await this.page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот сохранен: ${filename}`);
        return filename;
    }

    async findTextCoordinates(imagePath, searchText) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Ошибка Tesseract:', error.message);
                    reject(error);
                    return;
                }

                // Читаем результат из файла
                const outputFile = 'output.tsv';
                if (!fs.existsSync(outputFile)) {
                    reject(new Error('Output file not found'));
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                const lines = content.trim().split('\n');
                
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = lines[0].split('\t');
                const found = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t');
                    if (values.length >= headers.length) {
                        const text = values[headers.indexOf('text')];
                        const conf = parseFloat(values[headers.indexOf('conf')]);
                        const left = parseInt(values[headers.indexOf('left')]);
                        const top = parseInt(values[headers.indexOf('top')]);
                        const width = parseInt(values[headers.indexOf('width')]);
                        const height = parseInt(values[headers.indexOf('height')]);

                        if (text && text.toLowerCase().includes(searchText.toLowerCase()) && conf > 0) {
                            found.push({
                                text: text,
                                confidence: conf,
                                x: left,
                                y: top,
                                width: width,
                                height: height,
                                centerX: left + width / 2,
                                centerY: top + height / 2
                            });
                        }
                    }
                }

                resolve(found);
            });
        });
    }

    async clickOnText(searchText, description = '') {
        console.log(`🔍 Ищем текст: "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(`search_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length === 0) {
            console.log(`❌ Текст "${searchText}" не найден`);
            return false;
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Найдено: "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        // Кликаем по центру элемента
        await this.page.mouse.click(target.centerX, target.centerY);
        console.log(`🖱️ Клик по координатам (${target.centerX}, ${target.centerY})`);
        
        // Ждем немного для загрузки
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
    }

    async verifyTextExists(searchText, description = '') {
        console.log(`🔍 Проверяем наличие текста: "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(`verify_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length > 0) {
            console.log(`✅ Текст "${searchText}" найден (${coords.length} совпадений)`);
            return true;
        } else {
            console.log(`❌ Текст "${searchText}" не найден`);
            return false;
        }
    }

    async runTest() {
        try {
            console.log('🚀 Запуск автоматического тестирования приложения');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            console.log('✅ Приложение открыто');
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Проверяем наличие кнопки "ПРОДОЛЖИТЬ КАК ГОСТЬ"
            console.log('\n📋 Шаг 2: Проверка кнопки "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            const guestButtonExists = await this.verifyTextExists('гость', 'на кнопке гостевого входа');
            
            if (!guestButtonExists) {
                console.log('❌ Кнопка гостевого входа не найдена');
                return false;
            }
            
            // Шаг 3: Кликаем по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"
            console.log('\n📋 Шаг 3: Клик по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            const guestClickSuccess = await this.clickOnText('гость', 'для гостевого входа');
            
            if (!guestClickSuccess) {
                console.log('❌ Не удалось кликнуть по кнопке гостевого входа');
                return false;
            }
            
            // Шаг 4: Проверяем, что пользователь вошел в систему
            console.log('\n📋 Шаг 4: Проверка успешного входа');
            const loginSuccess = await this.verifyTextExists('пост', 'в ленте постов');
            
            if (!loginSuccess) {
                console.log('❌ Вход не выполнен - посты не найдены');
                return false;
            }
            
            console.log('✅ Гостевой вход выполнен успешно');
            
            // Шаг 5: Проверяем наличие кнопки создания поста
            console.log('\n📋 Шаг 5: Проверка кнопки создания поста');
            const createPostButton = await this.verifyTextExists('нового', 'в кнопке создания поста');
            
            if (createPostButton) {
                console.log('✅ Кнопка создания поста найдена');
                
                // Шаг 6: Кликаем по кнопке создания поста
                console.log('\n📋 Шаг 6: Клик по кнопке создания поста');
                const createPostClick = await this.clickOnText('нового', 'для создания поста');
                
                if (createPostClick) {
                    console.log('✅ Форма создания поста открыта');
                    
                    // Шаг 7: Проверяем форму создания поста
                    console.log('\n📋 Шаг 7: Проверка формы создания поста');
                    const formExists = await this.verifyTextExists('отправить', 'в форме поста');
                    
                    if (formExists) {
                        console.log('✅ Форма создания поста работает корректно');
                    } else {
                        console.log('❌ Форма создания поста не найдена');
                    }
                }
            }
            
            // Шаг 8: Проверяем наличие постов в ленте
            console.log('\n📋 Шаг 8: Проверка ленты постов');
            const postsExist = await this.verifyTextExists('пост', 'в ленте');
            
            if (postsExist) {
                console.log('✅ Посты в ленте найдены');
            } else {
                console.log('❌ Посты в ленте не найдены');
            }
            
            console.log('\n🎉 Автоматическое тестирование завершено успешно!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в тестировании:', error.message);
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }
}

// Запуск бота
async function main() {
    const bot = new OCRTestBot();
    
    try {
        await bot.init();
        const success = await bot.runTest();
        
        if (success) {
            console.log('\n✅ Все тесты прошли успешно!');
        } else {
            console.log('\n❌ Тесты завершились с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

main().catch(console.error); 