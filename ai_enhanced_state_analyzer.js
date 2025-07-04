const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');

class AIEnhancedStateAnalyzer {
    constructor() {
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.states = {
            'initial': {
                name: 'Начальная страница',
                description: 'Главная страница приложения с кнопками входа',
                indicators: ['гость', 'войти', 'регистрация', 'добро пожаловать'],
                actions: ['click_guest', 'click_login', 'click_register']
            },
            'guest_logged_in': {
                name: 'Гостевой пользователь вошел',
                description: 'Пользователь вошел как гость, видна лента постов',
                indicators: ['пост', 'лента', 'создать', 'профиль'],
                actions: ['create_post', 'view_profile', 'open_chat', 'search']
            },
            'post_creation': {
                name: 'Создание поста',
                description: 'Открыта форма создания нового поста',
                indicators: ['создать пост', 'написать', 'отправить', 'отмена'],
                actions: ['write_text', 'send_post', 'cancel_post']
            },
            'chat_open': {
                name: 'Чат открыт',
                description: 'Открыто окно чата с пользователями',
                indicators: ['чат', 'сообщения', 'онлайн', 'пользователи'],
                actions: ['send_message', 'select_user', 'close_chat']
            },
            'profile_view': {
                name: 'Просмотр профиля',
                description: 'Открыт профиль пользователя',
                indicators: ['профиль', 'редактировать', 'настройки', 'статистика'],
                actions: ['edit_profile', 'view_settings', 'back_to_feed']
            },
            'search_results': {
                name: 'Результаты поиска',
                description: 'Отображены результаты поиска',
                indicators: ['поиск', 'результаты', 'найдено', 'фильтры'],
                actions: ['select_result', 'refine_search', 'clear_search']
            },
            'error_page': {
                name: 'Страница ошибки',
                description: 'Отображена ошибка или проблема',
                indicators: ['ошибка', 'не найдено', 'проблема', 'попробуйте снова'],
                actions: ['retry', 'go_back', 'refresh_page']
            },
            'loading': {
                name: 'Загрузка',
                description: 'Страница в процессе загрузки',
                indicators: ['загрузка', 'подождите', 'loading', 'spinner'],
                actions: ['wait', 'refresh']
            }
        };
        
        this.stateHistory = [];
        this.confidenceThreshold = 0.7;
        
        // Конфигурация ИИ сервисов
        this.aiConfig = {
            openai: {
                enabled: false, // Требует API ключ
                apiKey: process.env.OPENAI_API_KEY,
                model: 'gpt-4-vision-preview'
            },
            googleVision: {
                enabled: false, // Требует API ключ
                apiKey: process.env.GOOGLE_VISION_API_KEY
            },
            localAI: {
                enabled: true, // Локальный анализ
                useAdvancedHeuristics: true,
                useLayoutAnalysis: true,
                useSemanticAnalysis: true
            }
        };
    }

    async analyzeScreenshotWithAI(imagePath) {
        console.log(`🧠 ИИ анализ состояния приложения: ${path.basename(imagePath)}`);
        
        try {
            // Базовый OCR анализ
            const allText = await this.extractAllText(imagePath);
            const elements = await this.extractElements(imagePath);
            
            // ИИ анализ
            const aiAnalysis = await this.performAIAnalysis(imagePath, allText, elements);
            
            // Комбинированный анализ
            const combinedAnalysis = await this.combineAnalyses(aiAnalysis, allText, elements);
            
            // Создаем полный анализ состояния
            const fullAnalysis = {
                timestamp: new Date().toISOString(),
                imagePath: imagePath,
                detectedState: combinedAnalysis.state,
                confidence: combinedAnalysis.confidence,
                allText: allText,
                elements: elements,
                aiAnalysis: aiAnalysis,
                availableActions: combinedAnalysis.availableActions,
                context: this.buildAIContext(combinedAnalysis, elements, aiAnalysis),
                layoutAnalysis: await this.analyzeLayout(elements),
                semanticAnalysis: await this.analyzeSemantics(allText, elements)
            };
            
            // Сохраняем в историю
            this.stateHistory.push(fullAnalysis);
            
            console.log(`✅ ИИ состояние определено: ${combinedAnalysis.state.name} (уверенность: ${(combinedAnalysis.confidence * 100).toFixed(1)}%)`);
            
            return fullAnalysis;
            
        } catch (error) {
            console.error('❌ Ошибка ИИ анализа состояния:', error.message);
            return {
                timestamp: new Date().toISOString(),
                imagePath: imagePath,
                detectedState: this.states.error_page,
                confidence: 0,
                error: error.message
            };
        }
    }

