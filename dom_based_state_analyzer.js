const puppeteer = require('puppeteer');

class DOMBasedStateAnalyzer {
    constructor() {
        // Карта состояний на основе реальной структуры фронтенда
        this.stateMap = {
            'initial': {
                name: 'Начальная страница',
                description: 'Главная страница с кнопками входа',
                domSelectors: [
                    'button',
                    '.login-form',
                    '[data-testid="guest-button"]',
                    '[data-testid="login-button"]'
                ],
                textIndicators: ['гость', 'войти', 'регистрация'],
                components: ['AppBar', 'LoginForm'],
                routes: ['/']
            },
            'guest_logged_in': {
                name: 'Гостевой пользователь вошел',
                description: 'Пользователь вошел как гость, видна лента постов',
                domSelectors: [
                    '.feed-container',
                    '.post-card',
                    'button',
                    '[data-testid="feed"]',
                    '[data-testid="create-post"]'
                ],
                textIndicators: ['пост', 'лента', 'создать', 'профиль'],
                components: ['Feed', 'PostCard', 'SidebarLeft', 'SidebarRight'],
                routes: ['/feed', '/']
            },
            'post_creation': {
                name: 'Создание поста',
                description: 'Открыта форма создания нового поста',
                domSelectors: [
                    '.post-form',
                    'textarea[placeholder*="пост"]',
                    'button:contains("Отправить")',
                    '[data-testid="post-form"]'
                ],
                components: ['PostForm', 'TextArea'],
                routes: ['/create-post', '/post/new']
            },
            'chat_open': {
                name: 'Чат открыт',
                description: 'Открыто окно чата с пользователями',
                domSelectors: [
                    '.chat-container',
                    '.message-list',
                    '.chat-input',
                    '[data-testid="chat"]'
                ],
                components: ['Chat', 'ChatDialog', 'MessageList'],
                routes: ['/chat', '/messages']
            },
            'profile_view': {
                name: 'Просмотр профиля',
                description: 'Открыт профиль пользователя',
                domSelectors: [
                    '.profile-container',
                    '.user-info',
                    'button:contains("Редактировать")',
                    '[data-testid="profile"]'
                ],
                components: ['Profile', 'UserSettings'],
                routes: ['/profile', '/user']
            },
            'search_results': {
                name: 'Результаты поиска',
                description: 'Отображены результаты поиска',
                domSelectors: [
                    '.search-results',
                    '.search-input',
                    '.result-item',
                    '[data-testid="search"]'
                ],
                components: ['Search', 'SearchResults'],
                routes: ['/search']
            }
        };
    }

    async analyzeStateFromDOM(page) {
        console.log('🔍 Анализ состояния через DOM...');
        
        try {
            // Получаем текущий URL
            const currentUrl = await page.url();
            
            // Получаем DOM-структуру
            const domAnalysis = await this.analyzeDOMStructure(page);
            
            // Анализируем компоненты React
            const reactAnalysis = await this.analyzeReactComponents(page);
            
                    // Определяем состояние на основе комбинации факторов
        const state = await this.determineState(currentUrl, domAnalysis, reactAnalysis, page);
            
            return {
                timestamp: new Date().toISOString(),
                detectedState: state,
                confidence: state.confidence,
                url: currentUrl,
                domAnalysis: domAnalysis,
                reactAnalysis: reactAnalysis,
                availableActions: state.availableActions
            };
            
        } catch (error) {
            console.error('❌ Ошибка DOM-анализа:', error.message);
            return {
                timestamp: new Date().toISOString(),
                detectedState: { name: 'Ошибка анализа', confidence: 0 },
                error: error.message
            };
        }
    }

    async analyzeDOMStructure(page) {
        const analysis = {
            elements: {},
            structure: {},
            interactive: []
        };

        // Анализируем основные элементы интерфейса
        const selectors = [
            'button', 'input', 'textarea', 'select',
            '.feed-container', '.chat-container', '.profile-container',
            '.post-card', '.message-item', '.user-info',
            '[data-testid]', '[role]', '[aria-label]'
        ];

        for (const selector of selectors) {
            try {
                const elements = await page.$$(selector);
                analysis.elements[selector] = elements.length;
                
                // Анализируем интерактивные элементы
                if (['button', 'input', 'textarea'].includes(selector)) {
                    for (const element of elements) {
                        const text = await element.evaluate(el => el.textContent || el.placeholder || el.value || '');
                        const isVisible = await element.isVisible();
                        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
                        
                        if (isVisible && text.trim()) {
                            analysis.interactive.push({
                                type: tagName,
                                text: text.trim(),
                                selector: selector
                            });
                        }
                    }
                }
            } catch (error) {
                // Игнорируем ошибки для несуществующих селекторов
            }
        }

        // Анализируем структуру страницы
        analysis.structure = await this.analyzePageStructure(page);
        
        return analysis;
    }

