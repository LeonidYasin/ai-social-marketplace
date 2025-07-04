const puppeteer = require('puppeteer');

class PageStructureAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3000';
    }

    async init() {
        console.log('🚀 Инициализация браузера...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });
        this.page = await this.browser.newPage();
    }

    async analyzePage() {
        console.log('🌐 Переход на главную страницу...');
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n📋 Анализ структуры страницы...');

        // Получаем все кнопки
        const buttons = await this.page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], .btn, .button'));
            return allButtons.map((btn, index) => ({
                index,
                text: btn.textContent?.trim() || '',
                tagName: btn.tagName,
                className: btn.className,
                id: btn.id,
                'data-testid': btn.getAttribute('data-testid'),
                'aria-label': btn.getAttribute('aria-label'),
                visible: btn.offsetParent !== null
            })).filter(btn => btn.visible && btn.text);
        });

        console.log('\n🔘 Найденные кнопки:');
        buttons.forEach(btn => {
            console.log(`${btn.index}: "${btn.text}" - ${btn.tagName}${btn.className ? '.' + btn.className.split(' ')[0] : ''}${btn.id ? '#' + btn.id : ''}${btn['data-testid'] ? '[data-testid="' + btn['data-testid'] + '"]' : ''}`);
        });

        // Получаем все формы
        const forms = await this.page.evaluate(() => {
            const allForms = Array.from(document.querySelectorAll('form, [role="form"]'));
            return allForms.map((form, index) => ({
                index,
                className: form.className,
                id: form.id,
                'data-testid': form.getAttribute('data-testid'),
                visible: form.offsetParent !== null
            })).filter(form => form.visible);
        });

        console.log('\n📝 Найденные формы:');
        forms.forEach(form => {
            console.log(`${form.index}: ${form.tagName}${form.className ? '.' + form.className.split(' ')[0] : ''}${form.id ? '#' + form.id : ''}${form['data-testid'] ? '[data-testid="' + form['data-testid'] + '"]' : ''}`);
        });

        // Получаем все поля ввода
        const inputs = await this.page.evaluate(() => {
            const allInputs = Array.from(document.querySelectorAll('input, textarea, select'));
            return allInputs.map((input, index) => ({
                index,
                type: input.type,
                placeholder: input.placeholder,
                className: input.className,
                id: input.id,
                'data-testid': input.getAttribute('data-testid'),
                visible: input.offsetParent !== null
            })).filter(input => input.visible);
        });

        console.log('\n📝 Найденные поля ввода:');
        inputs.forEach(input => {
            console.log(`${input.index}: ${input.type}${input.placeholder ? ' placeholder="' + input.placeholder + '"' : ''}${input.className ? '.' + input.className.split(' ')[0] : ''}${input.id ? '#' + input.id : ''}${input['data-testid'] ? '[data-testid="' + input['data-testid'] + '"]' : ''}`);
        });

        // Получаем все ссылки
        const links = await this.page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a, [role="link"]'));
            return allLinks.map((link, index) => ({
                index,
                text: link.textContent?.trim() || '',
                href: link.href,
                className: link.className,
                id: link.id,
                'data-testid': link.getAttribute('data-testid'),
                visible: link.offsetParent !== null
            })).filter(link => link.visible && link.text);
        });

        console.log('\n🔗 Найденные ссылки:');
        links.forEach(link => {
            console.log(`${link.index}: "${link.text}" - ${link.tagName}${link.className ? '.' + link.className.split(' ')[0] : ''}${link.id ? '#' + link.id : ''}${link['data-testid'] ? '[data-testid="' + link['data-testid'] + '"]' : ''}`);
        });

        // Получаем все изображения и аватары
        const images = await this.page.evaluate(() => {
            const allImages = Array.from(document.querySelectorAll('img, [role="img"]'));
            return allImages.map((img, index) => ({
                index,
                src: img.src,
                alt: img.alt,
                className: img.className,
                id: img.id,
                'data-testid': img.getAttribute('data-testid'),
                visible: img.offsetParent !== null
            })).filter(img => img.visible);
        });

        console.log('\n🖼️ Найденные изображения:');
        images.forEach(img => {
            console.log(`${img.index}: ${img.alt || 'no-alt'} - ${img.tagName}${img.className ? '.' + img.className.split(' ')[0] : ''}${img.id ? '#' + img.id : ''}${img['data-testid'] ? '[data-testid="' + img['data-testid'] + '"]' : ''}`);
        });

        // Получаем все div с текстом
        const divs = await this.page.evaluate(() => {
            const allDivs = Array.from(document.querySelectorAll('div'));
            return allDivs.map((div, index) => ({
                index,
                text: div.textContent?.trim() || '',
                className: div.className,
                id: div.id,
                'data-testid': div.getAttribute('data-testid'),
                visible: div.offsetParent !== null
            })).filter(div => div.visible && div.text && div.text.length < 100);
        });

        console.log('\n📦 Найденные div с текстом:');
        divs.slice(0, 20).forEach(div => {
            console.log(`${div.index}: "${div.text}" - ${div.tagName}${div.className ? '.' + div.className.split(' ')[0] : ''}${div.id ? '#' + div.id : ''}${div['data-testid'] ? '[data-testid="' + div['data-testid'] + '"]' : ''}`);
        });

        // Делаем скриншот
        await this.page.screenshot({ 
            path: 'page_structure_analysis.png', 
            fullPage: true 
        });
        console.log('\n📸 Скриншот сохранен: page_structure_analysis.png');

        return { buttons, forms, inputs, links, images, divs };
    }

    async run() {
        try {
            await this.init();
            const analysis = await this.analyzePage();
            console.log('\n✅ Анализ завершен!');
            return analysis;
        } catch (error) {
            console.error('❌ Ошибка:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Запуск анализа
const analyzer = new PageStructureAnalyzer();
analyzer.run(); 