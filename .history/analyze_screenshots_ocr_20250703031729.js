const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function analyzeScreenshotsWithOCR() {
  console.log('🔍 Анализируем скриншоты с OCR...');
  
  // Получаем имена файлов из аргументов командной строки
  let screenshots = process.argv.slice(2);
  if (screenshots.length === 0) {
    // Если не передано — анализируем все .png из test_screenshots
    screenshots = fs.readdirSync('./test_screenshots')
      .filter(f => f.endsWith('.png'));
  }
  
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
            logger: m => m.status && process.stdout.write(`   ${m.status}: ${(m.progress*100).toFixed(1)}%\r`)
          }
        );
        console.log();
        console.log(`\n📝 Полный распознанный текст:`);
        console.log('─'.repeat(50));
        console.log(result.data.text);
        console.log('─'.repeat(50));
        
        // Выводим все поля (words, lines, blocks)
        console.log('\n🔎 Детализация по словам:');
        result.data.words.forEach((w, i) => {
          console.log(`  [${i+1}] "${w.text}" (conf: ${w.confidence.toFixed(1)}%, bbox: ${w.bbox.x0},${w.bbox.y0},${w.bbox.x1},${w.bbox.y1})`);
        });
        console.log('\n🔎 Детализация по строкам:');
        result.data.lines.forEach((l, i) => {
          console.log(`  [${i+1}] "${l.text}" (conf: ${l.confidence.toFixed(1)}%, bbox: ${l.bbox.x0},${l.bbox.y0},${l.bbox.x1},${l.bbox.y1})`);
        });
        console.log('\n🔎 Детализация по блокам:');
        result.data.blocks.forEach((b, i) => {
          console.log(`  [${i+1}] "${b.text}" (conf: ${b.confidence.toFixed(1)}%, bbox: ${b.bbox.x0},${b.bbox.y0},${b.bbox.x1},${b.bbox.y1})`);
        });
        
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
        console.log(`   Строк найдено: ${result.data.lines.length}`);
        console.log(`   Блоков найдено: ${result.data.blocks.length}`);
        
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