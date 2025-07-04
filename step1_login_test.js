const puppeteer = require('puppeteer');

async function step1LoginTest() {
  console.log('🔍 Шаг 1: Вход пользователя...');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({ headless: false, slowMo: 800 });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: './test_screenshots/step1_01_initial.png', fullPage: true });

    // 1. Клик по кнопке входа
    await page.waitForSelector('button[aria-label="Войти"]', { timeout: 5000 });
    await page.click('button[aria-label="Войти"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: './test_screenshots/step1_02_after_login_click.png', fullPage: true });

    // 2. Проверяем, появилась ли форма входа (ищем input[type="email"])
    const emailInputExists = await page.$('input[type="email"], input[placeholder*="email"]');
    if (!emailInputExists) {
      await page.screenshot({ path: './test_screenshots/step1_error_no_email_input.png', fullPage: true });
      throw new Error('❌ Форма входа не появилась: поле email не найдено');
    }

    // 3. Заполняем форму
    await page.type('input[type="email"], input[placeholder*="email"]', 'testuser1@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.screenshot({ path: './test_screenshots/step1_03_form_filled.png', fullPage: true });

    // 4. Кликаем по кнопке отправки
    const submitButton = await page.$('button[type="submit"], button:has-text("Войти")');
    if (!submitButton) {
      await page.screenshot({ path: './test_screenshots/step1_error_no_submit.png', fullPage: true });
      throw new Error('❌ Кнопка отправки не найдена');
    }
    await submitButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: './test_screenshots/step1_04_after_submit.png', fullPage: true });

    // 5. Проверяем успешность входа
    const hasToken = await page.evaluate(() => !!localStorage.getItem('authToken'));
    if (!hasToken) {
      await page.screenshot({ path: './test_screenshots/step1_error_no_token.png', fullPage: true });
      throw new Error('❌ Вход не удался: токен не найден');
    }
    console.log('✅ Вход выполнен успешно!');
  } catch (error) {
    console.error(error.message);
  } finally {
    if (browser) await browser.close();
  }
}

step1LoginTest().catch(e => console.error('❌ Критическая ошибка:', e.message)); 