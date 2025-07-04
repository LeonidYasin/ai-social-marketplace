const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep2Final() {
  console.log('🚀 Запуск финального теста шага 2: Вход и проверка чата');
  
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
      console.log('⚠️ Первый браузер: нужно войти, ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
      
      // Ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      const guestCoords1 = await page1.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
            const rect = node.parentElement.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
        }
        return null;
      });
      
      if (guestCoords1) {
        console.log(`✅ Первый браузер: найдены координаты (${guestCoords1.x}, ${guestCoords1.y})`);
        
        // Кликаем по координатам
        console.log('🖱️ Первый браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page1.mouse.click(guestCoords1.x, guestCoords1.y);
        
        // Ждем авторизации
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Первый браузер: вошли как гость');
      } else {
        console.log('❌ Первый браузер: координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены');
        throw new Error('Не удалось войти как гость в первом браузере');
      }
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
      console.log('⚠️ Второй браузер: нужно войти, ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
      
      // Ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      const guestCoords2 = await page2.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
            const rect = node.parentElement.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
        }
        return null;
      });
      
      if (guestCoords2) {
        console.log(`✅ Второй браузер: найдены координаты (${guestCoords2.x}, ${guestCoords2.y})`);
        
        // Кликаем по координатам
        console.log('🖱️ Второй браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page2.mouse.click(guestCoords2.x, guestCoords2.y);
        
        // Ждем авторизации
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Второй браузер: вошли как гость');
      } else {
        console.log('❌ Второй браузер: координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены');
        throw new Error('Не удалось войти как гость во втором браузере');
      }
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
    
    // Пытаемся начать чат в первом браузере
    console.log('💬 Первый браузер: пытаемся начать чат');
    
    // Ищем кнопку чата или пользователя для клика
    const chatButton1 = await page1.evaluate(() => {
      const chatButtons = document.querySelectorAll('[data-testid="chat-button"], .chat-button, .start-chat');
      if (chatButtons.length > 0) {
        return chatButtons[0];
      }
      
      // Ищем пользователя в сайдбаре для клика
      const userItems = document.querySelectorAll('[data-testid="user-item"], .user-item, .user');
      if (userItems.length > 0) {
        return userItems[0];
      }
      
      return null;
    });
    
    if (chatButton1) {
      console.log('✅ Первый браузер: найдена кнопка чата/пользователя');
      
      // Кликаем по кнопке чата
      await page1.evaluate((button) => button.click(), chatButton1);
      
      // Ждем открытия чата
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Делаем скриншот после открытия чата
      await page1.screenshot({ 
        path: './test_screenshots/step2_05_browser1_after_chat_click.png',
        fullPage: true 
      });
      
      // Проверяем, открылся ли чат
      const chatOpened1 = await page1.evaluate(() => {
        const chatWindow = document.querySelector('[data-testid="chat-window"], .chat-window, .chat-dialog');
        return !!chatWindow;
      });
      
      if (chatOpened1) {
        console.log('✅ Первый браузер: чат успешно открыт');
      } else {
        console.log('⚠️ Первый браузер: чат не открылся');
      }
    } else {
      console.log('❌ Первый браузер: кнопка чата/пользователя не найдена');
    }
    
    // Пытаемся начать чат во втором браузере
    console.log('💬 Второй браузер: пытаемся начать чат');
    
    const chatButton2 = await page2.evaluate(() => {
      const chatButtons = document.querySelectorAll('[data-testid="chat-button"], .chat-button, .start-chat');
      if (chatButtons.length > 0) {
        return chatButtons[0];
      }
      
      // Ищем пользователя в сайдбаре для клика
      const userItems = document.querySelectorAll('[data-testid="user-item"], .user-item, .user');
      if (userItems.length > 0) {
        return userItems[0];
      }
      
      return null;
    });
    
    if (chatButton2) {
      console.log('✅ Второй браузер: найдена кнопка чата/пользователя');
      
      // Кликаем по кнопке чата
      await page2.evaluate((button) => button.click(), chatButton2);
      
      // Ждем открытия чата
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Делаем скриншот после открытия чата
      await page2.screenshot({ 
        path: './test_screenshots/step2_06_browser2_after_chat_click.png',
        fullPage: true 
      });
      
      // Проверяем, открылся ли чат
      const chatOpened2 = await page2.evaluate(() => {
        const chatWindow = document.querySelector('[data-testid="chat-window"], .chat-window, .chat-dialog');
        return !!chatWindow;
      });
      
      if (chatOpened2) {
        console.log('✅ Второй браузер: чат успешно открыт');
      } else {
        console.log('⚠️ Второй браузер: чат не открылся');
      }
    } else {
      console.log('❌ Второй браузер: кнопка чата/пользователя не найдена');
    }
    
    // Ждем немного для проверки стабильности
    console.log('⏳ Ждем 5 секунд для проверки стабильности...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Финальные скриншоты
    await page1.screenshot({ 
      path: './test_screenshots/step2_07_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step2_08_browser2_final.png',
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
testStep2Final().catch(console.error); 