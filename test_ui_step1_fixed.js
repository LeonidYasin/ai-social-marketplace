const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep1() {
  console.log('🚀 Запуск теста шага 1: Вход в систему');
  
  let browser;
  try {
    // Запуск браузера
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Переход на главную страницу
    console.log('📱 Переходим на http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот начального состояния
    console.log('📸 Делаем скриншот начального состояния');
    await page.screenshot({ 
      path: './test_screenshots/step1_01_initial.png',
      fullPage: true 
    });
    
    // Ищем кнопку "ВОЙТИ В СИСТЕМУ" разными способами
    console.log('🔍 Ищем кнопку "ВОЙТИ В СИСТЕМУ"');
    
    let loginButton = null;
    const selectors = [
      '//button[contains(text(), "ВОЙТИ В СИСТЕМУ")]',
      '//*[contains(text(), "ВОЙТИ В СИСТЕМУ")]',
      '//div[contains(text(), "ВОЙТИ В СИСТЕМУ")]',
      '//span[contains(text(), "ВОЙТИ В СИСТЕМУ")]',
      '//a[contains(text(), "ВОЙТИ В СИСТЕМУ")]',
      'button:contains("ВОЙТИ В СИСТЕМУ")',
      '[data-testid="login-button"]',
      'button[aria-label="Войти"]'
    ];
    
    for (const selector of selectors) {
      try {
        if (selector.startsWith('//')) {
          // XPath селектор
          const elements = await page.$x(selector);
          if (elements.length > 0) {
            loginButton = elements[0];
            console.log(`✅ Найдена кнопка через XPath: ${selector}`);
            break;
          }
        } else {
          // CSS селектор
          const element = await page.$(selector);
          if (element) {
            loginButton = element;
            console.log(`✅ Найдена кнопка через CSS: ${selector}`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Селектор не сработал: ${selector}`);
      }
    }
    
    if (!loginButton) {
      console.log('❌ Кнопка "ВОЙТИ В СИСТЕМУ" не найдена');
      
      // Получаем весь текст страницы для анализа
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('📋 Текст страницы:');
      console.log(pageText.substring(0, 500) + '...');
      
      // Делаем скриншот ошибки
      await page.screenshot({ 
        path: './test_screenshots/step1_error.png',
        fullPage: true 
      });
      
      throw new Error('Кнопка входа не найдена');
    }
    
    // Кликаем по кнопке входа
    console.log('🖱️ Кликаем по кнопке "ВОЙТИ В СИСТЕМУ"');
    await loginButton.click();
    
    // Ждем появления формы входа
    console.log('⏳ Ждем появления формы входа');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот после клика
    console.log('📸 Делаем скриншот после клика');
    await page.screenshot({ 
      path: './test_screenshots/step1_02_after_login_click.png',
      fullPage: true 
    });
    
    // Проверяем, появилась ли форма входа
    const loginForm = await page.$('form, [data-testid="login-form"], .login-form');
    if (loginForm) {
      console.log('✅ Форма входа найдена');
      
      // Ищем поля email и пароль
      const emailField = await page.$('input[type="email"], input[name="email"], #email');
      const passwordField = await page.$('input[type="password"], input[name="password"], #password');
      
      if (emailField && passwordField) {
        console.log('✅ Поля email и пароль найдены');
        
        // Заполняем форму
        console.log('📝 Заполняем форму входа');
        await emailField.type('test@example.com');
        await passwordField.type('password123');
        
        // Делаем скриншот заполненной формы
        await page.screenshot({ 
          path: './test_screenshots/step1_03_form_filled.png',
          fullPage: true 
        });
        
        // Ищем кнопку отправки формы
        const submitButton = await page.$('button[type="submit"], input[type="submit"], .submit-button');
        if (submitButton) {
          console.log('✅ Кнопка отправки найдена');
          
          // Отправляем форму
          console.log('📤 Отправляем форму');
          await submitButton.click();
          
          // Ждем обработки
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Делаем финальный скриншот
          await page.screenshot({ 
            path: './test_screenshots/step1_04_after_submit.png',
            fullPage: true 
          });
          
          console.log('✅ Тест шага 1 завершен успешно!');
        } else {
          console.log('❌ Кнопка отправки формы не найдена');
        }
      } else {
        console.log('❌ Поля email или пароль не найдены');
      }
    } else {
      console.log('❌ Форма входа не найдена');
    }
    
  } catch (error) {
    console.error('❌ Ошибка в тесте шага 1:', error.message);
    
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ 
          path: './test_screenshots/step1_error.png',
          fullPage: true 
        });
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Запуск теста
testStep1().catch(console.error); 