    async performAIAnalysis(imagePath, text, elements) {
        const analysis = {
            layout: await this.analyzeLayoutWithAI(elements),
            semantics: await this.analyzeSemanticsWithAI(text, elements),
            context: await this.analyzeContextWithAI(text, elements),
            recommendations: []
        };

        // Локальный ИИ анализ
        if (this.aiConfig.localAI.enabled) {
            analysis.layout = await this.analyzeLayout(elements);
            analysis.semantics = await this.analyzeSemantics(text, elements);
            analysis.context = await this.analyzeContext(text, elements);
            analysis.recommendations = await this.generateRecommendations(analysis);
        }

        // OpenAI анализ (если доступен)
        if (this.aiConfig.openai.enabled && this.aiConfig.openai.apiKey) {
            try {
                const openaiAnalysis = await this.analyzeWithOpenAI(imagePath, text);
                analysis.openai = openaiAnalysis;
            } catch (error) {
                console.log('⚠️ OpenAI анализ недоступен:', error.message);
            }
        }

        // Google Vision анализ (если доступен)
        if (this.aiConfig.googleVision.enabled && this.aiConfig.googleVision.apiKey) {
            try {
                const visionAnalysis = await this.analyzeWithGoogleVision(imagePath);
                analysis.vision = visionAnalysis;
            } catch (error) {
                console.log('⚠️ Google Vision анализ недоступен:', error.message);
            }
        }

        return analysis;
    }

    async analyzeLayoutWithAI(elements) {
        console.log('🏗️ Анализ layout с ИИ...');
        
        const layout = {
            header: this.findHeaderElements(elements),
            sidebar: this.findSidebarElements(elements),
            main: this.findMainContentElements(elements),
            footer: this.findFooterElements(elements),
            navigation: this.findNavigationElements(elements),
            interactive: this.findInteractiveElements(elements)
        };

        // Анализ структуры страницы
        layout.structure = this.analyzePageStructure(elements);
        layout.components = this.identifyComponents(elements);
        layout.flow = this.analyzeUserFlow(elements);

        return layout;
    }

    async analyzeSemanticsWithAI(text, elements) {
        console.log('📝 Семантический анализ с ИИ...');
        
        const semantics = {
            topics: this.extractTopics(text),
            actions: this.extractActions(text, elements),
            entities: this.extractEntities(text),
            sentiment: this.analyzeSentiment(text),
            intent: this.detectUserIntent(text, elements)
        };

        return semantics;
    }

    async analyzeContextWithAI(text, elements) {
        console.log('🎯 Контекстный анализ с ИИ...');
        
        const context = {
            userRole: this.detectUserRole(text, elements),
            currentTask: this.detectCurrentTask(text, elements),
            availableOptions: this.detectAvailableOptions(elements),
            systemState: this.detectSystemState(text, elements),
            nextSteps: this.suggestNextSteps(text, elements)
        };

        return context;
    }

    // Анализ layout
    findHeaderElements(elements) {
        return elements.filter(el => 
            el.y < 100 && (el.text.toLowerCase().includes('лого') || 
                          el.text.toLowerCase().includes('меню') ||
                          el.text.toLowerCase().includes('навигация'))
        );
    }

    findSidebarElements(elements) {
        return elements.filter(el => 
            el.x < 200 && (el.text.toLowerCase().includes('профиль') ||
                          el.text.toLowerCase().includes('чат') ||
                          el.text.toLowerCase().includes('настройки'))
        );
    }

    findMainContentElements(elements) {
        return elements.filter(el => 
            el.x > 200 && el.x < 800 && (el.text.toLowerCase().includes('пост') ||
                                        el.text.toLowerCase().includes('лента') ||
                                        el.text.toLowerCase().includes('создать'))
        );
    }

    findFooterElements(elements) {
        return elements.filter(el => 
            el.y > 600 && (el.text.toLowerCase().includes('подвал') ||
                          el.text.toLowerCase().includes('контакты') ||
                          el.text.toLowerCase().includes('права'))
        );
    }

    findNavigationElements(elements) {
        return elements.filter(el => 
            el.text.toLowerCase().includes('навигация') ||
            el.text.toLowerCase().includes('меню') ||
            el.text.toLowerCase().includes('поиск')
        );
    }

