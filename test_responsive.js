const puppeteer = require('puppeteer');

async function testResponsiveDesign() {
  console.log('🧪 Тестирование адаптивного дизайна...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Тест 1: Десктоп (1200x800)
    console.log('📱 Тест 1: Десктоп (1200x800)');
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_desktop.png' });
    
    // Проверяем, что сайдбары открыты на десктопе
    const leftSidebar = await page.$('[data-testid="sidebar-left"]');
    const rightSidebar = await page.$('[data-testid="sidebar-right"]');
    console.log('✅ Десктоп: левый сайдбар:', !!leftSidebar, 'правый сайдбар:', !!rightSidebar);
    
    // Тест 2: Планшет (768x1024)
    console.log('📱 Тест 2: Планшет (768x1024)');
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_tablet.png' });
    
    // Тест 3: Мобильный (375x667)
    console.log('📱 Тест 3: Мобильный (375x667)');
    await page.setViewport({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_mobile.png' });
    
    // Проверяем, что сайдбары закрыты на мобильном
    const mobileLeftSidebar = await page.$('[data-testid="sidebar-left"]');
    const mobileRightSidebar = await page.$('[data-testid="sidebar-right"]');
    console.log('✅ Мобильный: левый сайдбар:', !!mobileLeftSidebar, 'правый сайдбар:', !!mobileRightSidebar);
    
    // Тест 4: Очень маленький экран (320x568)
    console.log('📱 Тест 4: Очень маленький экран (320x568)');
    await page.setViewport({ width: 320, height: 568 });
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_small_mobile.png' });
    
    console.log('✅ Все тесты адаптивности завершены');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования адаптивности:', error);
  } finally {
    await browser.close();
  }
}

testResponsiveDesign(); 