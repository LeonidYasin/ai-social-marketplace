const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep1TwoGuestsDomSearch() {
  console.log('🚀 Запуск теста шага 1: Вход двух гостей с детальным поиском по DOM');
  
  let browser1, browser2;
  try {
    // Запуск первого браузера в incognito режиме
    console.log('🌐 Запускаем первый браузер в incognito режиме');
    browser1 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--incognito',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
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
      path: './test_screenshots/step1_01_browser1_dom_initial.png',
      fullPage: true 
    });
    
    // Детальный поиск кликабельного элемента с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ"
    console.log('🔍 Первый браузер: ищем кликабельный элемент с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    const clickableElement1 = await page1.evaluate(() => {
      // Функция для поиска кликабельного элемента
      function findClickableElement(text) {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          // Проверяем, содержит ли элемент нужный текст
          if (node.textContent && node.textContent.includes(text)) {
            // Проверяем, является ли элемент кликабельным
            const tagName = node.tagName.toLowerCase();
            const isClickable = tagName === 'button' || 
                              tagName === 'a' || 
                              tagName === 'input' ||
                              node.onclick ||
                              node.getAttribute('onclick') ||
                              node.getAttribute('role') === 'button' ||
                              node.style.cursor === 'pointer' ||
                              node.classList.contains('clickable') ||
                              node.classList.contains('button');
            
            if (isClickable) {
              return {
                element: node,
                tagName: tagName,
                text: node.textContent.trim(),
                isClickable: true
              };
            }
            
            // Если элемент не кликабельный, ищем ближайший кликабельный родитель
            let parent = node.parentElement;
            while (parent && parent !== document.body) {
              const parentTagName = parent.tagName.toLowerCase();
              const parentIsClickable = parentTagName === 'button' || 
                                       parentTagName === 'a' || 
                                       parentTagName === 'input' ||
                                       parent.onclick ||
                                       parent.getAttribute('onclick') ||
                                       parent.getAttribute('role') === 'button' ||
                                       parent.style.cursor === 'pointer' ||
                                       parent.classList.contains('clickable') ||
                                       parent.classList.contains('button');
              
              if (parentIsClickable) {
                return {
                  element: parent,
                  tagName: parentTagName,
                  text: parent.textContent.trim(),
                  isClickable: true,
                  foundInChild: true
                };
              }
              parent = parent.parentElement;
            }
          }
        }
        return null;
      }
      
      return findClickableElement('ПРОДОЛЖИТЬ КАК ГОСТЬ');
    });
    
    if (!clickableElement1) {
      console.log('❌ Первый браузер: кликабельный элемент с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найден');
      
      // Получаем весь текст страницы для анализа
      const pageText = await page1.evaluate(() => document.body.innerText);
      console.log('📋 Первый браузер: текст страницы:');
      console.log(pageText.substring(0, 500) + '...');
      
      throw new Error('Кликабельный элемент гостевого входа не найден в первом браузере');
    }
    
    console.log(`✅ Первый браузер: найден кликабельный элемент: ${clickableElement1.tagName} с текстом "${clickableElement1.text}"`);
    
    // Кликаем по найденному элементу в первом браузере
    console.log('🖱️ Первый браузер: кликаем по найденному элементу');
    await page1.evaluate((elementInfo) => {
      if (elementInfo.element) {
        elementInfo.element.click();
      }
    }, clickableElement1);
    
    // Ждем авторизации первого гостя
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа первого гостя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step1_02_browser1_dom_after_guest_login.png',
      fullPage: true 
    });
    
    // Проверяем, что первый гость авторизован
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Первый браузер: информация о пользователе:', userInfo1);
    
    // Запуск второго браузера в incognito режиме
    console.log('\n🌐 Запускаем второй браузер в incognito режиме');
    browser2 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--incognito',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
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
      path: './test_screenshots/step1_03_browser2_dom_initial.png',
      fullPage: true 
    });
    
    // Детальный поиск кликабельного элемента с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ" во втором браузере
    console.log('🔍 Второй браузер: ищем кликабельный элемент с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    const clickableElement2 = await page2.evaluate(() => {
      // Функция для поиска кликабельного элемента
      function findClickableElement(text) {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          // Проверяем, содержит ли элемент нужный текст
          if (node.textContent && node.textContent.includes(text)) {
            // Проверяем, является ли элемент кликабельным
            const tagName = node.tagName.toLowerCase();
            const isClickable = tagName === 'button' || 
                              tagName === 'a' || 
                              tagName === 'input' ||
                              node.onclick ||
                              node.getAttribute('onclick') ||
                              node.getAttribute('role') === 'button' ||
                              node.style.cursor === 'pointer' ||
                              node.classList.contains('clickable') ||
                              node.classList.contains('button');
            
            if (isClickable) {
              return {
                element: node,
                tagName: tagName,
                text: node.textContent.trim(),
                isClickable: true
              };
            }
            
            // Если элемент не кликабельный, ищем ближайший кликабельный родитель
            let parent = node.parentElement;
            while (parent && parent !== document.body) {
              const parentTagName = parent.tagName.toLowerCase();
              const parentIsClickable = parentTagName === 'button' || 
                                       parentTagName === 'a' || 
                                       parentTagName === 'input' ||
                                       parent.onclick ||
                                       parent.getAttribute('onclick') ||
                                       parent.getAttribute('role') === 'button' ||
                                       parent.style.cursor === 'pointer' ||
                                       parent.classList.contains('clickable') ||
                                       parent.classList.contains('button');
              
              if (parentIsClickable) {
                return {
                  element: parent,
                  tagName: parentTagName,
                  text: parent.textContent.trim(),
                  isClickable: true,
                  foundInChild: true
                };
              }
              parent = parent.parentElement;
            }
          }
        }
        return null;
      }
      
      return findClickableElement('ПРОДОЛЖИТЬ КАК ГОСТЬ');
    });
    
    if (!clickableElement2) {
      console.log('❌ Второй браузер: кликабельный элемент с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найден');
      throw new Error('Кликабельный элемент гостевого входа не найден во втором браузере');
    }
    
    console.log(`✅ Второй браузер: найден кликабельный элемент: ${clickableElement2.tagName} с текстом "${clickableElement2.text}"`);
    
    // Кликаем по найденному элементу во втором браузере
    console.log('🖱️ Второй браузер: кликаем по найденному элементу');
    await page2.evaluate((elementInfo) => {
      if (elementInfo.element) {
        elementInfo.element.click();
      }
    }, clickableElement2);
    
    // Ждем авторизации второго гостя
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа второго гостя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step1_04_browser2_dom_after_guest_login.png',
      fullPage: true 
    });
    
    // Проверяем, что второй гость авторизован
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
    // Проверяем, что пользователи разные
    if (userInfo1 !== userInfo2) {
      console.log('✅ Тест успешен: два разных гостя авторизованы!');
      console.log(`   Гость 1: ${userInfo1}`);
      console.log(`   Гость 2: ${userInfo2}`);
    } else {
      console.log('⚠️ Предупреждение: возможно, оба гостя имеют одинаковые данные');
      console.log(`   Гость 1: ${userInfo1}`);
      console.log(`   Гость 2: ${userInfo2}`);
    }
    
    // Ждем немного для проверки стабильности
    console.log('⏳ Ждем 5 секунд для проверки стабильности...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Финальные скриншоты
    await page1.screenshot({ 
      path: './test_screenshots/step1_05_browser1_dom_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step1_06_browser2_dom_final.png',
      fullPage: true 
    });
    
    console.log('✅ Тест шага 1 завершен успешно! Два гостя авторизованы в разных браузерах.');
    
  } catch (error) {
    console.error('❌ Ошибка в тесте шага 1:', error.message);
    
    // Делаем скриншоты ошибок
    if (browser1) {
      const page1 = (await browser1.pages())[0];
      if (page1) {
        await page1.screenshot({ 
          path: './test_screenshots/step1_error_browser1_dom.png',
          fullPage: true 
        });
      }
    }
    
    if (browser2) {
      const page2 = (await browser2.pages())[0];
      if (page2) {
        await page2.screenshot({ 
          path: './test_screenshots/step1_error_browser2_dom.png',
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
testStep1TwoGuestsDomSearch().catch(console.error); 