    findInteractiveElements(elements) {
        return elements.filter(el => 
            el.text.toLowerCase().includes('кнопка') ||
            el.text.toLowerCase().includes('нажать') ||
            el.text.toLowerCase().includes('клик') ||
            el.area > 1000 // Большие элементы обычно интерактивные
        );
    }

    analyzePageStructure(elements) {
        const structure = {
            hasHeader: this.findHeaderElements(elements).length > 0,
            hasSidebar: this.findSidebarElements(elements).length > 0,
            hasMainContent: this.findMainContentElements(elements).length > 0,
            hasFooter: this.findFooterElements(elements).length > 0,
            hasNavigation: this.findNavigationElements(elements).length > 0,
            interactiveElementsCount: this.findInteractiveElements(elements).length
        };

        return structure;
    }

    identifyComponents(elements) {
        const components = [];
        
        // Определяем компоненты на основе текста и позиции
        const componentPatterns = [
            { name: 'LoginForm', indicators: ['войти', 'логин', 'пароль'], area: 'header' },
            { name: 'PostFeed', indicators: ['пост', 'лента', 'новости'], area: 'main' },
            { name: 'ChatPanel', indicators: ['чат', 'сообщения'], area: 'sidebar' },
            { name: 'ProfileSection', indicators: ['профиль', 'пользователь'], area: 'sidebar' },
            { name: 'SearchBar', indicators: ['поиск', 'найти'], area: 'header' },
            { name: 'CreatePostForm', indicators: ['создать', 'написать', 'отправить'], area: 'main' }
        ];

        for (const pattern of componentPatterns) {
            const matchingElements = elements.filter(el => 
                pattern.indicators.some(indicator => 
                    el.text.toLowerCase().includes(indicator)
                )
            );

            if (matchingElements.length > 0) {
                components.push({
                    name: pattern.name,
                    elements: matchingElements,
                    confidence: matchingElements.length / pattern.indicators.length
                });
            }
        }

        return components;
    }

    analyzeUserFlow(elements) {
        const flow = {
            currentStep: this.detectCurrentStepFromElements(elements),
            availableActions: this.detectAvailableActionsFromElements(elements),
            nextSteps: this.predictNextStepsFromElements(elements),
            completion: this.estimateCompletionFromElements(elements)
        };

        return flow;
    }

    detectCurrentStepFromElements(elements) {
        // Определяем текущий шаг на основе элементов
        if (elements.some(el => el.text.toLowerCase().includes('войти'))) {
            return 'login';
        }
        if (elements.some(el => el.text.toLowerCase().includes('создать'))) {
            return 'create_post';
        }
        if (elements.some(el => el.text.toLowerCase().includes('чат'))) {
            return 'chat';
        }
        return 'browsing';
    }

    detectAvailableActionsFromElements(elements) {
        const actions = [];
        
        if (elements.some(el => el.text.toLowerCase().includes('создать'))) {
            actions.push('create_post');
        }
        if (elements.some(el => el.text.toLowerCase().includes('профиль'))) {
            actions.push('view_profile');
        }
        if (elements.some(el => el.text.toLowerCase().includes('чат'))) {
            actions.push('open_chat');
        }
        if (elements.some(el => el.text.toLowerCase().includes('поиск'))) {
            actions.push('search');
        }
        
        return actions;
    }

    predictNextStepsFromElements(elements) {
        const steps = [];
        
        if (elements.some(el => el.text.toLowerCase().includes('войти'))) {
            steps.push('Заполнить форму входа', 'Нажать кнопку "Войти"');
        }
        if (elements.some(el => el.text.toLowerCase().includes('создать'))) {
            steps.push('Написать текст поста', 'Нажать "Отправить"');
        }
        
        return steps;
    }

    estimateCompletionFromElements(elements) {
        // Оцениваем завершенность текущей задачи
        if (elements.some(el => el.text.toLowerCase().includes('пост'))) {
            return 0.8; // Лента постов загружена
        }
        if (elements.some(el => el.text.toLowerCase().includes('войти'))) {
            return 0.3; // Начальная страница
        }
        return 0.5;
    }

    // Семантический анализ
    extractTopics(text) {
        const topics = [];
        const topicKeywords = {
            'authentication': ['войти', 'логин', 'регистрация', 'пароль'],
            'content': ['пост', 'лента', 'новости', 'создать'],
            'communication': ['чат', 'сообщения', 'пользователи'],
            'navigation': ['поиск', 'меню', 'навигация'],
            'profile': ['профиль', 'настройки', 'редактировать']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            const matches = keywords.filter(keyword => 
                text.toLowerCase().includes(keyword)
            );
            if (matches.length > 0) {
                topics.push({
                    name: topic,
                    keywords: matches,
                    relevance: matches.length / keywords.length
                });
            }
        }

        return topics;
    }

