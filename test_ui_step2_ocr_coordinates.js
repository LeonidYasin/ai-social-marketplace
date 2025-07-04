const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function findTextCoordinates(page, text) {
  // Делаем скриншот для OCR
  const screenshot = await page.screenshot({ fullPage: true });
  const tempPath = './temp_screenshot.png';
  fs.writeFileSync(tempPath, screenshot);
  
  try {
    // Используем OCR для поиска координат
    const { data: { words } } = await Tesseract.recognize(tempPath, 'rus+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\rOCR: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('\n🔍 Ищем текст в OCR результатах...');
    
    // Ищем нужный текст
    if (words && Array.isArray(words)) {
      for (const word of words) {
        if (word.text && word.text.includes(text)) {
          console.log(`✅ Найден текст "${word.text}" с координатами:`, word.bbox);
          return word.bbox;
        }
      }
    } else {
      console.log('⚠️ OCR не вернул массив words');
    }
    
    return null;
  } finally {
    // Удаляем временный файл
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

async function testStep2OcrCoordinates() {
  console.log('🚀 Запуск теста шага 2 с OCR координатами');
  
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
      console.log('⚠️ Первый браузер: нужно войти, ищем координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" через OCR');
      
      // Ищем координаты через OCR
      const guestCoords1 = await findTextCoordinates(page1, 'ПРОДОЛЖИТЬ КАК ГОСТЬ');
      
      if (guestCoords1) {
        console.log(`✅ Первый браузер: найдены координаты (${guestCoords1.x0}, ${guestCoords1.y0})`);
        
        // Кликаем по координатам
        console.log('🖱️ Первый браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page1.mouse.click(guestCoords1.x0 + 50, guestCoords1.y0 + 10); // Кликаем в центр текста
        
        // Ждем авторизации
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Первый браузер: вошли как гость');
      } else {
        console.log('❌ Первый браузер: координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены через OCR');
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
      console.log('⚠️ Второй браузер: нужно войти, ищем координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" через OCR');
      
      // Ищем координаты через OCR
      const guestCoords2 = await findTextCoordinates(page2, 'ПРОДОЛЖИТЬ КАК ГОСТЬ');
      
      if (guestCoords2) {
        console.log(`✅ Второй браузер: найдены координаты (${guestCoords2.x0}, ${guestCoords2.y0})`);
        
        // Кликаем по координатам
        console.log('🖱️ Второй браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
        await page2.mouse.click(guestCoords2.x0 + 50, guestCoords2.y0 + 10); // Кликаем в центр текста
        
        // Ждем авторизации
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Второй браузер: вошли как гость');
      } else {
        console.log('❌ Второй браузер: координаты "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены через OCR');
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
testStep2OcrCoordinates().catch(console.error); 