const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = './test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testCompleteFix() {
  console.log('🚀 Тестируем полное исправление логики входа...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });
    
    console.log('📱 Открываем приложение...');
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('✅ Приложение загружено');
    await page.screenshot({ path: path.join(screenshotsDir, 'complete_01_initial.png') });

    // Ждем загрузки элементов
    console.log('⏳ Ждем загрузки элементов...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ТЕСТ 1: Guest-вход
    console.log('\n🧪 ТЕСТ 1: Guest-вход');
    
    // Ищем кнопку "Продолжить как гость"
    const guestButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const guestBtn = buttons.find(btn => btn.textContent.includes('Продолжить как гость'));
      return guestBtn ? {
        index: buttons.indexOf(guestBtn),
        text: guestBtn.textContent.trim()
      } : null;
    });
    
    if (guestButton) {
      console.log(`✅ Найдена кнопка: "${guestButton.text}"`);
      
      // Кликаем по кнопке
      console.log('🖱️ Кликаем по кнопке "Продолжить как гость"...');
      await page.evaluate((index) => {
        const buttons = document.querySelectorAll('button');
        if (buttons[index]) {
          buttons[index].click();
        }
      }, guestButton.index);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ path: path.join(screenshotsDir, 'complete_02_after_guest.png') });
      
      // Проверяем результат guest-входа
      const guestResult = await page.evaluate(() => {
        return {
          hasUser: !!localStorage.getItem('currentUser'),
          hasDialog: !!document.querySelector('[role="dialog"]'),
          userData: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null
        };
      });
      
      console.log('📋 Результат guest-входа:');
      console.log(JSON.stringify(guestResult, null, 2));
      
      if (guestResult.hasUser && !guestResult.hasDialog) {
        console.log('✅ Guest-вход успешен! Диалог закрылся, пользователь создан');
      } else {
        console.log('❌ Guest-вход не сработал');
      }
    } else {
      console.log('❌ Кнопка "Продолжить как гость" не найдена');
    }
    
    // Перезагружаем страницу для следующего теста
    console.log('\n🔄 Перезагружаем страницу...');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ТЕСТ 2: Валидация формы входа
    console.log('\n🧪 ТЕСТ 2: Валидация формы входа');
    
    // Ищем кнопку "Войти в систему"
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(btn => btn.textContent.includes('Войти в систему'));
      return loginBtn ? {
        index: buttons.indexOf(loginBtn),
        text: loginBtn.textContent.trim()
      } : null;
    });
    
    if (loginButton) {
      console.log(`✅ Найдена кнопка: "${loginButton.text}"`);
      
      // Кликаем по кнопке
      console.log('🖱️ Кликаем по кнопке "Войти в систему"...');
      await page.evaluate((index) => {
        const buttons = document.querySelectorAll('button');
        if (buttons[index]) {
          buttons[index].click();
        }
      }, loginButton.index);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ path: path.join(screenshotsDir, 'complete_03_choose_method.png') });
      
      // Ищем кнопку Email
      const emailButton = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          const buttons = Array.from(dialog.querySelectorAll('button'));
          const emailBtn = buttons.find(btn => btn.textContent.includes('Email'));
          return emailBtn ? {
            index: buttons.indexOf(emailBtn),
            text: emailBtn.textContent.trim()
          } : null;
        }
        return null;
      });
      
      if (emailButton) {
        console.log(`🖱️ Кликаем по кнопке Email: "${emailButton.text}"`);
        await page.evaluate((index) => {
          const dialog = document.querySelector('[role="dialog"]');
          if (dialog) {
            const buttons = dialog.querySelectorAll('button');
            if (buttons[index]) {
              buttons[index].click();
            }
          }
        }, emailButton.index);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_04_login_form.png') });
        
        // ТЕСТ 2.1: Валидация пустых полей
        console.log('\n🧪 ТЕСТ 2.1: Валидация пустых полей');
        
        // Кликаем по кнопке входа без заполнения полей
        console.log('🖱️ Кликаем по кнопке входа без заполнения полей...');
        await page.click('[data-testid="submit-button"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_05_validation_error.png') });
        
        // Проверяем сообщение об ошибке
        const validationResult = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return {
            hasError: dialog?.textContent.includes('Введите email') || dialog?.textContent.includes('Введите пароль'),
            errorText: dialog?.textContent || 'Нет ошибки'
          };
        });
        
        console.log('📋 Результат валидации:');
        console.log(JSON.stringify(validationResult, null, 2));
        
        if (validationResult.hasError) {
          console.log('✅ Валидация работает! Показана ошибка для пустых полей');
        } else {
          console.log('❌ Валидация не сработала');
        }
        
        // ТЕСТ 2.2: Валидация некорректного email
        console.log('\n🧪 ТЕСТ 2.2: Валидация некорректного email');
        
        // Заполняем некорректный email
        await page.type('[data-testid="email-input"]', 'invalid-email');
        await page.type('[data-testid="password-input"]', 'password123');
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_06_invalid_email.png') });
        
        // Кликаем по кнопке входа
        await page.click('[data-testid="submit-button"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_07_email_validation_error.png') });
        
        // Проверяем сообщение об ошибке
        const emailValidationResult = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return {
            hasError: dialog?.textContent.includes('корректный email'),
            errorText: dialog?.textContent || 'Нет ошибки'
          };
        });
        
        console.log('📋 Результат валидации email:');
        console.log(JSON.stringify(emailValidationResult, null, 2));
        
        if (emailValidationResult.hasError) {
          console.log('✅ Валидация email работает!');
        } else {
          console.log('❌ Валидация email не сработала');
        }
        
        // ТЕСТ 2.3: Успешный вход
        console.log('\n🧪 ТЕСТ 2.3: Успешный вход');
        
        // Очищаем поля и заполняем корректные данные
        await page.evaluate(() => {
          const emailInput = document.querySelector('[data-testid="email-input"]');
          const passwordInput = document.querySelector('[data-testid="password-input"]');
          if (emailInput) emailInput.value = '';
          if (passwordInput) passwordInput.value = '';
        });
        
        await page.type('[data-testid="email-input"]', 'test@example.com');
        await page.type('[data-testid="password-input"]', 'password123');
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_08_valid_form.png') });
        
        // Кликаем по кнопке входа
        await page.click('[data-testid="submit-button"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await page.screenshot({ path: path.join(screenshotsDir, 'complete_09_after_login.png') });
        
        // Проверяем результат входа
        const loginResult = await page.evaluate(() => {
          return {
            hasToken: !!localStorage.getItem('authToken'),
            hasUser: !!localStorage.getItem('currentUser'),
            dialogClosed: !document.querySelector('[role="dialog"]'),
            userData: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null
          };
        });
        
        console.log('📋 Результат входа:');
        console.log(JSON.stringify(loginResult, null, 2));
        
        if (loginResult.hasToken && loginResult.hasUser && loginResult.dialogClosed) {
          console.log('✅ Успешный вход! JWT токен сохранен, диалог закрылся');
        } else {
          console.log('⚠️ Проблемы с входом');
        }
        
      } else {
        console.log('❌ Кнопка Email не найдена');
      }
    } else {
      console.log('❌ Кнопка "Войти в систему" не найдена');
    }
    
    console.log('\n✅ Все тесты завершены');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (page) {
      await page.screenshot({ path: path.join(screenshotsDir, 'complete_error.png') });
    }
  } finally {
    console.log('📸 Скриншоты сохранены в папке test_screenshots/');
    console.log('🔍 Браузер оставлен открытым для ручной проверки');
  }
}

testCompleteFix().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 