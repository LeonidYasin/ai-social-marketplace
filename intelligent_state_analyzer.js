const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class IntelligentStateAnalyzer {
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
    }

    async analyzeScreenshot(imagePath) {
        console.log(`🔍 Анализ состояния приложения: ${path.basename(imagePath)}`);
        
        try {
            // Получаем весь текст со скриншота
            const allText = await this.extractAllText(imagePath);
            
            // Анализируем состояние на основе текста
            const stateAnalysis = await this.analyzeStateFromText(allText);
            
            // Получаем детальную информацию об элементах
            const elements = await this.extractElements(imagePath);
            
            // Создаем полный анализ состояния
            const fullAnalysis = {
                timestamp: new Date().toISOString(),
                imagePath: imagePath,
                detectedState: stateAnalysis.state,
                confidence: stateAnalysis.confidence,
                allText: allText,
                elements: elements,
                availableActions: stateAnalysis.availableActions,
                context: this.buildContext(stateAnalysis, elements)
            };
            
            // Сохраняем в историю
            this.stateHistory.push(fullAnalysis);
            
            console.log(`✅ Состояние определено: ${stateAnalysis.state.name} (уверенность: ${(stateAnalysis.confidence * 100).toFixed(1)}%)`);
            
            return fullAnalysis;
            
        } catch (error) {
            console.error('❌ Ошибка анализа состояния:', error.message);
            return {
                timestamp: new Date().toISOString(),
                imagePath: imagePath,
                detectedState: this.states.error_page,
                confidence: 0,
                error: error.message
            };
        }
    }

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

        // Анализируем каждое состояние
        for (const [stateKey, state] of Object.entries(this.states)) {
            let score = 0;
            let matchedIndicators = [];
            let availableActions = [];

            // Проверяем индикаторы состояния
            for (const indicator of state.indicators) {
                if (textLower.includes(indicator.toLowerCase())) {
                    score += 1;
                    matchedIndicators.push(indicator);
                }
            }

            // Нормализуем оценку
            const normalizedScore = score / state.indicators.length;

            // Если это лучшее состояние, обновляем
            if (normalizedScore > bestScore) {
                bestScore = normalizedScore;
                bestState = state;
                bestActions = state.actions;
            }
        }

        // Если не найдено подходящее состояние, используем эвристики
        if (bestScore < this.confidenceThreshold) {
            const heuristicState = this.applyHeuristics(textLower);
            if (heuristicState) {
                bestState = heuristicState.state;
                bestScore = heuristicState.confidence;
                bestActions = heuristicState.actions;
            }
        }

        return {
            state: bestState || this.states.initial,
            confidence: bestScore,
            availableActions: bestActions
        };
    }

    applyHeuristics(textLower) {
        // Эвристики для определения состояния
        const heuristics = [
            {
                condition: () => textLower.includes('пост') && textLower.includes('создать'),
                state: this.states.post_creation,
                confidence: 0.8,
                actions: ['write_text', 'send_post', 'cancel_post']
            },
            {
                condition: () => textLower.includes('чат') && textLower.includes('сообщение'),
                state: this.states.chat_open,
                confidence: 0.8,
                actions: ['send_message', 'select_user', 'close_chat']
            },
            {
                condition: () => textLower.includes('профиль') && textLower.includes('редактировать'),
                state: this.states.profile_view,
                confidence: 0.8,
                actions: ['edit_profile', 'view_settings', 'back_to_feed']
            },
            {
                condition: () => textLower.includes('поиск') && textLower.includes('результат'),
                state: this.states.search_results,
                confidence: 0.8,
                actions: ['select_result', 'refine_search', 'clear_search']
            },
            {
                condition: () => textLower.includes('ошибка') || textLower.includes('не найдено'),
                state: this.states.error_page,
                confidence: 0.9,
                actions: ['retry', 'go_back', 'refresh_page']
            },
            {
                condition: () => textLower.includes('загрузка') || textLower.includes('подождите'),
                state: this.states.loading,
                confidence: 0.9,
                actions: ['wait', 'refresh']
            }
        ];

        for (const heuristic of heuristics) {
            if (heuristic.condition()) {
                return heuristic;
            }
        }

        return null;
    }

    buildContext(stateAnalysis, elements) {
        const context = {
            stateName: stateAnalysis.state.name,
            stateDescription: stateAnalysis.state.description,
            confidence: stateAnalysis.confidence,
            availableActions: stateAnalysis.availableActions,
            elementCount: elements.length,
            prominentElements: this.findProminentElements(elements),
            suggestedNextActions: this.suggestNextActions(stateAnalysis, elements)
        };

        return context;
    }

    findProminentElements(elements) {
        // Находим наиболее заметные элементы (большие по размеру или с высоким доверием)
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

    suggestNextActions(stateAnalysis, elements) {
        const suggestions = [];
        
        // Базовые действия в зависимости от состояния
        switch (stateAnalysis.state.name) {
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

        // Дополнительные действия на основе найденных элементов
        const clickableElements = elements.filter(el => 
            el.text.toLowerCase().includes('кнопка') || 
            el.text.toLowerCase().includes('нажать') ||
            el.area > 500
        );

        if (clickableElements.length > 0) {
            suggestions.push(`Кликнуть по "${clickableElements[0].text}"`);
        }

        return suggestions;
    }

    async getStateHistory() {
        return this.stateHistory;
    }

    async getCurrentState() {
        if (this.stateHistory.length === 0) {
            return null;
        }
        return this.stateHistory[this.stateHistory.length - 1];
    }

    async saveStateAnalysis(analysis, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `state_analysis_${timestamp}.json`;
        const filepath = filename || `./test_logs/${defaultFilename}`;
        
        if (!fs.existsSync('./test_logs')) {
            fs.mkdirSync('./test_logs', { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
        console.log(`💾 Анализ состояния сохранен: ${filepath}`);
        
        return filepath;
    }

    async generateStateReport() {
        if (this.stateHistory.length === 0) {
            return { message: 'Нет данных для анализа' };
        }

        const report = {
            timestamp: new Date().toISOString(),
            totalAnalyses: this.stateHistory.length,
            states: {},
            transitions: [],
            recommendations: []
        };

        // Анализируем состояния
        for (const analysis of this.stateHistory) {
            const stateName = analysis.detectedState.name;
            if (!report.states[stateName]) {
                report.states[stateName] = {
                    count: 0,
                    averageConfidence: 0,
                    totalConfidence: 0
                };
            }
            
            report.states[stateName].count++;
            report.states[stateName].totalConfidence += analysis.confidence;
        }

        // Вычисляем среднюю уверенность
        for (const stateName in report.states) {
            const state = report.states[stateName];
            state.averageConfidence = state.totalConfidence / state.count;
        }

        // Анализируем переходы между состояниями
        for (let i = 1; i < this.stateHistory.length; i++) {
            const prevState = this.stateHistory[i - 1].detectedState.name;
            const currentState = this.stateHistory[i].detectedState.name;
            
            if (prevState !== currentState) {
                report.transitions.push({
                    from: prevState,
                    to: currentState,
                    timestamp: this.stateHistory[i].timestamp
                });
            }
        }

        // Генерируем рекомендации
        const lowConfidenceStates = Object.entries(report.states)
            .filter(([name, data]) => data.averageConfidence < 0.6);
        
        if (lowConfidenceStates.length > 0) {
            report.recommendations.push(
                `Улучшить распознавание состояний: ${lowConfidenceStates.map(([name]) => name).join(', ')}`
            );
        }

        return report;
    }
}

module.exports = { IntelligentStateAnalyzer }; 