    extractActions(text, elements) {
        const actions = [];
        const actionPatterns = [
            { pattern: /(нажми|клик|нажать)/i, type: 'click' },
            { pattern: /(введите|ввод|написать)/i, type: 'input' },
            { pattern: /(выберите|выбор)/i, type: 'select' },
            { pattern: /(отправить|сохранить)/i, type: 'submit' }
        ];

        for (const actionPattern of actionPatterns) {
            if (actionPattern.pattern.test(text)) {
                actions.push({
                    type: actionPattern.type,
                    text: text.match(actionPattern.pattern)[0],
                    elements: elements.filter(el => 
                        el.text.toLowerCase().includes(actionPattern.type)
                    )
                });
            }
        }

        return actions;
    }

    extractEntities(text) {
        const entities = [];
        
        // Извлекаем имена пользователей, даты, числа и т.д.
        const entityPatterns = [
            { pattern: /@(\w+)/g, type: 'username' },
            { pattern: /\d{1,2}:\d{2}/g, type: 'time' },
            { pattern: /\d{1,2}\.\d{1,2}\.\d{4}/g, type: 'date' },
            { pattern: /(\d+)\s*(пост|сообщение|комментарий)/g, type: 'count' }
        ];

        for (const entityPattern of entityPatterns) {
            const matches = text.match(entityPattern.pattern);
            if (matches) {
                entities.push({
                    type: entityPattern.type,
                    values: matches
                });
            }
        }

        return entities;
    }

