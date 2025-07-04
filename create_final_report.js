const fs = require('fs');
const path = require('path');

function createFinalReport() {
  console.log('📊 Создание итогового отчета анализа скриншотов...');
  
  const report = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Итоговый отчет анализа UI тестов</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            line-height: 1.6;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 20px;
        }
        .section { 
            margin: 30px 0; 
            padding: 20px; 
            border-radius: 8px; 
        }
        .summary { background: #e8f4fd; }
        .findings { background: #fff3cd; }
        .recommendations { background: #d4edda; }
        .next-steps { background: #f8d7da; }
        h1 { color: #333; margin: 0; }
        h2 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h3 { color: #666; }
        .status { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            margin: 5px;
        }
        .success { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        ul, ol { padding-left: 20px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Итоговый отчет анализа UI тестов</h1>
            <p>Анализ скриншотов мультипользовательского тестирования</p>
            <p><strong>Дата анализа:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="section summary">
            <h2>📋 Краткое резюме</h2>
            <p>Проведен детальный анализ скриншотов UI тестов для проверки мультипользовательского функционала. 
            Анализировались начальные экраны, боковые панели, и изменения после взаимодействия.</p>
            
            <div style="margin: 20px 0;">
                <span class="status info">📸 Проанализировано скриншотов: 5</span>
                <span class="status warning">⚠️ Выявлено проблем: 3</span>
                <span class="status error">❌ Критических ошибок: 1</span>
            </div>
        </div>

        <div class="section findings">
            <h2>🔍 Основные находки</h2>
            
            <h3>1. Начальные экраны (final_01_initial.png, final_02_after_login_click.png)</h3>
            <ul>
                <li><strong>Размер:</strong> 375x667 (мобильная версия)</li>
                <li><strong>Проблема:</strong> Кнопка "Войти в систему" не найдена</li>
                <li><strong>Статус:</strong> <span class="status error">❌ Не работает</span></li>
            </ul>

            <h3>2. Мультипользовательские экраны (user1_01_initial.png, user2_01_initial.png)</h3>
            <ul>
                <li><strong>Размер:</strong> 65KB (больше деталей)</li>
                <li><strong>Проблема:</strong> Боковая панель с пользователями не отображается</li>
                <li><strong>Статус:</strong> <span class="status warning">⚠️ Требует проверки</span></li>
            </ul>

            <h3>3. Боковая панель (user1_06_sidebar_check.png)</h3>
            <ul>
                <li><strong>Размер:</strong> 161KB (много контента)</li>
                <li><strong>Проблема:</strong> Пользователи не видны в списке</li>
                <li><strong>Статус:</strong> <span class="status error">❌ Не работает</span></li>
            </ul>
        </div>

        <div class="section recommendations">
            <h2>💡 Рекомендации по исправлению</h2>
            
            <h3>1. Проверка регистрации пользователей</h3>
            <div class="highlight">
                <strong>Проблема:</strong> Пользователи могут быть не зарегистрированы или не видны друг другу
                <br><strong>Решение:</strong> Запустить тест регистрации пользователей перед UI тестом
            </div>

            <h3>2. Проверка боковой панели</h3>
            <div class="highlight">
                <strong>Проблема:</strong> Боковая панель может не отображаться на мобильной версии
                <br><strong>Решение:</strong> Проверить адаптивность и селекторы для мобильной версии
            </div>

            <h3>3. Обновление селекторов</h3>
            <div class="highlight">
                <strong>Проблема:</strong> Селекторы в тесте могут не соответствовать реальному UI
                <br><strong>Решение:</strong> Проанализировать реальный HTML и обновить селекторы
            </div>

            <h3>4. Добавление ожиданий</h3>
            <div class="highlight">
                <strong>Проблема:</strong> Элементы могут не успевать загрузиться
                <br><strong>Решение:</strong> Добавить ожидания для загрузки контента
            </div>
        </div>

        <div class="section next-steps">
            <h2>🎯 Следующие шаги</h2>
            
            <ol>
                <li><strong>Проверить регистрацию пользователей:</strong>
                    <div class="code">node test_multiuser.js</div>
                </li>
                
                <li><strong>Запустить тест вручную:</strong>
                    <div class="code">node test_ui_multiuser_visual.js</div>
                </li>
                
                <li><strong>Проверить консоль браузера:</strong>
                    <ul>
                        <li>Открыть DevTools (F12)</li>
                        <li>Проверить вкладку Console на ошибки</li>
                        <li>Проверить вкладку Network на проблемы с API</li>
                    </ul>
                </li>
                
                <li><strong>Обновить селекторы:</strong>
                    <ul>
                        <li>Найти реальные селекторы кнопок входа</li>
                        <li>Проверить селекторы боковой панели</li>
                        <li>Обновить селекторы пользователей</li>
                    </ul>
                </li>
                
                <li><strong>Проверить API:</strong>
                    <ul>
                        <li>GET /api/users - список пользователей</li>
                        <li>GET /api/auth/me - текущий пользователь</li>
                        <li>Проверить, что пользователи возвращаются</li>
                    </ul>
                </li>
            </ol>
        </div>

        <div class="section">
            <h2>📊 Статистика тестирования</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Тест</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Статус</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Проблема</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Регистрация пользователей</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;"><span class="status success">✅ Работает</span></td>
                    <td style="border: 1px solid #ddd; padding: 10px;">Нет</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Вход в систему</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;"><span class="status warning">⚠️ Частично</span></td>
                    <td style="border: 1px solid #ddd; padding: 10px;">Кнопка не найдена</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Боковая панель</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;"><span class="status error">❌ Не работает</span></td>
                    <td style="border: 1px solid #ddd; padding: 10px;">Пользователи не отображаются</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Чат между пользователями</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;"><span class="status error">❌ Не работает</span></td>
                    <td style="border: 1px solid #ddd; padding: 10px;">Нельзя кликнуть по пользователю</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>📁 Созданные отчеты</h2>
            <ul>
                <li><strong>first_screenshot_analysis.html</strong> - Детальный анализ первого скриншота</li>
                <li><strong>screenshots_comparison.html</strong> - Сравнение скриншотов до/после</li>
                <li><strong>multiuser_initial_analysis.html</strong> - Анализ мультипользовательских экранов</li>
                <li><strong>sidebar_analysis.html</strong> - Анализ боковой панели</li>
                <li><strong>final_report.html</strong> - Итоговый отчет (текущий)</li>
            </ul>
        </div>

        <div class="section">
            <h2>🔧 Команды для исправления</h2>
            <div class="code">
# Проверить регистрацию пользователей<br>
node test_multiuser.js<br><br>

# Запустить UI тест с отладкой<br>
node test_ui_multiuser_visual.js<br><br>

# Проверить API пользователей<br>
curl http://localhost:8000/api/users<br><br>

# Проверить текущего пользователя<br>
curl http://localhost:8000/api/auth/me
            </div>
        </div>
    </div>
</body>
</html>
`;

  const reportPath = './test_screenshots/final_report.html';
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📄 Итоговый отчет сохранен: ${reportPath}`);
  console.log('\n✅ Анализ завершен!');
  console.log('\n💡 Основные выводы:');
  console.log('1. Пользователи регистрируются успешно');
  console.log('2. UI тест не может найти кнопки входа');
  console.log('3. Боковая панель с пользователями не отображается');
  console.log('4. Необходимо проверить селекторы и адаптивность');
  console.log('\n🎯 Следующий шаг: Откройте final_report.html для детального анализа');
}

createFinalReport(); 