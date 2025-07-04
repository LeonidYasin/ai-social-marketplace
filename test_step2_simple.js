const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep2() {
    console.log('🚀 Запуск простого теста шага 2: Вход и проверка чата');
    
    let browser1, browser2;
    
    try {
        // Запускаем первый браузер
        console.log('🌐 Запускаем первый браузер');
        browser1 = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page1 = await browser1.newPage();
        
        // Переходим на сайт
        console.log('📱 Первый браузер: переходим на http://localhost:3000');
        await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Делаем скриншот начального состояния
        console.log('📸 Первый браузер: делаем скриншот начального состояния');
        await page1.screenshot({ path: 'test_screenshots/step2_simple_01_initial.png', fullPage: true });
        
        // Проверяем, нужно ли войти
        console.log('🔍 Первый браузер: проверяем, нужно ли войти');
        const guestButtonText = await page1.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const guestButton = buttons.find(btn => btn.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ'));
            return guestButton ? guestButton.textContent : null;
        });
        
        if (guestButtonText) {
            console.log('✅ Первый браузер: найдена кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            
            // Кликаем по кнопке через текст
            await page1.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const guestButton = buttons.find(btn => btn.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ'));
                if (guestButton) {
                    guestButton.click();
                }
            });
            
            console.log('✅ Первый браузер: кликнули по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            
            // Ждем загрузки
            await page1.waitForTimeout(2000);
            
            // Делаем скриншот после входа
            console.log('📸 Первый браузер: делаем скриншот после входа');
            await page1.screenshot({ path: 'test_screenshots/step2_simple_02_after_login.png', fullPage: true });
            
        } else {
            console.log('⚠️ Первый браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена, возможно уже вошли');
        }
        
        // Запускаем второй браузер
        console.log('🌐 Запускаем второй браузер');
        browser2 = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page2 = await browser2.newPage();
        
        // Переходим на сайт
        console.log('📱 Второй браузер: переходим на http://localhost:3000');
        await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Делаем скриншот начального состояния
        console.log('📸 Второй браузер: делаем скриншот начального состояния');
        await page2.screenshot({ path: 'test_screenshots/step2_simple_03_browser2_initial.png', fullPage: true });
        
        // Проверяем, нужно ли войти
        console.log('🔍 Второй браузер: проверяем, нужно ли войти');
        const guestButtonText2 = await page2.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const guestButton = buttons.find(btn => btn.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ'));
            return guestButton ? guestButton.textContent : null;
        });
        
        if (guestButtonText2) {
            console.log('✅ Второй браузер: найдена кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            
            // Кликаем по кнопке через текст
            await page2.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const guestButton = buttons.find(btn => btn.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ'));
                if (guestButton) {
                    guestButton.click();
                }
            });
            
            console.log('✅ Второй браузер: кликнули по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            
            // Ждем загрузки
            await page2.waitForTimeout(2000);
            
            // Делаем скриншот после входа
            console.log('📸 Второй браузер: делаем скриншот после входа');
            await page2.screenshot({ path: 'test_screenshots/step2_simple_04_browser2_after_login.png', fullPage: true });
            
        } else {
            console.log('⚠️ Второй браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена, возможно уже вошли');
        }
        
        // Проверяем, видят ли пользователи друг друга в сайдбаре
        console.log('🔍 Проверяем, видят ли пользователи друг друга в сайдбаре');
        
        // Проверяем первого пользователя
        const sidebarUsers1 = await page1.evaluate(() => {
            const sidebar = document.querySelector('[data-testid="sidebar"]') || 
                          document.querySelector('.sidebar') ||
                          document.querySelector('aside');
            
            if (!sidebar) {
                return { found: false, users: [] };
            }
            
            const userElements = sidebar.querySelectorAll('[data-testid*="user"], .user-item, [class*="user"]');
            const users = Array.from(userElements).map(el => ({
                text: el.textContent.trim(),
                visible: el.offsetParent !== null
            }));
            
            return { found: true, users };
        });
        
        console.log('📊 Первый браузер - сайдбар:', sidebarUsers1);
        
        // Проверяем второго пользователя
        const sidebarUsers2 = await page2.evaluate(() => {
            const sidebar = document.querySelector('[data-testid="sidebar"]') || 
                          document.querySelector('.sidebar') ||
                          document.querySelector('aside');
            
            if (!sidebar) {
                return { found: false, users: [] };
            }
            
            const userElements = sidebar.querySelectorAll('[data-testid*="user"], .user-item, [class*="user"]');
            const users = Array.from(userElements).map(el => ({
                text: el.textContent.trim(),
                visible: el.offsetParent !== null
            }));
            
            return { found: true, users };
        });
        
        console.log('📊 Второй браузер - сайдбар:', sidebarUsers2);
        
        // Делаем финальные скриншоты
        console.log('📸 Делаем финальные скриншоты');
        await page1.screenshot({ path: 'test_screenshots/step2_simple_05_browser1_final.png', fullPage: true });
        await page2.screenshot({ path: 'test_screenshots/step2_simple_06_browser2_final.png', fullPage: true });
        
        console.log('✅ Тест завершен успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка в тесте:', error.message);
        
        // Делаем скриншот ошибки
        if (browser1) {
            const page1 = (await browser1.pages())[0];
            if (page1) {
                await page1.screenshot({ path: 'test_screenshots/step2_simple_error_browser1.png', fullPage: true });
            }
        }
        
        if (browser2) {
            const page2 = (await browser2.pages())[0];
            if (page2) {
                await page2.screenshot({ path: 'test_screenshots/step2_simple_error_browser2.png', fullPage: true });
            }
        }
    } finally {
        // Закрываем браузеры
        if (browser1) await browser1.close();
        if (browser2) await browser2.close();
    }
}

testStep2().catch(console.error); 