const puppeteer = require('puppeteer');

async function debugUIStructure() {
  console.log('🔍 Отладка структуры UI...');
  
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
    await page.goto('http://localhost:3000');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📋 Анализируем структуру страницы...');
    
    // Анализируем все кнопки
    const buttons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map((btn, index) => {
        const svg = btn.querySelector('svg');
        return {
          index,
          text: btn.textContent.trim(),
          title: btn.getAttribute('title'),
          'aria-label': btn.getAttribute('aria-label'),
          className: btn.className,
          hasSvg: !!svg,
          svgContent: svg ? svg.innerHTML.substring(0, 100) + '...' : null,
          isVisible: window.getComputedStyle(btn).display !== 'none',
          position: btn.getBoundingClientRect()
        };
      });
    });
    
    console.log('\n🔍 Найденные кнопки:');
    buttons.forEach((btn, index) => {
      if (btn.isVisible) {
        console.log(`  ${index + 1}. Текст: "${btn.text}" | Title: "${btn.title}" | Aria-label: "${btn['aria-label']}" | SVG: ${btn.hasSvg}`);
      }
    });
    
    // Ищем кнопку с tooltip "Войти"
    const loginButton = buttons.find(btn => btn.title === 'Войти' || btn['aria-label'] === 'Войти');
    
    if (loginButton) {
      console.log('\n✅ Найдена кнопка входа:', loginButton);
      
      // Кликаем по кнопке
      await page.evaluate((index) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        buttons[index].click();
      }, loginButton.index);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Анализируем диалог входа
      const dialog = await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .MuiDialog-root, .dialog'));
        return dialogs.map(dialog => ({
          role: dialog.getAttribute('role'),
          className: dialog.className,
          text: dialog.textContent.trim().substring(0, 200) + '...',
          isVisible: window.getComputedStyle(dialog).display !== 'none'
        }));
      });
      
      console.log('\n🔍 Найденные диалоги:');
      dialog.forEach((d, index) => {
        if (d.isVisible) {
          console.log(`  ${index + 1}. Role: ${d.role} | Class: ${d.className}`);
          console.log(`     Текст: ${d.text}`);
        }
      });
      
      // Ищем кнопку Email в диалоге
      const emailButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Email'));
      });
      
      if (emailButton) {
        console.log('\n✅ Найдена кнопка Email');
        await page.evaluate(btn => btn.click(), emailButton);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Анализируем форму входа
        const form = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(input => ({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name,
            id: input.id,
            className: input.className
          }));
        });
        
        console.log('\n🔍 Поля формы входа:');
        form.forEach((input, index) => {
          console.log(`  ${index + 1}. Type: ${input.type} | Placeholder: "${input.placeholder}" | Name: ${input.name}`);
        });
      }
    } else {
      console.log('\n❌ Кнопка входа не найдена');
      console.log('Доступные кнопки с tooltip:');
      buttons.filter(btn => btn.title).forEach(btn => {
        console.log(`  - "${btn.title}"`);
      });
    }
    
    // Делаем скриншот
    await page.screenshot({ path: './test_screenshots/debug_ui_structure.png', fullPage: true });
    console.log('\n📸 Скриншот сохранен: debug_ui_structure.png');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugUIStructure().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 