    analyzeSentiment(text) {
        const positiveWords = ['успешно', 'отлично', 'хорошо', 'работает'];
        const negativeWords = ['ошибка', 'проблема', 'не работает', 'неудача'];
        
        const positiveCount = positiveWords.filter(word => 
            text.toLowerCase().includes(word)
        ).length;
        const negativeCount = negativeWords.filter(word => 
            text.toLowerCase().includes(word)
        ).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    detectUserIntent(text, elements) {
        const intents = [];
        
        const intentPatterns = [
            { pattern: /войти|логин/i, intent: 'login' },
            { pattern: /создать|написать/i, intent: 'create_content' },
            { pattern: /поиск|найти/i, intent: 'search' },
            { pattern: /чат|сообщение/i, intent: 'communicate' },
            { pattern: /профиль|настройки/i, intent: 'manage_profile' }
        ];

        for (const intentPattern of intentPatterns) {
            if (intentPattern.pattern.test(text)) {
                intents.push(intentPattern.intent);
            }
        }

        return intents;
    }

    // Контекстный анализ
    detectUserRole(text, elements) {
        if (text.toLowerCase().includes('админ') || text.toLowerCase().includes('admin')) {
            return 'admin';
        }
        if (text.toLowerCase().includes('модератор')) {
            return 'moderator';
        }
        if (text.toLowerCase().includes('гость')) {
            return 'guest';
        }
        return 'user';
    }

    detectCurrentTask(text, elements) {
        const taskIndicators = {
            'login': ['войти', 'авторизация', 'логин'],
            'create_post': ['создать пост', 'написать', 'публикация'],
            'search': ['поиск', 'найти', 'фильтр'],
            'chat': ['чат', 'сообщение', 'общение'],
            'profile': ['профиль', 'настройки', 'редактировать']
        };

        for (const [task, indicators] of Object.entries(taskIndicators)) {
            if (indicators.some(indicator => text.toLowerCase().includes(indicator))) {
                return task;
            }
        }

        return 'browsing';
    }

    detectAvailableOptions(elements) {
        const options = [];
        
        for (const element of elements) {
            if (element.area > 500 && element.confidence > 70) {
                options.push({
                    text: element.text,
                    position: { x: element.centerX, y: element.centerY },
                    confidence: element.confidence
                });
            }
        }

        return options;
    }

    detectSystemState(text, elements) {
        if (text.toLowerCase().includes('загрузка') || text.toLowerCase().includes('loading')) {
            return 'loading';
        }
        if (text.toLowerCase().includes('ошибка') || text.toLowerCase().includes('error')) {
            return 'error';
        }
        if (text.toLowerCase().includes('успешно') || text.toLowerCase().includes('success')) {
            return 'success';
        }
        return 'normal';
    }

    suggestNextSteps(text, elements) {
        const steps = [];
        
        // Анализируем текущий контекст и предлагаем следующие шаги
        if (text.toLowerCase().includes('войти')) {
            steps.push('Заполнить форму входа', 'Нажать кнопку "Войти"');
        }
        if (text.toLowerCase().includes('создать')) {
            steps.push('Написать текст поста', 'Нажать "Отправить"');
        }
        if (text.toLowerCase().includes('чат')) {
            steps.push('Выбрать пользователя', 'Написать сообщение');
        }

        return steps;
    }

    // Комбинированный анализ
    async combineAnalyses(aiAnalysis, text, elements) {
        // Базовый анализ состояния
        const basicState = await this.analyzeStateFromText(text);
        
        // Улучшаем анализ с помощью ИИ
        let enhancedState = { ...basicState };
        
        // Учитываем layout анализ
        if (aiAnalysis.layout) {
            const layoutState = this.analyzeStateFromLayout(aiAnalysis.layout);
            if (layoutState.confidence > basicState.confidence) {
                enhancedState = layoutState;
            }
        }
        
        // Учитываем семантический анализ
        if (aiAnalysis.semantics) {
            const semanticState = this.analyzeStateFromSemantics(aiAnalysis.semantics);
            if (semanticState.confidence > enhancedState.confidence) {
                enhancedState = semanticState;
            }
        }
        
        // Учитываем контекстный анализ
        if (aiAnalysis.context) {
            const contextState = this.analyzeStateFromContext(aiAnalysis.context);
            if (contextState.confidence > enhancedState.confidence) {
                enhancedState = contextState;
            }
        }
        
        return enhancedState;
    }

    analyzeStateFromLayout(layout) {
        // Анализируем состояние на основе layout
        if (layout.components.some(c => c.name === 'LoginForm')) {
            return {
                state: this.states.initial,
                confidence: 0.9,
                availableActions: ['click_guest', 'click_login', 'click_register']
            };
        }
        
        if (layout.components.some(c => c.name === 'PostFeed')) {
            return {
                state: this.states.guest_logged_in,
                confidence: 0.8,
                availableActions: ['create_post', 'view_profile', 'open_chat', 'search']
            };
        }
        
        if (layout.components.some(c => c.name === 'CreatePostForm')) {
            return {
                state: this.states.post_creation,
                confidence: 0.9,
                availableActions: ['write_text', 'send_post', 'cancel_post']
            };
        }
        
        return {
            state: this.states.initial,
            confidence: 0.5,
            availableActions: []
        };
    }

    analyzeStateFromSemantics(semantics) {
        // Анализируем состояние на основе семантики
        if (semantics.topics.some(t => t.name === 'authentication')) {
            return {
                state: this.states.initial,
                confidence: 0.8,
                availableActions: ['click_guest', 'click_login', 'click_register']
            };
        }
        
        if (semantics.topics.some(t => t.name === 'content')) {
            return {
                state: this.states.guest_logged_in,
                confidence: 0.7,
                availableActions: ['create_post', 'view_profile', 'open_chat', 'search']
            };
        }
        
        return {
            state: this.states.initial,
            confidence: 0.5,
            availableActions: []
        };
    }

    analyzeStateFromContext(context) {
        // Анализируем состояние на основе контекста
        if (context.currentTask === 'login') {
            return {
                state: this.states.initial,
                confidence: 0.9,
                availableActions: ['click_guest', 'click_login', 'click_register']
            };
        }
        
        if (context.currentTask === 'create_post') {
            return {
                state: this.states.post_creation,
                confidence: 0.9,
                availableActions: ['write_text', 'send_post', 'cancel_post']
            };
        }
        
        return {
            state: this.states.initial,
            confidence: 0.5,
            availableActions: []
        };
    }

    // Вспомогательные методы
    async extractAllText(imagePath) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                const outputFile = 'output.txt';
                if (!fs.existsSync(outputFile)) {
                    reject(new Error('Output file not found'));
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                resolve(content.trim());
            });
        });
    }

    async extractElements(imagePath) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                const outputFile = 'output.tsv';
                if (!fs.existsSync(outputFile)) {
                    reject(new Error('Output file not found'));
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                const lines = content.trim().split('\n');
                
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = lines[0].split('\t');
                const elements = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t');
                    if (values.length >= headers.length) {
                        const text = values[headers.indexOf('text')];
                        const conf = parseFloat(values[headers.indexOf('conf')]);
                        const left = parseInt(values[headers.indexOf('left')]);
                        const top = parseInt(values[headers.indexOf('top')]);
                        const width = parseInt(values[headers.indexOf('width')]);
                        const height = parseInt(values[headers.indexOf('height')]);

                        if (text && text.trim() && conf > 30) {
                            elements.push({
                                text: text.trim(),
                                confidence: conf,
                                x: left,
                                y: top,
                                width: width,
                                height: height,
                                centerX: left + width / 2,
                                centerY: top + height / 2,
                                area: width * height
                            });
                        }
                    }
                }

                resolve(elements);
            });
        });
    }

    async analyzeStateFromText(text) {
        const textLower = text.toLowerCase();
        let bestState = null;
        let bestScore = 0;
        let bestActions = [];

        for (const [stateKey, state] of Object.entries(this.states)) {
            let score = 0;
            let matchedIndicators = [];

            for (const indicator of state.indicators) {
                if (textLower.includes(indicator.toLowerCase())) {
                    score += 1;
                    matchedIndicators.push(indicator);
                }
            }

            const normalizedScore = score / state.indicators.length;

            if (normalizedScore > bestScore) {
                bestScore = normalizedScore;
                bestState = state;
                bestActions = state.actions;
            }
        }

        return {
            state: bestState || this.states.initial,
            confidence: bestScore,
            availableActions: bestActions
        };
    }

    buildAIContext(analysis, elements, aiAnalysis) {
        return {
            stateName: analysis.state.name,
            stateDescription: analysis.state.description,
            confidence: analysis.confidence,
            availableActions: analysis.availableActions,
            elementCount: elements.length,
            prominentElements: this.findProminentElements(elements),
            layoutAnalysis: aiAnalysis.layout,
            semanticAnalysis: aiAnalysis.semantics,
            contextAnalysis: aiAnalysis.context,
            suggestedNextActions: this.suggestNextActions(analysis, elements, aiAnalysis)
        };
    }

    findProminentElements(elements) {
        return elements
            .filter(el => el.confidence > 70 || el.area > 1000)
            .sort((a, b) => (b.confidence + b.area / 1000) - (a.confidence + a.area / 1000))
            .slice(0, 5)
            .map(el => ({
                text: el.text,
                confidence: el.confidence,
                position: { x: el.centerX, y: el.centerY }
            }));
    }

    suggestNextActions(analysis, elements, aiAnalysis) {
        const suggestions = [];
        
        // Базовые действия в зависимости от состояния
        switch (analysis.state.name) {
            case 'Начальная страница':
                suggestions.push('Войти как гость', 'Войти через аккаунт', 'Зарегистрироваться');
                break;
            case 'Гостевой пользователь вошел':
                suggestions.push('Создать пост', 'Открыть чат', 'Просмотреть профиль', 'Поиск');
                break;
            case 'Создание поста':
                suggestions.push('Написать текст поста', 'Отправить пост', 'Отменить создание');
                break;
            case 'Чат открыт':
                suggestions.push('Выбрать пользователя', 'Отправить сообщение', 'Закрыть чат');
                break;
        }
        
        // Дополнительные действия на основе ИИ анализа
        if (aiAnalysis.context && aiAnalysis.context.nextSteps) {
            suggestions.push(...aiAnalysis.context.nextSteps);
        }
        
        return suggestions;
    }

    async generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.layout && analysis.layout.structure) {
            if (!analysis.layout.structure.hasHeader) {
                recommendations.push('Добавить заголовок страницы для лучшей навигации');
            }
            if (analysis.layout.structure.interactiveElementsCount < 3) {
                recommendations.push('Увеличить количество интерактивных элементов');
            }
        }
        
        if (analysis.semantics && analysis.semantics.sentiment === 'negative') {
            recommendations.push('Проверить наличие ошибок или проблем в интерфейсе');
        }
        
        return recommendations;
    }

    async saveAIAnalysis(analysis, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `ai_analysis_${timestamp}.json`;
        const filepath = filename || `./test_logs/${defaultFilename}`;
        
        if (!fs.existsSync('./test_logs')) {
            fs.mkdirSync('./test_logs', { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
        console.log(`💾 ИИ анализ сохранен: ${filepath}`);
        
        return filepath;
    }
}

module.exports = { AIEnhancedStateAnalyzer }; 