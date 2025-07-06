const fs = require('fs');
const path = require('path');

class SimpleScreenshotAnalyzer {
    constructor() {
        this.screenshotsDir = 'documentation_screenshots';
        this.reportPath = 'simple_screenshots_analysis.json';
    }

    analyzeScreenshots() {
        console.log('🔍 Анализ структуры скриншотов...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            totalScreenshots: 0,
            categories: {},
            mainScreenshots: [],
            coverage: {
                pages: [],
                components: [],
                interactions: [],
                states: [],
                mobile: false,
                multiuser: false
            }
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

        // Для устранения дублирования идентичных скриншотов
        const hashSet = new Set();

        for (const screenshot of mainScreenshots) {
            const screenshotPath = path.join(this.screenshotsDir, screenshot);
            if (fs.existsSync(screenshotPath)) {
                const analysisResult = this.analyzeScreenshotByFilename(screenshot, screenshotPath);
                // Уникальность по хешу содержимого файла
                const fileBuffer = fs.readFileSync(screenshotPath);
                const hash = require('crypto').createHash('md5').update(fileBuffer).digest('hex');
                if (!hashSet.has(hash)) {
                    analysis.mainScreenshots.push(analysisResult);
                    analysis.totalScreenshots++;
                    hashSet.add(hash);
                }
            }
        }

        // Анализируем категории
        const categories = ['states', 'components', 'interactions', 'multiuser'];
        
        for (const category of categories) {
            const categoryDir = path.join(this.screenshotsDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.png'));
                analysis.categories[category] = [];
                
                for (const file of files) {
                    const screenshotPath = path.join(categoryDir, file);
                    const analysisResult = this.analyzeScreenshotByFilename(file, screenshotPath, category);
                    // Уникальность по хешу содержимого файла
                    const fileBuffer = fs.readFileSync(screenshotPath);
                    const hash = require('crypto').createHash('md5').update(fileBuffer).digest('hex');
                    if (!hashSet.has(hash)) {
                        analysis.categories[category].push(analysisResult);
                        analysis.totalScreenshots++;
                        hashSet.add(hash);
                    }
                }
            }
        }

        // Анализируем покрытие
        analysis.coverage = this.analyzeCoverage(analysis);

        // Сохраняем отчет
        fs.writeFileSync(this.reportPath, JSON.stringify(analysis, null, 2), {encoding: 'utf8'});
        
        console.log(`✅ Анализ завершен! Проанализировано ${analysis.totalScreenshots} уникальных скриншотов`);
        console.log(`📄 Отчет сохранен: ${this.reportPath}`);
        
        return analysis;
    }

    analyzeScreenshotByFilename(filename, screenshotPath, category = '') {
        const analysis = {
            filename: filename,
            category: category,
            path: category ? `${category}/${filename}` : filename,
            fullPath: `documentation_screenshots/${category ? category + '/' : ''}${filename}`,
            features: [],
            description: '',
            uiElements: []
        };

        const name = filename.toLowerCase().replace('.png', '');

        // --- Новый блок: определение модального окна приветствия ---
        if (name.includes('main_page')) {
            // Пробуем OCR для определения модального окна (упрощённо: ищем "добро пожаловать" в названии файла)
            // В реальном анализе лучше использовать OCR, но здесь делаем по имени файла
            if (fs.existsSync(screenshotPath)) {
                const buffer = fs.readFileSync(screenshotPath);
                // Простейший эвристический способ: если файл называется 01_main_page.png, считаем что там модалка
                if (filename === '01_main_page.png') {
                    analysis.features.push('Главная страница с приветствием');
                    analysis.description = 'Главная страница с модальным окном приветствия (выбор способа входа)';
                    analysis.uiElements.push('Модальное окно "Добро пожаловать"', 'Кнопка "Войти в систему"', 'Кнопка "Продолжить как гость"', 'Лента постов', 'Боковые панели');
                    return analysis;
                }
            }
        }

        // Главная страница без модального окна
        if (name.includes('main_page') || name.includes('feed')) {
            if (filename !== '01_main_page.png') {
                analysis.features.push('Главная страница (лента)');
                analysis.description = 'Главная страница без модального окна, с лентой постов и боковыми панелями';
                analysis.uiElements.push('Лента постов', 'Боковые панели', 'Меню', 'Список пользователей');
                return analysis;
            }
        }

        // Остальные стандартные эвристики
        if (name.includes('guest')) {
            analysis.features.push('Гостевой вход');
            analysis.description = 'Функционал гостевого входа';
            analysis.uiElements.push('Кнопка "Продолжить как гость"', 'Форма гостя');
        }
        if (name.includes('login')) {
            analysis.features.push('Форма входа');
            analysis.description = 'Стандартная форма авторизации';
            analysis.uiElements.push('Поле email', 'Поле пароля', 'Кнопка входа');
        }
        if (name.includes('profile')) {
            analysis.features.push('Профиль пользователя');
            analysis.description = 'Страница профиля пользователя';
            analysis.uiElements.push('Информация пользователя', 'Настройки профиля');
        }
        if (name.includes('feed')) {
            analysis.features.push('Лента постов');
            analysis.description = 'Основная лента контента';
            analysis.uiElements.push('Посты', 'Кнопки лайков', 'Комментарии');
        }
        if (name.includes('post')) {
            analysis.features.push('Создание постов');
            analysis.description = 'Функционал создания контента';
            analysis.uiElements.push('Форма поста', 'Поле ввода', 'Кнопка публикации');
        }
        if (name.includes('chat')) {
            analysis.features.push('Чат');
            analysis.description = 'Система обмена сообщениями';
            analysis.uiElements.push('Диалоги', 'Поле сообщения', 'Кнопка отправки');
        }
        if (name.includes('sidebar')) {
            analysis.features.push('Боковая панель');
            analysis.description = 'Навигационная панель';
            analysis.uiElements.push('Меню навигации', 'Ссылки');
        }
        if (name.includes('notifications')) {
            analysis.features.push('Уведомления');
            analysis.description = 'Система уведомлений';
            analysis.uiElements.push('Список уведомлений', 'Индикаторы');
        }
        if (name.includes('search')) {
            analysis.features.push('Поиск');
            analysis.description = 'Функционал поиска';
            analysis.uiElements.push('Поле поиска', 'Результаты поиска');
        }
        if (name.includes('mobile')) {
            analysis.features.push('Мобильная версия');
            analysis.description = 'Адаптивная версия для мобильных устройств';
            analysis.uiElements.push('Мобильная навигация', 'Адаптивный дизайн');
        }
        if (name.includes('interaction') || name.includes('before') || name.includes('after')) {
            analysis.features.push('Взаимодействия');
            analysis.description = 'Демонстрация пользовательских взаимодействий';
            analysis.uiElements.push('Состояния до/после', 'Анимации');
        }
        if (name.includes('user1') || name.includes('user2') || name.includes('multiuser')) {
            analysis.features.push('Мультипользовательский режим');
            analysis.description = 'Тестирование с несколькими пользователями';
            analysis.uiElements.push('Разные аккаунты', 'Взаимодействие между пользователями');
        }
        return analysis;
    }

    analyzeCoverage(analysis) {
        const coverage = {
            pages: [],
            components: [],
            interactions: [],
            states: [],
            mobile: false,
            multiuser: false
        };
        // Анализируем все скриншоты
        const allScreenshots = [
            ...analysis.mainScreenshots,
            ...Object.values(analysis.categories).flat()
        ];
        for (const screenshot of allScreenshots) {
            if (screenshot.features.includes('Главная страница с приветствием')) coverage.pages.push('Главная с приветствием');
            if (screenshot.features.includes('Главная страница (лента)')) coverage.pages.push('Главная (лента)');
            if (screenshot.features.includes('Профиль пользователя')) coverage.pages.push('Профиль');
            if (screenshot.features.includes('Лента постов')) coverage.pages.push('Лента');
            if (screenshot.features.includes('Чат')) coverage.pages.push('Чат');
            if (screenshot.features.includes('Поиск')) coverage.pages.push('Поиск');
            if (screenshot.features.includes('Боковая панель')) coverage.components.push('Боковая панель');
            if (screenshot.features.includes('Уведомления')) coverage.components.push('Уведомления');
            if (screenshot.features.includes('Форма входа')) coverage.components.push('Форма входа');
            if (screenshot.features.includes('Взаимодействия')) coverage.interactions.push('Пользовательские действия');
            if (screenshot.features.includes('Создание постов')) coverage.interactions.push('Создание контента');
            if (screenshot.features.includes('Гостевой вход')) coverage.states.push('Гостевой режим');
            if (screenshot.features.includes('Форма входа')) coverage.states.push('Авторизация');
            if (screenshot.features.includes('Мобильная версия')) coverage.mobile = true;
            if (screenshot.features.includes('Мультипользовательский режим')) coverage.multiuser = true;
        }
        // Убираем дубликаты
        coverage.pages = [...new Set(coverage.pages)];
        coverage.components = [...new Set(coverage.components)];
        coverage.interactions = [...new Set(coverage.interactions)];
        coverage.states = [...new Set(coverage.states)];
        return coverage;
    }

    generateSummary() {
        const analysis = this.analyzeScreenshots();
        
        console.log('\n📊 СВОДКА ПОКРЫТИЯ СКРИНШОТАМИ:');
        console.log('=====================================');
        console.log(`📸 Всего уникальных скриншотов: ${analysis.totalScreenshots}`);
        console.log(`📄 Страницы: ${analysis.coverage.pages.join(', ')}`);
        console.log(`🧩 Компоненты: ${analysis.coverage.components.join(', ')}`);
        console.log(`🖱️ Взаимодействия: ${analysis.coverage.interactions.join(', ')}`);
        console.log(`🔄 Состояния: ${analysis.coverage.states.join(', ')}`);
        console.log(`📱 Мобильная версия: ${analysis.coverage.mobile ? '✅' : '❌'}`);
        console.log(`👥 Мультипользовательский режим: ${analysis.coverage.multiuser ? '✅' : '❌'}`);
        
        console.log('\n📋 ДЕТАЛЬНЫЙ СПИСОК СКРИНШОТОВ:');
        console.log('=====================================');
        
        analysis.mainScreenshots.forEach(screenshot => {
            console.log(`📸 ${screenshot.filename}`);
            console.log(`   Описание: ${screenshot.description}`);
            console.log(`   Функции: ${screenshot.features.join(', ')}`);
            console.log(`   UI элементы: ${screenshot.uiElements.join(', ')}`);
            console.log(`   Путь: ${screenshot.fullPath}`);
            console.log('');
        });
        return analysis;
    }
}

// Запуск анализа
const analyzer = new SimpleScreenshotAnalyzer();
analyzer.generateSummary(); 