const puppeteer = require('puppeteer');

async function testStep2Debug() {
    console.log('🚀 Запуск отладочного теста шага 2');
    
    let browser;
    
    try {
        // Запускаем браузер
        console.log('🌐 Запускаем браузер');
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // Переходим на сайт
        console.log('📱 Переходим на http://localhost:3000');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Ждем немного
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Делаем скриншот
        console.log('📸 Делаем скриншот');
        await page.screenshot({ path: 'test_screenshots/step2_debug_01_initial.png', fullPage: true });
        
        // Анализируем все кнопки на странице
        console.log('🔍 Анализируем все кнопки на странице');
        const buttonAnalysis = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const buttonInfo = buttons.map((btn, index) => ({
                index,
                tagName: btn.tagName,
                textContent: btn.textContent.trim(),
                innerText: btn.innerText.trim(),
                innerHTML: btn.innerHTML.substring(0, 100) + '...',
                className: btn.className,
                id: btn.id,
                'data-testid': btn.getAttribute('data-testid'),
                'aria-label': btn.getAttribute('aria-label'),
                visible: btn.offsetParent !== null,
                rect: btn.getBoundingClientRect()
            }));
            
            return buttonInfo;
        });
        
        console.log('📊 Найдено кнопок:', buttonAnalysis.length);
        buttonAnalysis.forEach((btn, index) => {
            console.log(`Кнопка ${index}:`, {
                text: btn.textContent,
                innerText: btn.innerText,
                className: btn.className,
                visible: btn.visible,
                rect: btn.rect
            });
        });
        
        // Ищем кнопки по различным критериям
        console.log('🔍 Ищем кнопки по различным критериям');
        const searchResults = await page.evaluate(() => {
            const results = {};
            
            // По тексту
            results.byTextContent = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')
            ).length;
            
            results.byInnerText = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.innerText.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')
            ).length;
            
            // По частичному совпадению
            results.byPartialText = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.includes('ГОСТЬ')
            ).length;
            
            results.byPartialInnerText = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.innerText.includes('ГОСТЬ')
            ).length;
            
            // По aria-label
            results.byAriaLabel = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.getAttribute('aria-label') && btn.getAttribute('aria-label').includes('ГОСТЬ')
            ).length;
            
            return results;
        });
        
        console.log('📊 Результаты поиска:', searchResults);
        
        // Проверяем все элементы с текстом "ГОСТЬ"
        console.log('🔍 Ищем все элементы с текстом "ГОСТЬ"');
        const guestElements = await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const guestElements = allElements.filter(el => 
                el.textContent && el.textContent.includes('ГОСТЬ')
            ).map(el => ({
                tagName: el.tagName,
                textContent: el.textContent.trim(),
                className: el.className,
                id: el.id,
                visible: el.offsetParent !== null,
                rect: el.getBoundingClientRect()
            }));
            
            return guestElements;
        });
        
        console.log('📊 Элементы с "ГОСТЬ":', guestElements.length);
        guestElements.forEach((el, index) => {
            console.log(`Элемент ${index}:`, {
                tag: el.tagName,
                text: el.textContent,
                visible: el.visible
            });
        });
        
        // Проверяем структуру DOM
        console.log('🔍 Анализируем структуру DOM');
        const domStructure = await page.evaluate(() => {
            const body = document.body;
            const children = Array.from(body.children).map(child => ({
                tagName: child.tagName,
                id: child.id,
                className: child.className,
                childrenCount: child.children.length
            }));
            
            return children;
        });
        
        console.log('📊 Структура DOM:', domStructure);
        
        console.log('✅ Отладочный тест завершен');
        
    } catch (error) {
        console.error('❌ Ошибка в тесте:', error.message);
    } finally {
        if (browser) await browser.close();
    }
}

testStep2Debug().catch(console.error); 