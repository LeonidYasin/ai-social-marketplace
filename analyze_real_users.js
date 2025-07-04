const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');

class RealUserAnalyzer {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.userProfiles = [];
        this.stepCounter = 0;
    }

    async init(browserCount = 2) {
        console.log(`🔍 Инициализация анализатора реальных пользователей (${browserCount} браузеров)...`);
        
        // Создаем уникальные профили для каждого браузера
        for (let i = 0; i < browserCount; i++) {
            const profileDir = `./isolated-user-data-${i}`;
            
            // Удаляем старый профиль если существует
            if (fs.existsSync(profileDir)) {
                fs.rmSync(profileDir, { recursive: true, force: true });
            }
            
            this.userProfiles.push(profileDir);
        }
        
        // Запускаем браузеры с изолированными профилями
        for (let i = 0; i < browserCount; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: [
                    '--start-maximized', 
                    '--no-sandbox',
                    `--user-data-dir=${this.userProfiles[i]}`,
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            
            const page = await browser.newPage();
            
            // Устанавливаем уникальные заголовки для каждого браузера
            await page.setExtraHTTPHeaders({
                'X-User-Agent': `RealAnalyzer-${i + 1}`,
                'X-User-ID': `user-${i + 1}`
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен с изолированным профилем: ${this.userProfiles[i]}`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/real_analysis_step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
    }

    async extractAllText(imagePath) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve([]);
                    return;
                }

                const outputFile = 'output.tsv';
                if (!fs.existsSync(outputFile)) {
                    resolve([]);
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                const lines = content.trim().split('\n');
                
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = lines[0].split('\t');
                const allText = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t');
                    if (values.length >= headers.length) {
                        const text = values[headers.indexOf('text')];
                        const conf = parseFloat(values[headers.indexOf('conf')]);
                        
                        if (text && conf > 30) {
                            allText.push({
                                text: text.toLowerCase(),
                                confidence: conf
                            });
                        }
                    }
                }

                resolve(allText);
            });
        });
    }

    async analyzeDOM(pageIndex) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Детальный анализ DOM структуры`);
        
        try {
            const domInfo = await this.pages[pageIndex].evaluate(() => {
                const info = {
                    title: document.title,
                    url: window.location.href,
                    currentUser: null,
                    sidebarUsers: [],
                    allButtons: [],
                    userElements: [],
                    chatElements: [],
                    postElements: [],
                    sidebarElements: [],
                    rightPanelElements: [],
                    leftPanelElements: [],
                    mainContentElements: []
                };

                // Ищем информацию о текущем пользователе
                const userElements = document.querySelectorAll('[class*="user"], [class*="profile"], [data-testid*="user"], [class*="avatar"]');
                userElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const elementInfo = {
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            text: el.textContent?.trim() || '',
                            dataTestId: el.getAttribute('data-testid') || '',
                            ariaLabel: el.getAttribute('aria-label') || '',
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                        
                        info.userElements.push(elementInfo);
                        
                        // Определяем, является ли это текущим пользователем (обычно в верхней части)
                        if (rect.y < 100 && elementInfo.text) {
                            info.currentUser = elementInfo;
                        }
                    }
                });

                // Ищем элементы сайдбара (правая панель)
                const rightSidebar = document.querySelectorAll('[class*="sidebar"], [class*="right"], [class*="panel"]');
                rightSidebar.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        // Проверяем, находится ли элемент в правой части экрана
                        if (rect.x > window.innerWidth * 0.6) {
                            info.rightPanelElements.push({
                                tagName: el.tagName,
                                className: el.className,
                                text: el.textContent?.substring(0, 200),
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            });
                        }
                    }
                });

                // Ищем элементы левой панели
                const leftSidebar = document.querySelectorAll('[class*="sidebar"], [class*="left"], [class*="nav"]');
                leftSidebar.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        // Проверяем, находится ли элемент в левой части экрана
                        if (rect.x < window.innerWidth * 0.3) {
                            info.leftPanelElements.push({
                                tagName: el.tagName,
                                className: el.className,
                                text: el.textContent?.substring(0, 200),
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            });
                        }
                    }
                });

                // Ищем все кнопки
                const buttons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                buttons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.allButtons.push({
                            text: btn.textContent?.trim() || '',
                            ariaLabel: btn.getAttribute('aria-label') || '',
                            className: btn.className,
                            id: btn.id,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем элементы чата
                const chatElements = document.querySelectorAll('[class*="chat"], [class*="message"], [class*="conversation"]');
                chatElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.chatElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем элементы постов
                const postElements = document.querySelectorAll('[class*="post"], [class*="feed"], [class*="card"]');
                postElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.postElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем элементы основного контента
                const mainContent = document.querySelectorAll('[class*="main"], [class*="content"], [class*="app"]');
                mainContent.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.mainContentElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                return info;
            });

            console.log(`📊 Браузер ${pageIndex + 1}: DOM анализ завершен`);
            console.log(`   - Элементов пользователей: ${domInfo.userElements.length}`);
            console.log(`   - Элементов правой панели: ${domInfo.rightPanelElements.length}`);
            console.log(`   - Элементов левой панели: ${domInfo.leftPanelElements.length}`);
            console.log(`   - Кнопок: ${domInfo.allButtons.length}`);
            console.log(`   - Элементов чата: ${domInfo.chatElements.length}`);
            console.log(`   - Элементов постов: ${domInfo.postElements.length}`);

            return domInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка анализа DOM:`, error.message);
            return null;
        }
    }

    async analyzeRealUsers(pageIndex) {
        console.log(`\n🔍 Браузер ${pageIndex + 1}: Анализ реальных пользователей`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, 'real_users_analysis');
        const domInfo = await this.analyzeDOM(pageIndex);
        const allText = await this.extractAllText(screenshotPath);
        
        // Анализируем текущего пользователя
        console.log(`👤 Браузер ${pageIndex + 1}: Текущий пользователь:`);
        if (domInfo.currentUser) {
            console.log(`   - Имя: "${domInfo.currentUser.text}"`);
            console.log(`   - Класс: ${domInfo.currentUser.className}`);
            console.log(`   - ID: ${domInfo.currentUser.id}`);
            console.log(`   - Позиция: x=${domInfo.currentUser.position.x}, y=${domInfo.currentUser.position.y}`);
        } else {
            console.log(`   - Не найден`);
        }
        
        // Анализируем правую панель (где должны быть другие пользователи)
        console.log(`\n👥 Браузер ${pageIndex + 1}: Анализ правой панели (другие пользователи):`);
        if (domInfo.rightPanelElements.length > 0) {
            domInfo.rightPanelElements.forEach((element, index) => {
                console.log(`   ${index + 1}. ${element.tagName}.${element.className}`);
                console.log(`      Текст: "${element.text.substring(0, 100)}..."`);
                console.log(`      Позиция: x=${element.position.x}, y=${element.position.y}`);
            });
        } else {
            console.log(`   - Правая панель не найдена или пуста`);
        }
        
        // Анализируем все элементы пользователей
        console.log(`\n🔍 Браузер ${pageIndex + 1}: Все элементы пользователей:`);
        const userNames = new Set();
        domInfo.userElements.forEach((element, index) => {
            if (element.text) {
                userNames.add(element.text);
                console.log(`   ${index + 1}. "${element.text}" (${element.className})`);
            }
        });
        
        console.log(`\n📊 Браузер ${pageIndex + 1}: Статистика:`);
        console.log(`   - Всего элементов пользователей: ${domInfo.userElements.length}`);
        console.log(`   - Уникальных имен: ${userNames.size}`);
        console.log(`   - Элементов правой панели: ${domInfo.rightPanelElements.length}`);
        console.log(`   - Элементов левой панели: ${domInfo.leftPanelElements.length}`);
        
        // Проверяем, есть ли реальные другие пользователи
        const hasOtherUsers = domInfo.rightPanelElements.length > 0;
        const otherUserNames = Array.from(userNames).filter(name => 
            name !== domInfo.currentUser?.text && 
            (name.includes('гость') || name.includes('пользователь') || name.includes('user'))
        );
        
        console.log(`\n🎯 Браузер ${pageIndex + 1}: Вывод:`);
        if (hasOtherUsers && otherUserNames.length > 0) {
            console.log(`   ✅ Обнаружены другие пользователи: ${otherUserNames.join(', ')}`);
            console.log(`   ✅ Правая панель содержит элементы пользователей`);
        } else {
            console.log(`   ❌ Другие пользователи не обнаружены в правой панели`);
            console.log(`   ❌ Возможно, это "мертвые души" - старые данные или моковые пользователи`);
        }
        
        return {
            currentUser: domInfo.currentUser,
            rightPanelUsers: domInfo.rightPanelElements,
            allUserNames: Array.from(userNames),
            otherUserNames: otherUserNames,
            hasRealUsers: hasOtherUsers && otherUserNames.length > 0,
            domInfo: domInfo,
            allText: allText
        };
    }

    async performGuestLogin(pageIndex) {
        console.log(`\n🎯 Браузер ${pageIndex + 1}: Выполнение гостевого входа`);
        
        try {
            // Ищем кнопку гостевого входа
            const result = await this.pages[pageIndex].evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"]'));
                const guestButton = buttons.find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
                    return text.includes('гость') || ariaLabel.includes('гость');
                });
                
                if (guestButton) {
                    const rect = guestButton.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        guestButton.click();
                        return {
                            success: true,
                            text: guestButton.textContent?.trim(),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                    }
                }
                
                return { success: false, reason: 'button_not_found' };
            });
            
            if (result.success) {
                console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен по кнопке "${result.text}"`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return { success: true };
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Кнопка гостевого входа не найдена`);
                return { success: false };
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка гостевого входа:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async runRealUserAnalysis() {
        try {
            console.log('🔍 Запуск анализа реальных пользователей');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Гостевой вход для всех браузеров
            console.log('\n📋 Шаг 2: Гостевой вход');
            for (let i = 0; i < this.pages.length; i++) {
                const loginResult = await this.performGuestLogin(i);
                if (!loginResult.success) {
                    console.log(`❌ Браузер ${i + 1}: Вход не выполнен`);
                    return false;
                }
            }
            
            // Шаг 3: Анализ реальных пользователей
            console.log('\n📋 Шаг 3: Анализ реальных пользователей');
            const analysisResults = [];
            
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                const analysisResult = await this.analyzeRealUsers(i);
                analysisResults.push(analysisResult);
            }
            
            // Шаг 4: Сравнительный анализ
            console.log('\n📋 Шаг 4: Сравнительный анализ');
            console.log('\n🔍 Сравнение пользователей между браузерами:');
            
            for (let i = 0; i < analysisResults.length; i++) {
                for (let j = i + 1; j < analysisResults.length; j++) {
                    console.log(`\n📊 Браузер ${i + 1} vs Браузер ${j + 1}:`);
                    
                    const user1 = analysisResults[i].currentUser?.text || 'Неизвестен';
                    const user2 = analysisResults[j].currentUser?.text || 'Неизвестен';
                    
                    console.log(`   Браузер ${i + 1} пользователь: "${user1}"`);
                    console.log(`   Браузер ${j + 1} пользователь: "${user2}"`);
                    
                    if (user1 !== user2) {
                        console.log(`   ✅ Пользователи разные - изоляция работает!`);
                    } else {
                        console.log(`   ❌ Пользователи одинаковые - изоляция не работает!`);
                    }
                    
                    // Проверяем, видят ли пользователи друг друга
                    const users1 = analysisResults[i].otherUserNames;
                    const users2 = analysisResults[j].otherUserNames;
                    
                    console.log(`   Браузер ${i + 1} видит других: ${users1.join(', ') || 'никого'}`);
                    console.log(`   Браузер ${j + 1} видит других: ${users2.join(', ') || 'никого'}`);
                    
                    const user1SeesUser2 = users1.some(name => name.includes(user2) || user2.includes(name));
                    const user2SeesUser1 = users2.some(name => name.includes(user1) || user1.includes(name));
                    
                    if (user1SeesUser2 && user2SeesUser1) {
                        console.log(`   ✅ Пользователи видят друг друга - реальное взаимодействие!`);
                    } else {
                        console.log(`   ❌ Пользователи не видят друг друга - "мертвые души" или нет взаимодействия`);
                    }
                }
            }
            
            console.log('\n🎉 Анализ реальных пользователей завершен!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в анализе реальных пользователей:', error.message);
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
        
        // Очищаем профили
        for (const profileDir of this.userProfiles) {
            if (fs.existsSync(profileDir)) {
                fs.rmSync(profileDir, { recursive: true, force: true });
                console.log(`🗑️ Профиль удален: ${profileDir}`);
            }
        }
    }
}

// Запуск анализатора реальных пользователей
async function main() {
    const analyzer = new RealUserAnalyzer();
    
    try {
        await analyzer.init(2); // Запускаем 2 браузера с изолированными профилями
        const success = await analyzer.runRealUserAnalysis();
        
        if (success) {
            console.log('\n✅ Анализ реальных пользователей прошел успешно!');
        } else {
            console.log('\n❌ Анализ реальных пользователей завершился с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await analyzer.close();
    }
}

main().catch(console.error); 