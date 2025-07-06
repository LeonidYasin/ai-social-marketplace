const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const tesseract = require('node-tesseract-ocr');

class FinalStateAnalyzer {
    constructor() {
        this.states = {
            'initial': {
                name: 'Начальная страница',
                confidence: 0,
                indicators: ['Продолжить как гость', 'Войти в систему', 'Добро пожаловать'],
                actions: ['guest_login', 'user_login']
            },
            'guest_mode': {
                name: 'Гостевой режим',
                confidence: 0,
                indicators: ['Онлайн', 'Нравится', 'Отправить', 'Что у вас нового?'],
                actions: ['create_post', 'like_post', 'send_message', 'open_menu']
            },
            'create_post': {
                name: 'Создание поста',
                confidence: 0,
                indicators: ['Что нового?', 'Опубликовать', 'Отмена'],
                actions: ['write_post', 'publish_post', 'cancel_post']
            },
            'chat': {
                name: 'Чат',
                confidence: 0,
                indicators: ['AI-чаты', 'Чаты', 'Здравствуйте! Чем могу помочь?'],
                actions: ['send_message', 'close_chat']
            },
            'menu_open': {
                name: 'Меню открыто',
                confidence: 0,
                indicators: ['Обзор', 'Топ посты', 'Достижения'],
                actions: ['navigate_overview', 'navigate_top_posts', 'navigate_achievements']
            },
            'search': {
                name: 'Поиск',
                confidence: 0,
                indicators: ['Найти', 'Фильтры'],
                actions: ['search_query', 'apply_filters']
            }
        };
    }

    async analyzeState(page) {
        try {
            console.log('🔍 Финальный анализ состояния страницы...');
            
            // Получаем детальную информацию о странице
            const pageInfo = await this.getDetailedPageInfo(page);
            
            console.log('📄 URL:', pageInfo.url);
            console.log('📄 Заголовок:', pageInfo.title);
            console.log('📄 Кнопки:', pageInfo.buttons.slice(0, 10).join(', '));
            console.log('📄 Иконки:', pageInfo.testIds.filter(id => id.includes('Icon')).slice(0, 10).join(', '));
            
            // Анализируем все состояния
            const stateResults = {};
            
            for (const [stateKey, state] of Object.entries(this.states)) {
                const result = await this.analyzeSingleState(page, stateKey, state, pageInfo);
                stateResults[stateKey] = result;
            }
            
            // Находим состояние с наивысшей уверенностью
            let bestState = null;
            let bestConfidence = 0;
            
            for (const [stateKey, result] of Object.entries(stateResults)) {
                if (result.confidence > bestConfidence) {
                    bestConfidence = result.confidence;
                    bestState = {
                        key: stateKey,
                        ...result
                    };
                }
            }
            
            console.log('🎯 Результат анализа:', bestState);
            
            return bestState || {
                name: 'Неизвестное состояние',
                confidence: 0,
                indicators: ['Не удалось определить состояние'],
                actions: ['refresh_page']
            };
            
        } catch (error) {
            console.error('❌ Ошибка при анализе состояния:', error);
            return {
                name: 'Ошибка анализа',
                confidence: 0,
                indicators: ['Ошибка при анализе'],
                actions: ['check_connection']
            };
        }
    }