    async analyzePageStructure(page) {
        const structure = {
            hasHeader: false,
            hasSidebar: false,
            hasMainContent: false,
            hasFooter: false,
            layout: 'unknown'
        };

        try {
            // Проверяем наличие основных блоков
            const header = await page.$('header, .header, .app-bar, .navbar');
            const sidebar = await page.$('.sidebar, .side-panel, .nav-panel');
            const main = await page.$('main, .main, .content, .feed-container');
            const footer = await page.$('footer, .footer');

            structure.hasHeader = !!header;
            structure.hasSidebar = !!sidebar;
            structure.hasMainContent = !!main;
            structure.hasFooter = !!footer;

            // Определяем тип layout
            if (structure.hasSidebar && structure.hasMainContent) {
                structure.layout = 'sidebar-main';
            } else if (structure.hasMainContent) {
                structure.layout = 'main-only';
            } else if (structure.hasHeader && !structure.hasMainContent) {
                structure.layout = 'header-only';
            }

        } catch (error) {
            console.log('⚠️ Ошибка анализа структуры:', error.message);
        }

        return structure;
    }

    async analyzeReactComponents(page) {
        const components = {
            detected: [],
            props: {},
            state: {}
        };

        try {
            // Пытаемся получить информацию о React компонентах
            const reactInfo = await page.evaluate(() => {
                const reactComponents = [];
                
                // Ищем React компоненты по data-атрибутам
                const elements = document.querySelectorAll('[data-testid], [data-component]');
                elements.forEach(el => {
                    const testId = el.getAttribute('data-testid');
                    const component = el.getAttribute('data-component');
                    if (testId || component) {
                        reactComponents.push({
                            testId: testId,
                            component: component,
                            tagName: el.tagName.toLowerCase(),
                            text: el.textContent?.trim() || '',
                            visible: el.offsetParent !== null
                        });
                    }
                });

                return reactComponents;
            });

            components.detected = reactInfo;

            // Анализируем состояние на основе компонентов
            for (const comp of reactInfo) {
                if (comp.visible) {
                    components.props[comp.testId || comp.component] = {
                        text: comp.text,
                        visible: comp.visible
                    };
                }
            }

        } catch (error) {
            console.log('⚠️ Ошибка анализа React компонентов:', error.message);
        }

        return components;
    }

