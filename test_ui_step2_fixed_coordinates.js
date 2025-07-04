const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep2FixedCoordinates() {
  console.log('🚀 Запуск теста шага 2 с фиксированными координатами');
  
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
    
    // Переход на главную страницу в первом браузере
    console.log('📱 Первый браузер: переходим на http://localhost:3000');
    await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния первого браузера
    console.log('📸 Первый браузер: делаем скриншот начального состояния');
    await page1.screenshot({ 
      path: './test_screenshots/step2_01_browser1_initial.png',
      fullPage: true 
    });
    
    // Проверяем, нужно ли войти
    console.log('🔍 Первый браузер: проверяем, нужно ли войти');
    const needsLogin1 = await page1.evaluate(() => {
      return document.body.innerText.includes('Добро пожаловать');
    });
    
    if (needsLogin1) {
      console.log('⚠️ Первый браузер: нужно войти, используем фиксированные координаты');
      
      // Фиксированные координаты для кнопки "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      // Основаны на анализе скриншотов - кнопка обычно находится в центре экрана
      const guestCoords1 = { x: 640, y: 400 }; // Центр экрана 1280x720
      
      console.log(`✅ Первый браузер: используем фиксированные координаты (${guestCoords1.x}, ${guestCoords1.y})`);
      
      // Кликаем по координатам
      console.log('🖱️ Первый браузер: кликаем по фиксированным координатам');
      await page1.mouse.click(guestCoords1.x, guestCoords1.y);
      
      // Ждем авторизации
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Первый браузер: попытались войти как гость');
    } else {
      console.log('✅ Первый браузер: уже авторизован');
    }
    
    // Делаем скриншот после входа первого пользователя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step2_02_browser1_after_login.png',
      fullPage: true 
    });
    
    // Ищем информацию о текущем пользователе
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Первый браузер: информация о пользователе:', userInfo1);
    
    // Запуск второго браузера
    console.log('\n🌐 Запускаем второй браузер');
    browser2 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page2 = await browser2.newPage();
    
    // Переход на главную страницу во втором браузере
    console.log('📱 Второй браузер: переходим на http://localhost:3000');
    await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния второго браузера
    console.log('📸 Второй браузер: делаем скриншот начального состояния');
    await page2.screenshot({ 
      path: './test_screenshots/step2_03_browser2_initial.png',
      fullPage: true 
    });
    
    // Проверяем, нужно ли войти во втором браузере
    console.log('🔍 Второй браузер: проверяем, нужно ли войти');
    const needsLogin2 = await page2.evaluate(() => {
      return document.body.innerText.includes('Добро пожаловать');
    });
    
    if (needsLogin2) {
      console.log('⚠️ Второй браузер: нужно войти, используем фиксированные координаты');
      
      // Фиксированные координаты для кнопки "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      const guestCoords2 = { x: 640, y: 400 }; // Центр экрана 1280x720
      
      console.log(`✅ Второй браузер: используем фиксированные координаты (${guestCoords2.x}, ${guestCoords2.y})`);
      
      // Кликаем по координатам
      console.log('🖱️ Второй браузер: кликаем по фиксированным координатам');
      await page2.mouse.click(guestCoords2.x, guestCoords2.y);
      
      // Ждем авторизации
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Второй браузер: попытались войти как гость');
    } else {
      console.log('✅ Второй браузер: уже авторизован');
    }
    
    // Делаем скриншот после входа второго пользователя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step2_04_browser2_after_login.png',
      fullPage: true 
    });
    
    // Ищем информацию о текущем пользователе во втором браузере
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
    // Ищем сайдбар с пользователями в первом браузере
    console.log('🔍 Первый браузер: ищем сайдбар с пользователями');
    const sidebarUsers1 = await page1.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"], .sidebar, .users-sidebar');
      if (!sidebar) return [];
      
      const userElements = sidebar.querySelectorAll('[data-testid="user-item"], .user-item, .user');
      return Array.from(userElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
    });
    
    console.log('👥 Первый браузер: пользователи в сайдбаре:', sidebarUsers1);
    
    // Ищем сайдбар с пользователями во втором браузере
    console.log('🔍 Второй браузер: ищем сайдбар с пользователями');
    const sidebarUsers2 = await page2.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"], .sidebar, .users-sidebar');
      if (!sidebar) return [];
      
      const userElements = sidebar.querySelectorAll('[data-testid="user-item"], .user-item, .user');
      return Array.from(userElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
    });
    
    console.log('👥 Второй браузер: пользователи в сайдбаре:', sidebarUsers2);
    
    // Проверяем, что пользователи видят друг друга
    const usersSeeEachOther = sidebarUsers1.length > 0 && sidebarUsers2.length > 0;
    if (usersSeeEachOther) {
      console.log('✅ Пользователи видят друг друга в сайдбаре');
    } else {
      console.log('⚠️ Пользователи не видят друг друга в сайдбаре');
    }
    
    // Ждем немного для проверки стабильности
    console.log('⏳ Ждем 5 секунд для проверки стабильности...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Финальные скриншоты
    await page1.screenshot({ 
      path: './test_screenshots/step2_05_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step2_06_browser2_final.png',
      fullPage: true 
    });
    
    console.log('✅ Тест шага 2 завершен!');
    console.log(`   Пользователь 1: ${userInfo1}`);
    console.log(`   Пользователь 2: ${userInfo2}`);
    console.log(`   Видят друг друга: ${usersSeeEachOther ? 'Да' : 'Нет'}`);
    
  } catch (error) {
    console.error('❌ Ошибка в тесте шага 2:', error.message);
    
    // Делаем скриншоты ошибок
    if (browser1) {
      const page1 = (await browser1.pages())[0];
      if (page1) {
        await page1.screenshot({ 
          path: './test_screenshots/step2_error_browser1.png',
          fullPage: true 
        });
      }
    }
    
    if (browser2) {
      const page2 = (await browser2.pages())[0];
      if (page2) {
        await page2.screenshot({ 
          path: './test_screenshots/step2_error_browser2.png',
          fullPage: true 
        });
      }
    }
  } finally {
    // Закрываем браузеры
    if (browser1) {
      await browser1.close();
    }
    if (browser2) {
      await browser2.close();
    }
  }
}

// Запуск теста
testStep2FixedCoordinates().catch(console.error); 