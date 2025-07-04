const puppeteer = require('puppeteer');
const FinalStateAnalyzer = require('./final_state_analyzer');

class TestFinalAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.analyzer = new FinalStateAnalyzer();
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

    async testCurrentState() {
        console.log('\n📱 Тестирование текущего состояния...');
        
        await this.page.goto(this.baseUrl);
        await this.pause(3000);
        
        const state = await this.analyzer.analyzeState(this.page);
        console.log('🎯 Определенное состояние:', state);
        
        return state;
    }

    async testMenuNavigation() {
        console.log('\n📋 Тестирование навигации по меню...');
        
        // Ищем кнопку меню (обычно это иконка с тремя линиями)
        const menuButton = await this.analyzer.findElementByTestId(this.page, 'MenuIcon');
        if (menuButton) {
            console.log('✅ Кнопка меню найдена');
            await menuButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Состояние после открытия меню:', state);
            
            // Закрываем меню
            await menuButton.element.click();
            await this.pause(1000);
            
            return state;
        } else {
            console.log('❌ Кнопка меню не найдена');
            return null;
        }
    }

    async testPostInteraction() {
        console.log('\n👍 Тестирование взаимодействия с постами...');
        
        // Ищем кнопку "Нравится" на первом посте
        const likeButton = await this.analyzer.findElementByPartialText(this.page, 'Нравится');
        if (likeButton) {
            console.log('✅ Кнопка "Нравится" найдена');
            await likeButton.element.click();
            await this.pause(1000);
            
            console.log('✅ Лайк поставлен');
            return true;
        } else {
            console.log('❌ Кнопка "Нравится" не найдена');
            return false;
        }
    }

    async testChatAccess() {
        console.log('\n💬 Тестирование доступа к чату...');
        
        // Ищем кнопку чата
        const chatButton = await this.analyzer.findElementByTestId(this.page, 'SmartToyIcon');
        if (chatButton) {
            console.log('✅ Кнопка чата найдена');
            await chatButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Состояние чата:', state);
            
            return state;
        } else {
            console.log('❌ Кнопка чата не найдена');
            return null;
        }
    }

    async testSearchFunctionality() {
        console.log('\n🔍 Тестирование поиска...');
        
        // Ищем кнопку поиска
        const searchButton = await this.analyzer.findElementByTestId(this.page, 'SearchIcon');
        if (searchButton) {
            console.log('✅ Кнопка поиска найдена');
            await searchButton.element.click();
            await this.pause(2000);
            
            const state = await this.analyzer.analyzeState(this.page);
            console.log('🎯 Состояние поиска:', state);
            
            return state;
        } else {
            console.log('❌ Кнопка поиска не найдена');
            return null;
        }
    }

    async testCreatePost() {
        console.log('\n✏️ Тестирование создания поста...');
        
        // Ищем поле "Что у вас нового?"
        const postField = await this.analyzer.findElementByPartialText(this.page, 'Что у вас нового?');
        if (postField) {
            console.log('✅ Поле создания поста найдено');
            await postField.element.click();
            await this.pause(1000);
            
            // Вводим текст
            await this.page.keyboard.type('Тестовый пост от финального анализатора');
            await this.pause(1000);
            
            // Ищем кнопку отправки
            const sendButton = await this.analyzer.findElementByPartialText(this.page, 'ОТПРАВИТЬ');
            if (sendButton) {
                console.log('✅ Кнопка отправки найдена');
                await sendButton.element.click();
                await this.pause(2000);
                
                console.log('✅ Пост отправлен');
                return true;
            } else {
                console.log('❌ Кнопка отправки не найдена');
                return false;
            }
        } else {
            console.log('❌ Поле создания поста не найдено');
            return false;
        }
    }

    async runAllTests() {
        try {
            console.log('🎯 Запуск всех тестов финального анализатора...');
            
            await this.init();
            
            // Тест 1: Текущее состояние
            const currentState = await this.testCurrentState();
            
            // Тест 2: Навигация по меню
            const menuState = await this.testMenuNavigation();
            
            // Тест 3: Взаимодействие с постами
            const postInteraction = await this.testPostInteraction();
            
            // Тест 4: Доступ к чату
            const chatState = await this.testChatAccess();
            
            // Тест 5: Поиск
            const searchState = await this.testSearchFunctionality();
            
            // Тест 6: Создание поста
            const createPost = await this.testCreatePost();
            
            // Итоговый отчет
            console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
            console.log('=' * 50);
            console.log(`Текущее состояние: ${currentState?.name} (${Math.round(currentState?.confidence * 100)}%)`);
            console.log(`Меню: ${menuState?.name || 'Не тестировалось'}`);
            console.log(`Взаимодействие с постами: ${postInteraction ? '✅' : '❌'}`);
            console.log(`Чат: ${chatState?.name || 'Не тестировалось'}`);
            console.log(`Поиск: ${searchState?.name || 'Не тестировалось'}`);
            console.log(`Создание поста: ${createPost ? '✅' : '❌'}`);
            
            const successCount = [
                currentState?.confidence > 0.7,
                menuState?.confidence > 0.7,
                postInteraction,
                chatState?.confidence > 0.7,
                searchState?.confidence > 0.7,
                createPost
            ].filter(Boolean).length;
            
            console.log(`\n✅ Успешных тестов: ${successCount}/6`);
            
            if (successCount >= 5) {
                console.log('🎉 Финальный анализатор работает отлично!');
            } else if (successCount >= 4) {
                console.log('👍 Финальный анализатор работает хорошо');
            } else {
                console.log('⚠️ Финальный анализатор требует доработки');
            }
            
            // Рекомендации
            console.log('\n💡 РЕКОМЕНДАЦИИ:');
            if (currentState?.confidence > 0.8) {
                console.log('✅ Анализатор правильно определяет состояния');
            } else {
                console.log('⚠️ Нужно улучшить определение состояний');
            }
            
            if (postInteraction && createPost) {
                console.log('✅ Взаимодействие с элементами работает');
            } else {
                console.log('⚠️ Нужно улучшить поиск элементов');
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
    const tester = new TestFinalAnalyzer();
    tester.runAllTests();
}

module.exports = TestFinalAnalyzer; 