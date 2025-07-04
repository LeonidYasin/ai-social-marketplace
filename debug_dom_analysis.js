const puppeteer = require('puppeteer');

async function debugDOMAnalysis() {
    console.log('🔍 Отладка DOM-анализа...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100
    });
    
    const page = await browser.newPage();
    
    try {
        // Переходим на страницу
        console.log('🌐 Переход на http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Получаем текущий URL
        const currentUrl = await page.url();
        console.log(`🔗 Текущий URL: ${currentUrl}`);
        
        // Проверяем наличие кнопок
        console.log('\n🔍 Поиск кнопок...');
        const buttons = await page.$$('button');
        console.log(`📊 Найдено кнопок: ${buttons.length}`);
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].evaluate(el => el.textContent || '');
            const isVisible = await buttons[i].isVisible();
            console.log(`   Кнопка ${i + 1}: "${text}" (видимая: ${isVisible})`);
        }
        
        // Проверяем наличие элементов с data-testid
        console.log('\n🔍 Поиск элементов с data-testid...');
        const testIdElements = await page.$$('[data-testid]');
        console.log(`📊 Найдено элементов с data-testid: ${testIdElements.length}`);
        
        for (let i = 0; i < testIdElements.length; i++) {
            const testId = await testIdElements[i].evaluate(el => el.getAttribute('data-testid'));
            const text = await testIdElements[i].evaluate(el => el.textContent || '');
            const isVisible = await testIdElements[i].isVisible();
            console.log(`   Элемент ${i + 1}: data-testid="${testId}", текст="${text}" (видимый: ${isVisible})`);
        }
        
        // Проверяем общий текст страницы
        console.log('\n🔍 Анализ текста страницы...');
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log(`📝 Текст страницы (первые 200 символов): ${pageText.substring(0, 200)}...`);
        
        // Проверяем наличие ключевых слов
        const keywords = ['гость', 'войти', 'пост', 'создать', 'чат', 'профиль'];
        console.log('\n🔍 Поиск ключевых слов...');
        
        for (const keyword of keywords) {
            const found = pageText.toLowerCase().includes(keyword.toLowerCase());
            console.log(`   "${keyword}": ${found ? '✅ найдено' : '❌ не найдено'}`);
        }
        
        // Проверяем структуру страницы
        console.log('\n🔍 Анализ структуры страницы...');
        const structure = await page.evaluate(() => {
            const header = document.querySelector('header, .header, .app-bar, .navbar');
            const sidebar = document.querySelector('.sidebar, .side-panel, .nav-panel');
            const main = document.querySelector('main, .main, .content, .feed-container');
            const footer = document.querySelector('footer, .footer');
            
            return {
                hasHeader: !!header,
                hasSidebar: !!sidebar,
                hasMainContent: !!main,
                hasFooter: !!footer
            };
        });
        
        console.log(`🏗️ Структура:`, structure);
        
        // Определяем состояние на основе найденной информации
        console.log('\n🎯 Определение состояния...');
        let state = 'unknown';
        let confidence = 0;
        
        if (pageText.toLowerCase().includes('гость') && pageText.toLowerCase().includes('войти')) {
            state = 'Начальная страница';
            confidence = 0.8;
        } else if (pageText.toLowerCase().includes('пост') || pageText.toLowerCase().includes('лента')) {
            state = 'Гостевой пользователь вошел';
            confidence = 0.7;
        } else if (pageText.toLowerCase().includes('создать')) {
            state = 'Создание поста';
            confidence = 0.9;
        }
        
        console.log(`📊 Определенное состояние: ${state}`);
        console.log(`🎯 Уверенность: ${(confidence * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await browser.close();
        console.log('\n🧹 Отладка завершена');
    }
}

debugDOMAnalysis().catch(console.error); 