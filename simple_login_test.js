const puppeteer = require('puppeteer');

async function simpleLoginTest() {
  console.log('🔍 Простой тест входа пользователей...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Переходим на главную страницу
    console.log('📱 Переходим на главную страницу...');
    await page.goto('http://localhost:3000');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начальной страницы
    await page.screenshot({ path: './test_screenshots/simple_01_initial.png', fullPage: true });
    console.log('📸 Скриншот начальной страницы сохранен');
    
    // Ищем кнопку входа
    console.log('🔍 Ищем кнопку входа...');
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      console.log('Найдено кнопок:', buttons.length);
      
      const loginBtn = buttons.find(btn => btn.getAttribute('aria-label') === 'Войти');
      console.log('Кнопка входа найдена:', !!loginBtn);
      
      return loginBtn ? true : false;
    });
    
    if (loginButton) {
      console.log('✅ Кнопка входа найдена, кликаем...');
      
      // Кликаем по кнопке входа
      await page.click('button[aria-label="Войти"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Делаем скриншот диалога
      await page.screenshot({ path: './test_screenshots/simple_02_dialog.png', fullPage: true });
      console.log('📸 Скриншот диалога сохранен');
      
      // Ищем кнопку "Войти в систему"
      console.log('🔍 Ищем кнопку "Войти в систему"...');
      const loginSystemButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginSystemBtn = buttons.find(btn => btn.textContent.includes('Войти в систему'));
        console.log('Кнопка "Войти в систему" найдена:', !!loginSystemBtn);
        return loginSystemBtn ? true : false;
      });
      
      if (loginSystemButton) {
        console.log('✅ Кнопка "Войти в систему" найдена, кликаем...');
        
        // Кликаем по кнопке "Войти в систему"
        await page.click('button:has-text("Войти в систему")');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Делаем скриншот формы
        await page.screenshot({ path: './test_screenshots/simple_03_form.png', fullPage: true });
        console.log('📸 Скриншот формы сохранен');
        
        // Анализируем поля формы
        const formFields = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(input => ({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name,
            id: input.id
          }));
        });
        
        console.log('📋 Найдены поля формы:', formFields);
        
        // Заполняем форму
        const testUser = {
          email: 'testuser1@example.com',
          password: 'password123'
        };
        
        console.log('📝 Заполняем форму...');
        
        // Ищем поле email
        const emailInput = formFields.find(field => field.type === 'email' || field.placeholder?.toLowerCase().includes('email'));
        if (emailInput) {
          await page.type('input[type="email"], input[placeholder*="email"]', testUser.email);
          console.log('✅ Email введен');
        }
        
        // Ищем поле пароля
        const passwordInput = formFields.find(field => field.type === 'password');
        if (passwordInput) {
          await page.type('input[type="password"]', testUser.password);
          console.log('✅ Пароль введен');
        }
        
        // Делаем скриншот заполненной формы
        await page.screenshot({ path: './test_screenshots/simple_04_filled.png', fullPage: true });
        console.log('📸 Скриншот заполненной формы сохранен');
        
        // Ищем кнопку отправки
        console.log('🔍 Ищем кнопку отправки...');
        const submitButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(btn => 
            btn.type === 'submit' || 
            btn.textContent.includes('Войти') ||
            btn.textContent.includes('Login')
          );
          console.log('Кнопка отправки найдена:', !!submitBtn);
          return submitBtn ? true : false;
        });
        
        if (submitButton) {
          console.log('✅ Кнопка отправки найдена, отправляем форму...');
          
          // Отправляем форму
          await page.click('button[type="submit"], button:has-text("Войти")');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Делаем скриншот после входа
          await page.screenshot({ path: './test_screenshots/simple_05_after_login.png', fullPage: true });
          console.log('📸 Скриншот после входа сохранен');
          
          // Проверяем успешность входа
          const hasToken = await page.evaluate(() => {
            return !!localStorage.getItem('authToken');
          });
          
          if (hasToken) {
            console.log('✅ Пользователь успешно вошел в систему!');
          } else {
            console.log('❌ Токен не найден, вход не удался');
          }
        } else {
          console.log('❌ Кнопка отправки не найдена');
        }
      } else {
        console.log('❌ Кнопка "Войти в систему" не найдена');
      }
    } else {
      console.log('❌ Кнопка входа не найдена');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

simpleLoginTest().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 