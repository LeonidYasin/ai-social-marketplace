const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = './test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function debugMobileIssue() {
  console.log('🔍 Отладка проблемы с мобильной версией...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 2000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Тестируем мобильный viewport
    await page.setViewport({ width: 375, height: 667 }); // iPhone размер
    
    console.log('📱 Открываем приложение в мобильном режиме...');
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('✅ Приложение загружено');
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile_01_initial.png') });

    // Ждем загрузки и ищем кнопку входа
    console.log('🔍 Ищем кнопку входа...');
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Получаем все кнопки для анализа
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((btn, index) => ({
        index,
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        visible: btn.offsetParent !== null
      }));
    });
    
    console.log('📋 Найденные кнопки:', buttons);
    
    // Кликаем по последней кнопке (обычно это кнопка профиля)
    if (buttons.length > 0) {
      const lastButton = buttons[buttons.length - 1];
      console.log(`🖱️ Кликаем по кнопке: "${lastButton.text}"`);
      
      await page.click(`button:nth-child(${lastButton.index + 1})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ path: path.join(screenshotsDir, 'mobile_02_after_click.png') });
      
      // Проверяем, что появилось
      const dialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          return {
            title: dialog.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
            buttons: Array.from(dialog.querySelectorAll('button')).map(btn => btn.textContent.trim()),
            hasWelcome: dialog.textContent.includes('Добро пожаловать')
          };
        }
        return null;
      });
      
      console.log('📋 Содержимое диалога:', dialogContent);
      
      if (dialogContent && dialogContent.hasWelcome) {
        console.log('✅ Найден экран "Добро пожаловать"');
        
        // Ищем кнопку "Войти в систему"
        const loginButton = await page.$x("//button[contains(., 'Войти в систему')]");
        if (loginButton.length > 0) {
          console.log('🖱️ Кликаем "Войти в систему"');
          await loginButton[0].click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await page.screenshot({ path: path.join(screenshotsDir, 'mobile_03_after_login_click.png') });
          
          // Проверяем, что появилось после клика
          const afterLoginContent = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
              return {
                title: dialog.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
                buttons: Array.from(dialog.querySelectorAll('button')).map(btn => btn.textContent.trim()),
                hasEmail: dialog.textContent.includes('Email')
              };
            }
            return null;
          });
          
          console.log('📋 После клика "Войти в систему":', afterLoginContent);
          
          if (afterLoginContent && afterLoginContent.hasEmail) {
            console.log('✅ Найдена кнопка Email');
            const emailButton = await page.$x("//button[contains(., 'Email')]");
            if (emailButton.length > 0) {
              console.log('🖱️ Кликаем Email');
              await emailButton[0].click();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await page.screenshot({ path: path.join(screenshotsDir, 'mobile_04_after_email_click.png') });
              
              // Проверяем форму входа
              const formExists = await page.evaluate(() => {
                return !!document.querySelector('[data-testid="email-input"]');
              });
              
              if (formExists) {
                console.log('✅ Форма входа найдена!');
              } else {
                console.log('❌ Форма входа не найдена');
              }
            }
          } else {
            console.log('❌ Кнопка Email не найдена после "Войти в систему"');
          }
        } else {
          console.log('❌ Кнопка "Войти в систему" не найдена');
        }
      } else {
        console.log('❌ Экран "Добро пожаловать" не найден');
      }
    }
    
    console.log('✅ Отладка завершена');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (page) {
      await page.screenshot({ path: path.join(screenshotsDir, 'mobile_error.png') });
    }
  } finally {
    console.log('📸 Скриншоты сохранены в папке test_screenshots/');
    console.log('🔍 Браузер оставлен открытым для ручной проверки');
  }
}

debugMobileIssue().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 