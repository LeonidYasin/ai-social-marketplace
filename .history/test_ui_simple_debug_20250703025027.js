const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = './test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function simpleDebug() {
  console.log('🔍 Простая отладка мобильной версии...');
  
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
    await page.screenshot({ path: path.join(screenshotsDir, 'simple_01_initial.png') });

    // Ждем дольше и пробуем разные селекторы
    console.log('⏳ Ждем загрузки элементов...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Проверяем разные селекторы
    const selectors = [
      'button',
      '[role="button"]',
      '.MuiButton-root',
      '.MuiIconButton-root',
      'a[role="button"]'
    ];
    
    for (const selector of selectors) {
      try {
        console.log(`🔍 Проверяем селектор: ${selector}`);
        const elements = await page.$$(selector);
        console.log(`   Найдено элементов: ${elements.length}`);
        
        if (elements.length > 0) {
          const texts = await page.evaluate((sel) => {
            return Array.from(document.querySelectorAll(sel)).map(el => el.textContent.trim());
          }, selector);
          console.log(`   Тексты: ${texts.slice(0, 5).join(', ')}...`);
        }
      } catch (error) {
        console.log(`   Ошибка: ${error.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(screenshotsDir, 'simple_02_after_wait.png') });
    
    // Пробуем найти кнопку "Войти в систему" разными способами
    console.log('🔍 Ищем кнопку "Войти в систему"...');
    
    const loginButtonSelectors = [
      'button:has-text("Войти в систему")',
      'button:has-text("Войти")',
      '[role="button"]:has-text("Войти")',
      '.MuiButton-root:has-text("Войти")'
    ];
    
    for (const selector of loginButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`✅ Найдена кнопка через: ${selector}`);
          await button.click();
          console.log('🖱️ Кликнули по кнопке');
          await new Promise(resolve => setTimeout(resolve, 3000));
          await page.screenshot({ path: path.join(screenshotsDir, `simple_03_after_click_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`) });
          break;
        }
      } catch (error) {
        console.log(`❌ Ошибка с селектором ${selector}: ${error.message}`);
      }
    }
    
    // Проверяем, что появилось
    console.log('🔍 Проверяем результат...');
    const result = await page.evaluate(() => {
      return {
        hasDialog: !!document.querySelector('[role="dialog"]'),
        dialogTitle: document.querySelector('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3, [role="dialog"] h4, [role="dialog"] h5, [role="dialog"] h6')?.textContent,
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()).filter(t => t),
        pageTitle: document.title
      };
    });
    
    console.log('📋 Результат:', result);
    await page.screenshot({ path: path.join(screenshotsDir, 'simple_04_final.png') });
    
    console.log('✅ Отладка завершена');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (page) {
      await page.screenshot({ path: path.join(screenshotsDir, 'simple_error.png') });
    }
  } finally {
    console.log('📸 Скриншоты сохранены в папке test_screenshots/');
    console.log('🔍 Браузер оставлен открытым для ручной проверки');
  }
}

simpleDebug().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 