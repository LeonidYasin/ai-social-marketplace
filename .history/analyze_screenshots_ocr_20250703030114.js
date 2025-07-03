const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function analyzeScreenshotsWithOCR() {
  console.log('🔍 Анализируем скриншоты с OCR...');
  
  const screenshots = [
    'final_01_initial.png',
    'final_02_after_login_click.png'
  ];
  
  for (const screenshot of screenshots) {
    const filePath = path.join('./test_screenshots', screenshot);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n📸 Анализируем: ${screenshot}`);
      
      try {
        // Используем Tesseract для распознавания текста
        const result = await Tesseract.recognize(
          filePath,
          'rus+eng', // Русский и английский языки
          {
            logger: m => console.log(`   ${m.status}: ${m.progress * 100}%`)
          }
        );
        
        console.log(`\n📝 Распознанный текст:`);
        console.log('─'.repeat(50));
        console.log(result.data.text);
        console.log('─'.repeat(50));
        
        // Анализируем найденный текст
        const text = result.data.text.toLowerCase();
        
        if (screenshot === 'final_01_initial.png') {
          console.log('\n🔍 Анализ начального экрана:');
          if (text.includes('войти в систему')) {
            console.log('   ✅ Найдена кнопка "Войти в систему"');
          }
          if (text.includes('добро пожаловать')) {
            console.log('   ✅ Найден экран "Добро пожаловать"');
          }
          if (text.includes('email')) {
            console.log('   ✅ Найдена кнопка Email');
          }
        } else if (screenshot === 'final_02_after_login_click.png') {
          console.log('\n🔍 Анализ после клика:');
          if (text.includes('войти в систему')) {
            console.log('   ✅ Кнопка "Войти в систему" все еще видна');
          }
          if (text.includes('добро пожаловать')) {
            console.log('   ✅ Экран "Добро пожаловать" все еще виден');
          }
          if (text.includes('email')) {
            console.log('   ✅ Найдена кнопка Email');
          }
          if (text.includes('google')) {
            console.log('   ✅ Найдена кнопка Google');
          }
          if (text.includes('facebook')) {
            console.log('   ✅ Найдена кнопка Facebook');
          }
          if (text.includes('telegram')) {
            console.log('   ✅ Найдена кнопка Telegram');
          }
          if (text.includes('github')) {
            console.log('   ✅ Найдена кнопка GitHub');
          }
        }
        
        // Показываем статистику распознавания
        console.log(`\n📊 Статистика:`);
        console.log(`   Уверенность: ${(result.data.confidence).toFixed(1)}%`);
        console.log(`   Слов найдено: ${result.data.words.length}`);
        
      } catch (error) {
        console.error(`   ❌ Ошибка OCR: ${error.message}`);
      }
      
    } else {
      console.log(`❌ Файл не найден: ${screenshot}`);
    }
  }
  
  console.log('\n✅ Анализ завершен');
}

analyzeScreenshotsWithOCR().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 