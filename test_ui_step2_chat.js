const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep2Chat() {
  console.log('🚀 Запуск теста шага 2: Проверка чата между пользователями');
  
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
    
    // Проверяем, что пользователь авторизован
    console.log('🔍 Первый браузер: проверяем авторизацию');
    const isLoggedIn1 = await page1.evaluate(() => {
      const feedElement = document.querySelector('[data-testid="feed"], .feed, .posts-container');
      const welcomeText = document.body.innerText.includes('Добро пожаловать');
      return !!feedElement && !welcomeText;
    });
    
    if (!isLoggedIn1) {
      console.log('⚠️ Первый браузер: пользователь не авторизован, пытаемся войти как гость');
      
      // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      const guestButton1 = await page1.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
            return node.parentElement;
          }
        }
        return null;
      });
      
      if (guestButton1) {
        console.log('✅ Первый браузер: найдена кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page1.evaluate((element) => element.click(), guestButton1);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Первый браузер: вошли как гость');
      } else {
        console.log('❌ Первый браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
        throw new Error('Не удалось войти как гость в первом браузере');
      }
    }
    
    console.log('✅ Первый браузер: пользователь авторизован');
    
    // Ищем информацию о текущем пользователе
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Первый браузер: информация о пользователе:', userInfo1);
    
    // Ищем сайдбар с пользователями
    console.log('🔍 Первый браузер: ищем сайдбар с пользователями');
    const sidebarUsers1 = await page1.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"], .sidebar, .users-sidebar');
      if (!sidebar) return [];
      
      const userElements = sidebar.querySelectorAll('[data-testid="user-item"], .user-item, .user');
      return Array.from(userElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
    });
    
    console.log('👥 Первый браузер: пользователи в сайдбаре:', sidebarUsers1);
    
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
      path: './test_screenshots/step2_02_browser2_initial.png',
      fullPage: true 
    });
    
    // Проверяем, что пользователь авторизован во втором браузере
    console.log('🔍 Второй браузер: проверяем авторизацию');
    const isLoggedIn2 = await page2.evaluate(() => {
      const feedElement = document.querySelector('[data-testid="feed"], .feed, .posts-container');
      const welcomeText = document.body.innerText.includes('Добро пожаловать');
      return !!feedElement && !welcomeText;
    });
    
    if (!isLoggedIn2) {
      console.log('⚠️ Второй браузер: пользователь не авторизован, пытаемся войти как гость');
      
      // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"
      const guestButton2 = await page2.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
            return node.parentElement;
          }
        }
        return null;
      });
      
      if (guestButton2) {
        console.log('✅ Второй браузер: найдена кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page2.evaluate((element) => element.click(), guestButton2);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Второй браузер: вошли как гость');
      } else {
        console.log('❌ Второй браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
        throw new Error('Не удалось войти как гость во втором браузере');
      }
    }
    
    console.log('✅ Второй браузер: пользователь авторизован');
    
    // Ищем информацию о текущем пользователе во втором браузере
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
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
        path: './test_screenshots/step2_03_browser1_after_chat_click.png',
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
        path: './test_screenshots/step2_04_browser2_after_chat_click.png',
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
testStep2Chat().catch(console.error); 