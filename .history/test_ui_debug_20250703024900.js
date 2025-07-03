const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = './test_screenshots';
const logFile = path.join(screenshotsDir, 'mobile_debug.log');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}
function log(msg) {
  fs.appendFileSync(logFile, msg + '\n');
  console.log(msg);
}
function logObj(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  fs.appendFileSync(logFile, str + '\n');
  console.log(str);
}
async function screenshot(page, name) {
  const file = path.join(screenshotsDir, name);
  await page.screenshot({ path: file });
  log(`📸 Скриншот: ${name}`);
}
async function debugMobileIssue() {
  fs.writeFileSync(logFile, ''); // clear log
  log('🔍 Отладка проблемы с мобильной версией...');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1500,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });
    log('📱 Открываем приложение в мобильном режиме...');
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    log('✅ Приложение загружено');
    await screenshot(page, 'mobile_01_initial.png');
    // Ждем загрузки и ищем все кнопки
    await page.waitForSelector('button', { timeout: 10000 });
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((btn, index) => ({
        index,
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        visible: btn.offsetParent !== null
      }));
    });
    log('📋 Найденные кнопки:');
    logObj(buttons);
    await screenshot(page, 'mobile_02_buttons.png');
    // Ищем кнопку "Войти в систему"
    const loginButtonIndex = buttons.findIndex(btn => btn.text === 'Войти в систему');
    if (loginButtonIndex !== -1) {
      log(`🖱️ Найдена кнопка "Войти в систему" (индекс: ${loginButtonIndex})`);
      // Пробуем разные способы клика
      try {
        // Способ 1: по индексу
        log('🖱️ Способ 1: клик по индексу');
        await page.click(`button:nth-child(${loginButtonIndex + 1})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await screenshot(page, 'mobile_03_after_login_click_way1.png');
        
        // Проверяем изменения
        const afterClick1 = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return {
            hasDialog: !!dialog,
            dialogTitle: dialog?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
            allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()),
            dialogText: dialog?.textContent || 'Нет диалога'
          };
        });
        log('📋 После клика способом 1:');
        logObj(afterClick1);
        
      } catch (error) {
        log(`❌ Ошибка при клике способом 1: ${error.message}`);
      }
      
      try {
        // Способ 2: по тексту через XPath
        log('🖱️ Способ 2: клик через XPath');
        const loginButtonXPath = await page.$x("//button[contains(text(), 'Войти в систему')]");
        if (loginButtonXPath.length > 0) {
          await loginButtonXPath[0].click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          await screenshot(page, 'mobile_04_after_login_click_way2.png');
          
          const afterClick2 = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            return {
              hasDialog: !!dialog,
              dialogTitle: dialog?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
              allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()),
              dialogText: dialog?.textContent || 'Нет диалога'
            };
          });
          log('📋 После клика способом 2:');
          logObj(afterClick2);
        }
      } catch (error) {
        log(`❌ Ошибка при клике способом 2: ${error.message}`);
      }
      
      try {
        // Способ 3: через evaluate
        log('🖱️ Способ 3: клик через evaluate');
        await page.evaluate((index) => {
          const buttons = document.querySelectorAll('button');
          if (buttons[index]) {
            buttons[index].click();
          }
        }, loginButtonIndex);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await screenshot(page, 'mobile_05_after_login_click_way3.png');
        
        const afterClick3 = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return {
            hasDialog: !!dialog,
            dialogTitle: dialog?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
            allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()),
            dialogText: dialog?.textContent || 'Нет диалога'
          };
        });
        log('📋 После клика способом 3:');
        logObj(afterClick3);
        
      } catch (error) {
        log(`❌ Ошибка при клике способом 3: ${error.message}`);
      }
      
    } else {
      log('❌ Кнопка "Войти в систему" не найдена');
    }
    log('✅ Отладка завершена');
  } catch (error) {
    log('❌ Ошибка: ' + error.message);
    if (page) {
      await screenshot(page, 'mobile_error.png');
    }
  } finally {
    log('📸 Скриншоты сохранены в папке test_screenshots/');
    log('🔍 Браузер оставлен открытым для ручной проверки');
  }
}
debugMobileIssue().catch(error => {
  log('❌ Критическая ошибка: ' + error.message);
}); 