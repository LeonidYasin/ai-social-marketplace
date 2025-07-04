const puppeteer = require('puppeteer');

class ImprovedStateAnalyzer {
    constructor() {
        this.states = {
            'initial': {
                name: 'Начальная страница',
                confidence: 0,
                indicators: ['Продолжить как гость', 'Войти в систему'],
                actions: ['guest_login', 'user_login']
            },
            'guest_mode': {
                name: 'Гостевой режим',
                confidence: 0,
                indicators: ['Онлайн', 'AddIcon', 'MenuIcon'],
                actions: ['create_post', 'open_menu', 'open_chat']
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
                indicators: ['Чат', 'Отправить'],
                actions: ['send_message', 'close_chat']
            },
            'profile': {
                name: 'Профиль пользователя',
                confidence: 0,
                indicators: ['Профиль', 'Редактировать'],
                actions: ['edit_profile', 'back_to_feed']
            },
            'search': {
                name: 'Поиск',
                confidence: 0,
                indicators: ['Поиск', 'SearchIcon'],
                actions: ['search_query', 'close_search']
            }
        };
    }

    async analyzeState(page) {
        try {
            console.log('🔍 Улучшенный анализ состояния страницы...');
            
            // Получаем текст страницы
            const pageText = await page.evaluate(() => {
                return document.body.innerText;
            });
            
            console.log('📄 Текст страницы:', pageText.substring(0, 200) + '...');
            
            // Анализируем все состояния
            const stateResults = {};
            
            for (const [stateKey, state] of Object.entries(this.states)) {
                const result = await this.analyzeSingleState(page, stateKey, state, pageText);
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

    async analyzeSingleState(page, stateKey, state, pageText) {
        let confidence = 0;
        const foundIndicators = [];
        const missingIndicators = [];
        
        // Проверяем каждый индикатор
        for (const indicator of state.indicators) {
            const found = await this.checkIndicator(page, indicator, pageText);
            if (found) {
                confidence += 0.3; // Каждый найденный индикатор добавляет 30% уверенности
                foundIndicators.push(indicator);
            } else {
                missingIndicators.push(indicator);
            }
        }
        
        // Дополнительные проверки для конкретных состояний
        if (stateKey === 'initial') {
            const hasGuestButton = await this.findExactText(page, 'Продолжить как гость');
            const hasLoginButton = await this.findExactText(page, 'Войти в систему');
            const hasOnlineUsers = pageText.includes('Онлайн');
            
            if (hasGuestButton && hasLoginButton && !hasOnlineUsers) {
                confidence = Math.max(confidence, 0.95);
            }
        }
        
        if (stateKey === 'guest_mode') {
            const hasAddIcon = await page.$('[data-testid="AddIcon"]');
            const hasMenuIcon = await page.$('[data-testid="MenuIcon"]');
            const hasOnlineUsers = pageText.includes('Онлайн');
            const hasGuestButton = await this.findExactText(page, 'Продолжить как гость');
            
            if (hasAddIcon && hasMenuIcon && hasOnlineUsers && !hasGuestButton) {
                confidence = Math.max(confidence, 0.9);
            }
        }
        
        if (stateKey === 'create_post') {
            const hasCreateForm = pageText.includes('Что нового?');
            if (hasCreateForm) {
                confidence = Math.max(confidence, 0.95);
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

    async checkIndicator(page, indicator, pageText) {
        // Проверяем data-testid
        if (indicator.includes('Icon') || indicator.includes('testid')) {
            const testId = indicator.replace('Icon', '').toLowerCase();
            const element = await page.$(`[data-testid*="${testId}"]`);
            if (element) {
                return true;
            }
        }
        
        // Проверяем точный текст
        if (await this.findExactText(page, indicator)) {
            return true;
        }
        
        // Проверяем в общем тексте страницы
        if (pageText.includes(indicator)) {
            return true;
        }
        
        return false;
    }

    async findExactText(page, searchText) {
        try {
            const found = await page.evaluate((text) => {
                const elements = document.querySelectorAll('button, a, span, div, p, h1, h2, h3, h4, h5, h6');
                for (const element of elements) {
                    if (element.textContent && element.textContent.trim() === text) {
                        return true;
                    }
                }
                return false;
            }, searchText);
            
            return found;
        } catch (error) {
            return false;
        }
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

    async getPageInfo(page) {
        try {
            const info = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean),
                    links: Array.from(document.querySelectorAll('a')).map(link => link.textContent?.trim()).filter(Boolean),
                    testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
                    pageText: document.body.innerText.substring(0, 500)
                };
            });
            
            return info;
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = ImprovedStateAnalyzer; 