    async determineState(url, domAnalysis, reactAnalysis, page) {
        let bestState = null;
        let bestScore = 0;
        let bestActions = [];

        for (const [stateKey, state] of Object.entries(this.stateMap)) {
            let score = 0;
            let matchedSelectors = [];
            let matchedComponents = [];

            // Проверяем URL
            if (state.routes.some(route => url.includes(route))) {
                score += 0.3;
            }

            // Проверяем DOM селекторы
            for (const selector of state.domSelectors) {
                try {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        score += 0.1;
                        matchedSelectors.push(selector);
                        
                        // Проверяем текст элементов
                        for (const element of elements) {
                            const text = await element.evaluate(el => el.textContent || el.placeholder || el.value || '');
                            const textLower = text.toLowerCase();
                            
                            // Проверяем текстовые индикаторы
                            if (state.textIndicators) {
                                for (const indicator of state.textIndicators) {
                                    if (textLower.includes(indicator.toLowerCase())) {
                                        score += 0.2;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    // Селектор не найден
                }
            }

            // Проверяем React компоненты
            for (const component of state.components) {
                const found = reactAnalysis.detected.find(comp => 
                    comp.component === component || comp.testId === component
                );
                if (found) {
                    score += 0.2;
                    matchedComponents.push(component);
                }
            }

            // Проверяем интерактивные элементы
            const interactiveMatches = domAnalysis.interactive.filter(item => 
                state.domSelectors.some(selector => 
                    item.text.toLowerCase().includes(selector.toLowerCase().replace(/[^a-zа-я]/g, ''))
                )
            );
            if (interactiveMatches.length > 0) {
                score += 0.1 * interactiveMatches.length;
            }

            // Определяем доступные действия
            const availableActions = this.determineAvailableActions(stateKey, domAnalysis, reactAnalysis);

            if (score > bestScore) {
                bestScore = score;
                bestState = {
                    ...state,
                    confidence: Math.min(score, 1.0),
                    matchedSelectors: matchedSelectors,
                    matchedComponents: matchedComponents
                };
                bestActions = availableActions;
            }
        }

        return {
            ...bestState,
            confidence: bestScore,
            availableActions: bestActions
        };
    }

    determineAvailableActions(stateKey, domAnalysis, reactAnalysis) {
        const actions = [];

        // Базовые действия для каждого состояния
        const stateActions = {
            'initial': ['click_guest', 'click_login', 'click_register'],
            'guest_logged_in': ['create_post', 'view_profile', 'open_chat', 'search'],
            'post_creation': ['write_text', 'send_post', 'cancel_post'],
            'chat_open': ['send_message', 'select_user', 'close_chat'],
            'profile_view': ['edit_profile', 'view_settings', 'back_to_feed'],
            'search_results': ['select_result', 'refine_search', 'clear_search']
        };

        actions.push(...(stateActions[stateKey] || []));

        // Дополнительные действия на основе найденных элементов
        for (const item of domAnalysis.interactive) {
            const text = item.text.toLowerCase();
            
            if (text.includes('создать') || text.includes('написать')) {
                actions.push('create_post');
            }
            if (text.includes('профиль') || text.includes('настройки')) {
                actions.push('view_profile');
            }
            if (text.includes('чат') || text.includes('сообщения')) {
                actions.push('open_chat');
            }
            if (text.includes('поиск') || text.includes('найти')) {
                actions.push('search');
            }
        }

        return [...new Set(actions)]; // Убираем дубликаты
    }

    async findElementByState(page, elementType, state) {
        console.log(`🔍 Поиск элемента ${elementType} в состоянии ${state.name}`);
        
        // Сначала ищем через DOM селекторы
        const domElement = await this.findElementInDOM(page, elementType, state);
        if (domElement) {
            return domElement;
        }

        // Затем ищем через React компоненты
        const reactElement = await this.findElementInReact(page, elementType, state);
        if (reactElement) {
            return reactElement;
        }

        return null;
    }

    async findElementInDOM(page, elementType, state) {
        const selectors = [
            `button:contains("${elementType}")`,
            `[data-testid*="${elementType}"]`,
            `[aria-label*="${elementType}"]`,
            `.${elementType}-button`,
            `#${elementType}-btn`
        ];

        for (const selector of selectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        const text = await element.evaluate(el => el.textContent || '');
                        const box = await element.boundingBox();
                        
                        return {
                            element: element,
                            text: text.trim(),
                            x: box.x + box.width / 2,
                            y: box.y + box.height / 2,
                            method: 'dom',
                            confidence: 0.9
                        };
                    }
                }
            } catch (error) {
                // Селектор не найден
            }
        }

        return null;
    }

    async findElementInReact(page, elementType, state) {
        try {
            const reactElements = await page.evaluate((type) => {
                const elements = document.querySelectorAll('[data-testid], [data-component]');
                const matches = [];
                
                elements.forEach(el => {
                    const testId = el.getAttribute('data-testid');
                    const component = el.getAttribute('data-component');
                    const text = el.textContent?.trim() || '';
                    
                    if ((testId && testId.toLowerCase().includes(type.toLowerCase())) ||
                        (component && component.toLowerCase().includes(type.toLowerCase())) ||
                        (text && text.toLowerCase().includes(type.toLowerCase()))) {
                        
                        if (el.offsetParent !== null) { // Элемент видимый
                            matches.push({
                                testId: testId,
                                component: component,
                                text: text,
                                tagName: el.tagName.toLowerCase(),
                                rect: el.getBoundingClientRect()
                            });
                        }
                    }
                });
                
                return matches;
            }, elementType);

            if (reactElements.length > 0) {
                const bestMatch = reactElements[0];
                return {
                    element: null, // Нужно будет найти элемент заново
                    text: bestMatch.text,
                    x: bestMatch.rect.x + bestMatch.rect.width / 2,
                    y: bestMatch.rect.y + bestMatch.rect.height / 2,
                    method: 'react',
                    confidence: 0.8,
                    testId: bestMatch.testId,
                    component: bestMatch.component
                };
            }
        } catch (error) {
            console.log('⚠️ Ошибка поиска React элемента:', error.message);
        }

        return null;
    }
}

module.exports = { DOMBasedStateAnalyzer }; 