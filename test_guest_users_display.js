const puppeteer = require('puppeteer');

async function testGuestUsersDisplay() {
  console.log('🚀 Тест отображения гостевых пользователей в правой панели');
  
  let browser1, browser2;
  try {
    // Запуск первого браузера
    console.log('🌐 Запускаем первый браузер');
    browser1 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page1 = await browser1.newPage();
    
    // Включаем логирование консоли
    page1.on('console', msg => console.log('📱 Браузер 1:', msg.text()));
    
    // Переход на главную страницу
    console.log('📱 Первый браузер: переходим на http://localhost:3000');
    await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ищем кнопку "Продолжить как гость"
    console.log('🔍 Первый браузер: ищем кнопку "Продолжить как гость"');
    const guestButton1 = await page1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Продолжить как гость'));
    });
    
    if (!guestButton1) {
      console.log('❌ Первый браузер: кнопка "Продолжить как гость" не найдена');
      const pageText = await page1.evaluate(() => document.body.innerText);
      console.log('📋 Текст страницы:', pageText.substring(0, 300));
      throw new Error('Кнопка гостевого входа не найдена');
    }
    
    // Кликаем по кнопке
    console.log('🖱️ Первый браузер: кликаем по кнопке "Продолжить как гость"');
    await page1.evaluate(button => button.click(), guestButton1);
    
    // Ждем авторизации
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Проверяем, что пользователь вошел
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Первый браузер: информация о пользователе:', userInfo1);
    
    // Проверяем правую панель на наличие пользователей
    console.log('🔍 Первый браузер: проверяем правую панель');
    const rightPanelUsers = await page1.evaluate(() => {
      const userItems = document.querySelectorAll('[data-testid="user-item"]');
      return Array.from(userItems).map(item => ({
        id: item.getAttribute('data-user-id'),
        name: item.querySelector('[data-testid="user-name"]')?.textContent || 'Без имени',
        isMe: !!item.querySelector('[data-testid="user-me"]')
      }));
    });
    
    console.log('👥 Первый браузер: пользователи в правой панели:', rightPanelUsers);
    
    // Запуск второго браузера
    console.log('\n🌐 Запускаем второй браузер');
    browser2 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page2 = await browser2.newPage();
    
    // Включаем логирование консоли
    page2.on('console', msg => console.log('📱 Браузер 2:', msg.text()));
    
    // Переход на главную страницу
    console.log('📱 Второй браузер: переходим на http://localhost:3000');
    await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ищем кнопку "Продолжить как гость"
    console.log('🔍 Второй браузер: ищем кнопку "Продолжить как гость"');
    const guestButton2 = await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Продолжить как гость'));
    });
    
    if (!guestButton2) {
      console.log('❌ Второй браузер: кнопка "Продолжить как гость" не найдена');
      throw new Error('Кнопка гостевого входа не найдена во втором браузере');
    }
    
    // Кликаем по кнопке
    console.log('🖱️ Второй браузер: кликаем по кнопке "Продолжить как гость"');
    await page2.evaluate(button => button.click(), guestButton2);
    
    // Ждем авторизации
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Проверяем, что пользователь вошел
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
    // Проверяем правую панель на наличие пользователей
    console.log('🔍 Второй браузер: проверяем правую панель');
    const rightPanelUsers2 = await page2.evaluate(() => {
      const userItems = document.querySelectorAll('[data-testid="user-item"]');
      return Array.from(userItems).map(item => ({
        id: item.getAttribute('data-user-id'),
        name: item.querySelector('[data-testid="user-name"]')?.textContent || 'Без имени',
        isMe: !!item.querySelector('[data-testid="user-me"]')
      }));
    });
    
    console.log('👥 Второй браузер: пользователи в правой панели:', rightPanelUsers2);
    
    // Анализ результатов
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТОВ:');
    console.log(`Первый браузер: ${rightPanelUsers.length} пользователей`);
    console.log(`Второй браузер: ${rightPanelUsers2.length} пользователей`);
    
    if (rightPanelUsers.length > 0 && rightPanelUsers2.length > 0) {
      console.log('✅ Оба браузера видят пользователей в правой панели');
      
      // Проверяем, видят ли они друг друга
      const users1 = rightPanelUsers.map(u => u.name);
      const users2 = rightPanelUsers2.map(u => u.name);
      
      console.log('Пользователи в браузере 1:', users1);
      console.log('Пользователи в браузере 2:', users2);
      
      // Ищем общих пользователей
      const commonUsers = users1.filter(name => users2.includes(name));
      console.log('Общие пользователи:', commonUsers);
      
      if (commonUsers.length > 0) {
        console.log('✅ Пользователи видят друг друга!');
      } else {
        console.log('❌ Пользователи НЕ видят друг друга');
      }
    } else {
      console.log('❌ Проблема: пользователи не отображаются в правой панели');
    }
    
    // Ждем для стабильности
    console.log('⏳ Ждем 10 секунд для стабильности...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error.message);
  } finally {
    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
  }
}

// Запуск теста
testGuestUsersDisplay(); 