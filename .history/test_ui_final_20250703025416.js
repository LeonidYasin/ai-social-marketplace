const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = './test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function finalTest() {
  console.log('🚀 Финальный тест мобильной версии...');
  
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
    await page.screenshot({ path: path.join(screenshotsDir, 'final_01_initial.png') });

    // Ждем загрузки элементов
    console.log('⏳ Ждем загрузки элементов...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ищем кнопку "Войти в систему" среди всех кнопок
    console.log('🔍 Ищем кнопку "Войти в систему"...');
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(btn => btn.textContent.includes('Войти в систему'));
      return loginBtn ? {
        index: buttons.indexOf(loginBtn),
        text: loginBtn.textContent.trim(),
        className: loginBtn.className
      } : null;
    });
    
    if (loginButton) {
      console.log(`✅ Найдена кнопка: "${loginButton.text}" (индекс: ${loginButton.index})`);
      
      // Кликаем по кнопке через evaluate
      console.log('🖱️ Кликаем по кнопке...');
      await page.evaluate((index) => {
        const buttons = document.querySelectorAll('button');
        if (buttons[index]) {
          buttons[index].click();
        }
      }, loginButton.index);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ path: path.join(screenshotsDir, 'final_02_after_login_click.png') });
      
      // Проверяем, что появилось
      console.log('🔍 Проверяем результат...');
      const result = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return {
          hasDialog: !!dialog,
          dialogTitle: dialog?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
          dialogButtons: dialog ? Array.from(dialog.querySelectorAll('button')).map(btn => btn.textContent.trim()) : [],
          dialogText: dialog?.textContent || 'Нет диалога',
          hasEmail: dialog?.textContent.includes('Email') || false,
          hasWelcome: dialog?.textContent.includes('Добро пожаловать') || false
        };
      });
      
      console.log('📋 Результат после клика:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.hasDialog) {
        console.log('✅ Диалог открылся!');
        
        if (result.hasEmail) {
          console.log('✅ Найдена кнопка Email в диалоге');
          
          // Ищем и кликаем по кнопке Email
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
            await page.click(`[role="dialog"] button:nth-child(${emailButton.index + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.screenshot({ path: path.join(screenshotsDir, 'final_03_after_email_click.png') });
            
            // Проверяем форму входа
            const formResult = await page.evaluate(() => {
              return {
                hasEmailInput: !!document.querySelector('[data-testid="email-input"]'),
                hasPasswordInput: !!document.querySelector('[data-testid="password-input"]'),
                hasSubmitButton: !!document.querySelector('[data-testid="submit-button"]'),
                formTitle: document.querySelector('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3, [role="dialog"] h4, [role="dialog"] h5, [role="dialog"] h6')?.textContent
              };
            });
            
            console.log('📋 Результат после клика Email:');
            console.log(JSON.stringify(formResult, null, 2));
            
            if (formResult.hasEmailInput) {
              console.log('✅ Форма входа найдена! Мобильная версия работает!');
              
              // Заполняем форму
              console.log('📝 Заполняем форму...');
              await page.type('[data-testid="email-input"]', 'test@example.com');
              await page.type('[data-testid="password-input"]', 'password123');
              
              await page.screenshot({ path: path.join(screenshotsDir, 'final_04_form_filled.png') });
              
              // Кликаем по кнопке входа
              console.log('🖱️ Кликаем по кнопке входа...');
              await page.click('[data-testid="submit-button"]');
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              await page.screenshot({ path: path.join(screenshotsDir, 'final_05_after_submit.png') });
              
              // Проверяем результат входа
              const loginResult = await page.evaluate(() => {
                return {
                  hasToken: !!localStorage.getItem('authToken'),
                  hasUser: !!localStorage.getItem('currentUser'),
                  dialogClosed: !document.querySelector('[role="dialog"]')
                };
              });
              
              console.log('📋 Результат входа:');
              console.log(JSON.stringify(loginResult, null, 2));
              
              if (loginResult.hasToken && loginResult.hasUser) {
                console.log('✅ Успешный вход! JWT токен сохранен!');
              } else {
                console.log('⚠️ Проблемы с входом');
              }
              
            } else {
              console.log('❌ Форма входа не найдена после клика Email');
            }
          } else {
            console.log('❌ Кнопка Email не найдена в диалоге');
          }
        } else {
          console.log('❌ Кнопка Email не найдена в диалоге');
        }
      } else {
        console.log('❌ Диалог не открылся после клика');
      }
    } else {
      console.log('❌ Кнопка "Войти в систему" не найдена');
    }
    
    console.log('✅ Тест завершен');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (page) {
      await page.screenshot({ path: path.join(screenshotsDir, 'final_error.png') });
    }
  } finally {
    console.log('📸 Скриншоты сохранены в папке test_screenshots/');
    console.log('🔍 Браузер оставлен открытым для ручной проверки');
  }
}

finalTest().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 