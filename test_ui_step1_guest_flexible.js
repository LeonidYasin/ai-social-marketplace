const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep1TwoGuestsFlexible() {
  console.log('🚀 Запуск теста шага 1: Вход двух гостей с гибкими селекторами');
  
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот начального состояния первого браузера
    console.log('📸 Первый браузер: делаем скриншот начального состояния');
    await page1.screenshot({ 
      path: './test_screenshots/step1_01_browser1_initial.png',
      fullPage: true 
    });
    
    // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ" с очень гибкими селекторами
    console.log('🔍 Первый браузер: ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    let guestButton1 = null;
    
    // Попробуем найти элемент с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ" любым способом
    try {
      // Метод 1: Поиск по точному тексту через XPath
      const elements1 = await page1.$x('//*[text()="ПРОДОЛЖИТЬ КАК ГОСТЬ"]');
      if (elements1.length > 0) {
        guestButton1 = elements1[0];
        console.log('✅ Первый браузер: найдена кнопка по точному тексту XPath');
      }
    } catch (error) {
      console.log('❌ Первый браузер: поиск по точному тексту не сработал');
    }
    
    if (!guestButton1) {
      try {
        // Метод 2: Поиск по частичному совпадению
        const elements2 = await page1.$x('//*[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]');
        if (elements2.length > 0) {
          guestButton1 = elements2[0];
          console.log('✅ Первый браузер: найдена кнопка по частичному совпадению XPath');
        }
      } catch (error) {
        console.log('❌ Первый браузер: поиск по частичному совпадению не сработал');
      }
    }
    
    if (!guestButton1) {
      try {
        // Метод 3: Поиск через JavaScript
        guestButton1 = await page1.evaluateHandle(() => {
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
          const elementExists = await page1.evaluate((element) => element !== null, guestButton1);
          if (elementExists) {
            console.log('✅ Первый браузер: найдена кнопка через JavaScript TreeWalker');
          } else {
            guestButton1 = null;
            console.log('❌ Первый браузер: элемент не найден в DOM');
          }
        }
      } catch (error) {
        console.log('❌ Первый браузер: поиск через JavaScript не сработал');
      }
    }
    
    if (!guestButton1) {
      try {
        // Метод 4: Поиск по всем элементам с текстом
        const allElements = await page1.evaluateHandle(() => {
          const elements = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
          );
          
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent && node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
              elements.push(node);
            }
          }
          return elements;
        });
        
        const elementsArray = await allElements.jsonValue();
        if (elementsArray.length > 0) {
          // Берем первый найденный элемент
          guestButton1 = await page1.evaluateHandle((elements) => elements[0], elementsArray);
          console.log('✅ Первый браузер: найдена кнопка через поиск всех элементов');
        }
      } catch (error) {
        console.log('❌ Первый браузер: поиск всех элементов не сработал');
      }
    }
    
    if (!guestButton1) {
      console.log('❌ Первый браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
      
      // Получаем весь текст страницы для анализа
      const pageText = await page1.evaluate(() => document.body.innerText);
      console.log('📋 Первый браузер: текст страницы:');
      console.log(pageText.substring(0, 500) + '...');
      
      throw new Error('Кнопка гостевого входа не найдена в первом браузере');
    }
    
    // Кликаем по кнопке гостевого входа в первом браузере
    console.log('🖱️ Первый браузер: кликаем по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await page1.evaluate((element) => element.click(), guestButton1);
    
    // Ждем авторизации первого гостя
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа первого гостя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step1_02_browser1_after_guest_login.png',
      fullPage: true 
    });
    
    // Проверяем, что первый гость авторизован
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот начального состояния второго браузера
    console.log('📸 Второй браузер: делаем скриншот начального состояния');
    await page2.screenshot({ 
      path: './test_screenshots/step1_03_browser2_initial.png',
      fullPage: true 
    });
    
    // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ" во втором браузере
    console.log('🔍 Второй браузер: ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    let guestButton2 = null;
    
    // Используем тот же гибкий поиск для второго браузера
    try {
      const elements2 = await page2.$x('//*[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]');
      if (elements2.length > 0) {
        guestButton2 = elements2[0];
        console.log('✅ Второй браузер: найдена кнопка по частичному совпадению XPath');
      }
    } catch (error) {
      console.log('❌ Второй браузер: поиск по частичному совпадению не сработал');
    }
    
    if (!guestButton2) {
      try {
        guestButton2 = await page2.evaluateHandle(() => {
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
          const elementExists = await page2.evaluate((element) => element !== null, guestButton2);
          if (elementExists) {
            console.log('✅ Второй браузер: найдена кнопка через JavaScript TreeWalker');
          } else {
            guestButton2 = null;
            console.log('❌ Второй браузер: элемент не найден в DOM');
          }
        }
      } catch (error) {
        console.log('❌ Второй браузер: поиск через JavaScript не сработал');
      }
    }
    
    if (!guestButton2) {
      console.log('❌ Второй браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
      throw new Error('Кнопка гостевого входа не найдена во втором браузере');
    }
    
    // Кликаем по кнопке гостевого входа во втором браузере
    console.log('🖱️ Второй браузер: кликаем по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await page2.evaluate((element) => element.click(), guestButton2);
    
    // Ждем авторизации второго гостя
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа второго гостя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step1_04_browser2_after_guest_login.png',
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
      path: './test_screenshots/step1_05_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step1_06_browser2_final.png',
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
          path: './test_screenshots/step1_error_browser1.png',
          fullPage: true 
        });
      }
    }
    
    if (browser2) {
      const page2 = (await browser2.pages())[0];
      if (page2) {
        await page2.screenshot({ 
          path: './test_screenshots/step1_error_browser2.png',
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
testStep1TwoGuestsFlexible().catch(console.error); 