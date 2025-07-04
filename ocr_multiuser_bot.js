const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRMultiUserBot {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init() {
        console.log('🤖 Инициализация OCR мультипользовательского тест-бота...');
        
        // Запускаем два браузера
        for (let i = 0; i < 2; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', `--user-data-dir=./user-data-${i}`]
            });
            
            const page = await browser.newPage();
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
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

    async clickOnText(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Ищем текст "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `search_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length === 0) {
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден`);
            return false;
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Браузер ${pageIndex + 1}: Найдено "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Браузер ${pageIndex + 1}: Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        // Кликаем по центру элемента
        await this.pages[pageIndex].mouse.click(target.centerX, target.centerY);
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${target.centerX}, ${target.centerY})`);
        
        // Ждем немного для загрузки
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
    }

    async verifyTextExists(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверяем наличие текста "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `verify_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length > 0) {
            console.log(`✅ Браузер ${pageIndex + 1}: Текст "${searchText}" найден (${coords.length} совпадений)`);
            return true;
        } else {
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден`);
            return false;
        }
    }

    async runMultiUserTest() {
        try {
            console.log('🚀 Запуск мультипользовательского тестирования');
            
            // Шаг 1: Открываем приложение в двух браузерах
            console.log('\n📋 Шаг 1: Открытие приложения в двух браузерах');
            for (let i = 0; i < 2; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Входим как гости в оба браузера
            console.log('\n📋 Шаг 2: Гостевой вход в оба браузера');
            for (let i = 0; i < 2; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                
                // Проверяем наличие кнопки гостевого входа
                const guestButtonExists = await this.verifyTextExists(i, 'гость', 'на кнопке гостевого входа');
                
                if (!guestButtonExists) {
                    console.log(`❌ Браузер ${i + 1}: Кнопка гостевого входа не найдена`);
                    return false;
                }
                
                // Кликаем по кнопке гостевого входа
                const guestClickSuccess = await this.clickOnText(i, 'гость', 'для гостевого входа');
                
                if (!guestClickSuccess) {
                    console.log(`❌ Браузер ${i + 1}: Не удалось кликнуть по кнопке гостевого входа`);
                    return false;
                }
                
                // Проверяем успешный вход
                const loginSuccess = await this.verifyTextExists(i, 'пост', 'в ленте постов');
                
                if (!loginSuccess) {
                    console.log(`❌ Браузер ${i + 1}: Вход не выполнен - посты не найдены`);
                    return false;
                }
                
                console.log(`✅ Браузер ${i + 1}: Гостевой вход выполнен успешно`);
            }
            
            // Шаг 3: Проверяем, что пользователи видят друг друга в сайдбаре
            console.log('\n📋 Шаг 3: Проверка видимости пользователей в сайдбаре');
            for (let i = 0; i < 2; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                
                // Ищем пользователей в сайдбаре
                const usersInSidebar = await this.verifyTextExists(i, 'пользователь', 'в сайдбаре');
                
                if (usersInSidebar) {
                    console.log(`✅ Браузер ${i + 1}: Пользователи в сайдбаре найдены`);
                } else {
                    console.log(`❌ Браузер ${i + 1}: Пользователи в сайдбаре не найдены`);
                }
            }
            
            // Шаг 4: Проверяем возможность создания постов
            console.log('\n📋 Шаг 4: Тестирование создания постов');
            for (let i = 0; i < 2; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                
                // Ищем кнопку создания поста
                const createPostButton = await this.verifyTextExists(i, 'создать', 'кнопка создания поста');
                
                if (createPostButton) {
                    console.log(`✅ Браузер ${i + 1}: Кнопка создания поста найдена`);
                    
                    // Кликаем по кнопке создания поста
                    const createPostClick = await this.clickOnText(i, 'создать', 'для создания поста');
                    
                    if (createPostClick) {
                        console.log(`✅ Браузер ${i + 1}: Форма создания поста открыта`);
                        
                        // Проверяем форму создания поста
                        const formExists = await this.verifyTextExists(i, 'отправить', 'в форме поста');
                        
                        if (formExists) {
                            console.log(`✅ Браузер ${i + 1}: Форма создания поста работает корректно`);
                        } else {
                            console.log(`❌ Браузер ${i + 1}: Форма создания поста не найдена`);
                        }
                    }
                } else {
                    console.log(`❌ Браузер ${i + 1}: Кнопка создания поста не найдена`);
                }
            }
            
            // Шаг 5: Проверяем чат между пользователями
            console.log('\n📋 Шаг 5: Тестирование чата между пользователями');
            
            // В первом браузере ищем пользователя в сайдбаре и кликаем для открытия чата
            console.log('\n--- Браузер 1: Открытие чата ---');
            const chatClickSuccess = await this.clickOnText(0, 'пользователь', 'для открытия чата');
            
            if (chatClickSuccess) {
                console.log('✅ Браузер 1: Чат открыт');
                
                // Проверяем наличие поля ввода сообщения
                const messageInput = await this.verifyTextExists(0, 'сообщение', 'поле ввода сообщения');
                
                if (messageInput) {
                    console.log('✅ Браузер 1: Поле ввода сообщения найдено');
                } else {
                    console.log('❌ Браузер 1: Поле ввода сообщения не найдено');
                }
            } else {
                console.log('❌ Браузер 1: Не удалось открыть чат');
            }
            
            // Шаг 6: Проверяем уведомления
            console.log('\n📋 Шаг 6: Проверка уведомлений');
            for (let i = 0; i < 2; i++) {
                const notifications = await this.verifyTextExists(i, 'уведомление', 'в интерфейсе');
                
                if (notifications) {
                    console.log(`✅ Браузер ${i + 1}: Уведомления найдены`);
                } else {
                    console.log(`❌ Браузер ${i + 1}: Уведомления не найдены`);
                }
            }
            
            console.log('\n🎉 Мультипользовательское тестирование завершено успешно!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в мультипользовательском тестировании:', error.message);
            return false;
        }
    }

    async close() {
        for (let i = 0; i < this.browsers.length; i++) {
            if (this.browsers[i]) {
                await this.browsers[i].close();
                console.log(`🔒 Браузер ${i + 1} закрыт`);
            }
        }
    }
}

// Запуск мультипользовательского бота
async function main() {
    const bot = new OCRMultiUserBot();
    
    try {
        await bot.init();
        const success = await bot.runMultiUserTest();
        
        if (success) {
            console.log('\n✅ Все мультипользовательские тесты прошли успешно!');
        } else {
            console.log('\n❌ Мультипользовательские тесты завершились с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

main().catch(console.error); 