    async analyzeSingleState(page, stateKey, state, pageInfo) {
        let confidence = 0;
        const foundIndicators = [];
        const missingIndicators = [];
        
        // Проверяем каждый индикатор
        for (const indicator of state.indicators) {
            const found = await this.checkIndicator(page, indicator, pageInfo);
            if (found) {
                confidence += 0.25; // Каждый найденный индикатор добавляет 25% уверенности
                foundIndicators.push(indicator);
            } else {
                missingIndicators.push(indicator);
            }
        }
        
        // Дополнительные проверки для конкретных состояний
        if (stateKey === 'initial') {
            const hasGuestButton = pageInfo.buttons.some(btn => btn.includes('Продолжить как гость'));
            const hasLoginButton = pageInfo.buttons.some(btn => btn.includes('Войти в систему'));
            const hasOnlineUsers = pageInfo.pageText.includes('Онлайн');
            
            if (hasGuestButton && hasLoginButton && !hasOnlineUsers) {
                confidence = Math.max(confidence, 0.95);
            }
        }
        
        if (stateKey === 'guest_mode') {
            const hasLikeButtons = pageInfo.buttons.some(btn => btn.includes('Нравится'));
            const hasSendButtons = pageInfo.buttons.some(btn => btn.includes('Отправить'));
            const hasOnlineUsers = pageInfo.pageText.includes('Онлайн');
            const hasGuestButton = pageInfo.buttons.some(btn => btn.includes('Продолжить как гость'));
            
            if (hasLikeButtons && hasSendButtons && hasOnlineUsers && !hasGuestButton) {
                confidence = Math.max(confidence, 0.9);
            }
        }
        
        if (stateKey === 'menu_open') {
            const hasOverview = pageInfo.buttons.some(btn => btn.includes('Обзор'));
            const hasTopPosts = pageInfo.buttons.some(btn => btn.includes('Топ посты'));
            const hasAchievements = pageInfo.buttons.some(btn => btn.includes('Достижения'));
            
            if (hasOverview && hasTopPosts && hasAchievements) {
                confidence = Math.max(confidence, 0.95);
            }
        }
        
        if (stateKey === 'chat') {
            const hasChatText = pageInfo.pageText.includes('AI-чаты') || pageInfo.pageText.includes('Чаты');
            const hasGreeting = pageInfo.pageText.includes('Здравствуйте! Чем могу помочь?');
            
            if (hasChatText && hasGreeting) {
                confidence = Math.max(confidence, 0.9);
            }
        }
        
        return {
            name: state.name,
            confidence: Math.min(confidence, 1.0),
            foundIndicators,
            missingIndicators,
            actions: state.actions
        };
    }

    async checkIndicator(page, indicator, pageInfo) {
        // Проверяем в кнопках
        if (pageInfo.buttons.some(btn => btn.includes(indicator))) {
            return true;
        }
        
        // Проверяем в иконках
        if (indicator.includes('Icon')) {
            const testId = indicator;
            if (pageInfo.testIds.includes(testId)) {
                return true;
            }
        }
        
        // Проверяем в общем тексте страницы
        if (pageInfo.pageText.includes(indicator)) {
            return true;
        }
        
        return false;
    }

    async findElementByText(page, searchText) {
        try {
            const element = await page.evaluateHandle((text) => {
                const elements = document.querySelectorAll('button, a, span, div, p, h1, h2, h3, h4, h5, h6');
                for (const element of elements) {
                    if (element.textContent && element.textContent.trim() === text) {
                        return element;
                    }
                }
                return null;
            }, searchText);
            
            if (element) {
                const isVisible = await element.isVisible();
                if (isVisible) {
                    const box = await element.boundingBox();
                    return {
                        element: element,
                        text: searchText,
                        x: box.x + box.width / 2,
                        y: box.y + box.height / 2,
                        confidence: 0.95
                    };
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async findElementByTestId(page, testId) {
        try {
            const element = await page.$(`[data-testid="${testId}"]`);
            if (element) {
                const isVisible = await element.isVisible();
                if (isVisible) {
                    const box = await element.boundingBox();
                    return {
                        element: element,
                        testId: testId,
                        x: box.x + box.width / 2,
                        y: box.y + box.height / 2,
                        confidence: 0.9
                    };
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async getDetailedPageInfo(page) {
        try {
            const info = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean),
                    links: Array.from(document.querySelectorAll('a')).map(link => link.textContent?.trim()).filter(Boolean),
                    testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
                    pageText: document.body.innerText.substring(0, 1000)
                };
            });
            
            return info;
        } catch (error) {
            return { error: error.message };
        }
    }

    async findElementByPartialText(page, searchText) {
        try {
            const element = await page.evaluateHandle((text) => {
                const elements = document.querySelectorAll('button, a, span, div, p, h1, h2, h3, h4, h5, h6');
                for (const element of elements) {
                    if (element.textContent && element.textContent.includes(text)) {
                        return element;
                    }
                }
                return null;
            }, searchText);
            
            if (element) {
                const isVisible = await element.isVisible();
                if (isVisible) {
                    const box = await element.boundingBox();
                    const text = await element.evaluate(el => el.textContent?.trim());
                    return {
                        element: element,
                        text: text,
                        x: box.x + box.width / 2,
                        y: box.y + box.height / 2,
                        confidence: 0.9
                    };
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
}

// Функция для показа Windows уведомления
function showWindowsNotification(title, message) {
    const escapedTitle = title.replace(/'/g, "''");
    const escapedMessage = message.replace(/'/g, "''");
    
    const command = `powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${escapedMessage}', '${escapedTitle}', 'OK', 'Information')"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log('Ошибка при показе уведомления Windows:', error.message);
        }
    });
}

module.exports = FinalStateAnalyzer; 