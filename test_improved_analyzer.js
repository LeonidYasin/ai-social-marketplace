const puppeteer = require('puppeteer');
const ImprovedStateAnalyzer = require('./improved_state_analyzer');

class TestImprovedAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.analyzer = new ImprovedStateAnalyzer();
        this.baseUrl = 'http://localhost:3000';
    }

    async init() {
        console.log('🚀 Инициализация браузера...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        console.log('✅ Браузер инициализирован');
    }

    async pause(ms = 2000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async testInitialState() {
        console.log('\n📱 Тестирование начального состояния...');
        
        await this.page.goto(this.baseUrl);
        await this.pause(3000);
        
        const state = await this.analyzer.analyzeState(this.page);
        console.log('🎯 Определенное состояние:', state);
        
        // Проверяем точность определения
        if (state.name === 'Начальная страница' && state.confidence > 0.8) {
            console.log('✅ Начальное состояние определено корректно');
        } else {
            console.log('❌ Ошибка определения начального состояния');
        }
        
        return state;
    }

    async testGuestMode() {
        console.log('\n👤 Тестирование гостевого режима...');
        
        // Кликаем "Продолжить как гость"
        const guestButton = await this.analyzer.findElementByText(this.page, 'Продолжить как гость');
        if (guestButton) {
            await guestButton.element.click();
            await this.pause(3000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Определенное состояние:', state);
            
            if (state.name === 'Гостевой режим' && state.confidence > 0.7) {
                console.log('✅ Гостевой режим определен корректно');
            } else {
                console.log('❌ Ошибка определения гостевого режима');
            }
            
            return state;
        } else {
            console.log('❌ Кнопка "Продолжить как гость" не найдена');
            return null;
        }
    }

    async testCreatePost() {
        console.log('\n✏️ Тестирование создания поста...');
        
        // Ищем кнопку создания поста
        const addButton = await this.analyzer.findElementByTestId(this.page, 'AddIcon');
        if (addButton) {
            await addButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Определенное состояние:', state);
            
            if (state.name === 'Создание поста' && state.confidence > 0.8) {
                console.log('✅ Состояние создания поста определено корректно');
            } else {
                console.log('❌ Ошибка определения состояния создания поста');
            }
            
            // Отменяем создание
            const cancelButton = await this.analyzer.findElementByText(this.page, 'Отмена');
            if (cancelButton) {
                await cancelButton.element.click();
                await this.pause(2000);
            }
            
            return state;
        } else {
            console.log('❌ Кнопка создания поста не найдена');
            return null;
        }
    }

    async testMenuNavigation() {
        console.log('\n📋 Тестирование навигации по меню...');
        
        // Ищем кнопку меню
        const menuButton = await this.analyzer.findElementByTestId(this.page, 'MenuIcon');
        if (menuButton) {
            await menuButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Определенное состояние:', state);
            
            // Закрываем меню
            await menuButton.element.click();
            await this.pause(1000);
            
            return state;
        } else {
            console.log('❌ Кнопка меню не найдена');
            return null;
        }
    }

    async testSearchFunctionality() {
        console.log('\n🔍 Тестирование поиска...');
        
        // Ищем кнопку поиска
        const searchButton = await this.analyzer.findElementByTestId(this.page, 'SearchIcon');
        if (searchButton) {
            await searchButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Определенное состояние:', state);
            
            return state;
        } else {
            console.log('❌ Кнопка поиска не найдена');
            return null;
        }
    }

    async getDetailedPageInfo() {
        console.log('\n📄 Получение детальной информации о странице...');
        
        const info = await this.analyzer.getPageInfo(this.page);
        console.log('📊 Информация о странице:', JSON.stringify(info, null, 2));
        
        return info;
    }

    async runAllTests() {
        try {
            console.log('🎯 Запуск всех тестов улучшенного анализатора...');
            
            await this.init();
            
            // Тест 1: Начальное состояние
            const initialState = await this.testInitialState();
            
            // Тест 2: Гостевой режим
            const guestState = await this.testGuestMode();
            
            // Тест 3: Создание поста
            const createPostState = await this.testCreatePost();
            
            // Тест 4: Навигация по меню
            const menuState = await this.testMenuNavigation();
            
            // Тест 5: Поиск
            const searchState = await this.testSearchFunctionality();
            
            // Детальная информация
            const pageInfo = await this.getDetailedPageInfo();
            
            // Итоговый отчет
            console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
            console.log('=' * 50);
            console.log(`Начальное состояние: ${initialState?.name} (${initialState?.confidence * 100}%)`);
            console.log(`Гостевой режим: ${guestState?.name} (${guestState?.confidence * 100}%)`);
            console.log(`Создание поста: ${createPostState?.name} (${createPostState?.confidence * 100}%)`);
            console.log(`Меню: ${menuState?.name} (${menuState?.confidence * 100}%)`);
            console.log(`Поиск: ${searchState?.name} (${searchState?.confidence * 100}%)`);
            
            const successCount = [initialState, guestState, createPostState, menuState, searchState]
                .filter(state => state && state.confidence > 0.7).length;
            
            console.log(`\n✅ Успешных тестов: ${successCount}/5`);
            
            if (successCount >= 4) {
                console.log('🎉 Анализатор работает отлично!');
            } else if (successCount >= 3) {
                console.log('👍 Анализатор работает хорошо, есть возможности для улучшения');
            } else {
                console.log('⚠️ Анализатор требует доработки');
            }
            
        } catch (error) {
            console.error('❌ Ошибка при выполнении тестов:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Запуск тестов
if (require.main === module) {
    const tester = new TestImprovedAnalyzer();
    tester.runAllTests();
}

module.exports = TestImprovedAnalyzer; 