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
      slowMo: 1200,
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
    // Кликаем по последней кнопке (профиль)
    if (buttons.length > 0) {
      const lastButton = buttons[buttons.length - 1];
      log(`🖱️ Кликаем по кнопке: "${lastButton.text}"`);
      await page.click(`button:nth-child(${lastButton.index + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await screenshot(page, 'mobile_03_after_profile_click.png');
      // Проверяем содержимое диалога
      const dialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          return {
            title: dialog.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
            buttons: Array.from(dialog.querySelectorAll('button')).map(btn => btn.textContent.trim()),
            hasWelcome: dialog.textContent.includes('Добро пожаловать'),
            allText: dialog.textContent
          };
        }
        return null;
      });
      log('📋 Содержимое диалога:');
      logObj(dialogContent);
      await screenshot(page, 'mobile_04_dialog_opened.png');
      if (dialogContent && dialogContent.hasWelcome) {
        log('✅ Найден экран "Добро пожаловать"');
        // Ищем кнопку "Войти в систему" разными способами
        let loginButton = await page.$x("//button[contains(., 'Войти в систему')]");
        if (loginButton.length === 0) {
          loginButton = await page.$x("//button[contains(., 'Войти')]");
        }
        if (loginButton.length === 0) {
          // Fallback: ищем по aria-label
          loginButton = await page.$$('button[aria-label*="Войти"]');
        }
        if (loginButton.length > 0) {
          log('🖱️ Кликаем "Войти в систему"');
          await loginButton[0].click();
          await new Promise(resolve => setTimeout(resolve, 1500));
          await screenshot(page, 'mobile_05_after_login_click.png');
          // Проверяем, что появилось после клика
          const afterLoginContent = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
              return {
                title: dialog.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
                buttons: Array.from(dialog.querySelectorAll('button')).map(btn => btn.textContent.trim()),
                hasEmail: dialog.textContent.includes('Email'),
                allText: dialog.textContent
              };
            }
            return null;
          });
          log('📋 После клика "Войти в систему":');
          logObj(afterLoginContent);
          await screenshot(page, 'mobile_06_after_login_dialog.png');
          if (afterLoginContent && afterLoginContent.hasEmail) {
            log('✅ Найдена кнопка Email');
            let emailButton = await page.$x("//button[contains(., 'Email')]");
            if (emailButton.length === 0) {
              emailButton = await page.$x("//button[contains(., 'email')]");
            }
            if (emailButton.length > 0) {
              log('🖱️ Кликаем Email');
              await emailButton[0].click();
              await new Promise(resolve => setTimeout(resolve, 1500));
              await screenshot(page, 'mobile_07_after_email_click.png');
              // Проверяем форму входа
              const formExists = await page.evaluate(() => {
                return !!document.querySelector('[data-testid="email-input"]');
              });
              if (formExists) {
                log('✅ Форма входа найдена!');
              } else {
                log('❌ Форма входа не найдена');
              }
            } else {
              log('❌ Кнопка Email не найдена');
            }
          } else {
            log('❌ Кнопка Email не найдена после "Войти в систему"');
          }
        } else {
          log('❌ Кнопка "Войти в систему" не найдена');
        }
      } else {
        log('❌ Экран "Добро пожаловать" не найден');
      }
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