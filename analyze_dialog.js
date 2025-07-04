const puppeteer = require('puppeteer');

async function analyzeDialog() {
  console.log('🔍 Анализ диалога входа...');
  
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
    
    // Кликаем по кнопке входа
    await page.click('button[aria-label="Войти"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Анализируем диалог
    const dialogAnalysis = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) {
        return { error: 'Диалог не найден' };
      }
      
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const inputs = Array.from(dialog.querySelectorAll('input'));
      const textElements = Array.from(dialog.querySelectorAll('*')).filter(el => el.textContent.trim());
      
      return {
        dialogText: dialog.textContent.trim(),
        buttons: buttons.map((btn, index) => ({
          index,
          text: btn.textContent.trim(),
          className: btn.className,
          type: btn.type,
          disabled: btn.disabled,
          visible: window.getComputedStyle(btn).display !== 'none'
        })),
        inputs: inputs.map((input, index) => ({
          index,
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          id: input.id,
          value: input.value,
          visible: window.getComputedStyle(input).display !== 'none'
        })),
        textElements: textElements.map((el, index) => ({
          index,
          tagName: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          className: el.className
        }))
      };
    });
    
    console.log('\n📋 Анализ диалога входа:');
    if (dialogAnalysis.error) {
      console.log('❌ Ошибка:', dialogAnalysis.error);
      return;
    }
    console.log('Текст диалога:', dialogAnalysis.dialogText.substring(0, 200) + '...');
    
    console.log('\n🔘 Кнопки в диалоге:');
    dialogAnalysis.buttons.forEach((btn, index) => {
      if (btn.visible) {
        console.log(`  ${index + 1}. Текст: "${btn.text}" | Тип: ${btn.type} | Класс: ${btn.className}`);
      }
    });
    
    console.log('\n📝 Поля ввода в диалоге:');
    dialogAnalysis.inputs.forEach((input, index) => {
      if (input.visible) {
        console.log(`  ${index + 1}. Тип: ${input.type} | Placeholder: "${input.placeholder}" | Name: ${input.name}`);
      }
    });
    
    console.log('\n📄 Текстовые элементы:');
    dialogAnalysis.textElements.slice(0, 10).forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.tagName}: "${el.text}"`);
    });
    
    // Делаем скриншот
    await page.screenshot({ path: './test_screenshots/dialog_analysis.png', fullPage: true });
    console.log('\n📸 Скриншот анализа сохранен: dialog_analysis.png');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeDialog().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 