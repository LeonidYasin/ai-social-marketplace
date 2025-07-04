const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

function printWordTable(words) {
  if (!words || words.length === 0) {
    console.log('❌ Нет распознанных слов.');
    return;
  }
  console.log('\n📦 Все слова (до 30):');
  console.log('Idx | Text                | Conf | x0   | y0   | x1   | y1   | W   | H');
  words.slice(0, 30).forEach((w, i) => {
    const b = w.bbox || { x0: '', y0: '', x1: '', y1: '' };
    const width = b.x1 && b.x0 ? b.x1 - b.x0 : '';
    const height = b.y1 && b.y0 ? b.y1 - b.y0 : '';
    console.log(
      `${String(i + 1).padEnd(3)} | ${w.text.padEnd(20)} | ${Math.round(w.confidence).toString().padEnd(4)} | ${String(b.x0).padEnd(4)} | ${String(b.y0).padEnd(4)} | ${String(b.x1).padEnd(4)} | ${String(b.y1).padEnd(4)} | ${String(width).padEnd(3)} | ${String(height).padEnd(3)}`
    );
  });
}

async function analyzeScreenshotUniversal(imagePath, searchKeywords = []) {
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Скриншот не найден:', imagePath);
    return;
  }
  console.log('🔍 Анализируем скриншот:', imagePath);
  try {
    // Попробуем с настройками для получения координат
    const result = await Tesseract.recognize(imagePath, 'rus+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r${Math.round(m.progress * 100)}%`);
        }
      },
      // Добавляем настройки для получения координат
      psm: 6, // PSM_SINGLE_UNIFORM_BLOCK
      oem: 3, // OEM_DEFAULT
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789.,!?()[]{}:;"\'`~@#$%^&*+=|\\/<>-_ ',
      tessedit_pageseg_mode: 6
    });
    
    console.log(`\n✅ Распознан текст (${result.data.text.length} символов, уверенность: ${Math.round(result.data.confidence)}%)`);
    
    // ДЕТАЛЬНАЯ ДИАГНОСТИКА - выводим полную структуру результата
    console.log('\n🔬 ДЕТАЛЬНАЯ ДИАГНОСТИКА РЕЗУЛЬТАТА TESSERACT:');
    console.log('─'.repeat(60));
    console.log('📊 Структура result:');
    console.log('  - result.data:', typeof result.data);
    console.log('  - result.data.text:', typeof result.data.text, `(${result.data.text.length} символов)`);
    console.log('  - result.data.confidence:', typeof result.data.confidence, result.data.confidence);
    console.log('  - result.data.words:', typeof result.data.words, Array.isArray(result.data.words) ? `(${result.data.words.length} элементов)` : 'НЕ МАССИВ');
    console.log('  - result.data.lines:', typeof result.data.lines, Array.isArray(result.data.lines) ? `(${result.data.lines.length} элементов)` : 'НЕ МАССИВ');
    console.log('  - result.data.blocks:', typeof result.data.blocks, Array.isArray(result.data.blocks) ? `(${result.data.blocks.length} элементов)` : 'НЕ МАССИВ');
    console.log('  - result.data.paragraphs:', typeof result.data.paragraphs, Array.isArray(result.data.paragraphs) ? `(${result.data.paragraphs.length} элементов)` : 'НЕ МАССИВ');
    
    // Показываем все доступные поля в result.data
    console.log('\n📋 Все поля в result.data:');
    Object.keys(result.data).forEach(key => {
      const value = result.data[key];
      if (Array.isArray(value)) {
        console.log(`  - ${key}: массив (${value.length} элементов)`);
        if (value.length > 0 && value.length <= 3) {
          console.log(`    Примеры:`, value.slice(0, 3).map(v => typeof v === 'object' ? JSON.stringify(v).substring(0, 100) + '...' : v));
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(`  - ${key}: объект (${Object.keys(value).length} полей)`);
      } else {
        console.log(`  - ${key}: ${typeof value} = ${value}`);
      }
    });
    
    // Если есть words, показываем их структуру
    if (result.data.words && Array.isArray(result.data.words) && result.data.words.length > 0) {
      console.log('\n📦 Структура первого слова:');
      const firstWord = result.data.words[0];
      console.log('  - firstWord:', JSON.stringify(firstWord, null, 2));
    }
    
    // Если есть lines, показываем их структуру
    if (result.data.lines && Array.isArray(result.data.lines) && result.data.lines.length > 0) {
      console.log('\n📏 Структура первой строки:');
      const firstLine = result.data.lines[0];
      console.log('  - firstLine:', JSON.stringify(firstLine, null, 2));
    }
    
    // Попробуем получить координаты через blocks
    if (result.data.blocks && Array.isArray(result.data.blocks)) {
      console.log('\n📦 Анализ blocks для поиска координат:');
      result.data.blocks.forEach((block, index) => {
        if (index < 3) { // Показываем первые 3 блока
          console.log(`  Блок ${index}:`, JSON.stringify(block, null, 2));
        }
      });
    }
    
    // Попробуем альтернативный способ - через hocr
    if (result.data.hocr) {
      console.log('\n📋 HOCR данные (альтернативный способ получения координат):');
      console.log('  - hocr доступен:', !!result.data.hocr);
      if (typeof result.data.hocr === 'string') {
        console.log('  - hocr длина:', result.data.hocr.length);
        console.log('  - hocr начало:', result.data.hocr.substring(0, 200) + '...');
      }
    }
    
    console.log('─'.repeat(60));
    
    console.log('\n📋 Текст:');
    console.log('─'.repeat(40));
    console.log(result.data.text);
    console.log('─'.repeat(40));

    // Bounding box для ключевых слов
    const keywords = searchKeywords.length > 0 ? searchKeywords : [
      'Войти', 'Login', 'Профиль', 'Выход', 'Sign in', 'Sign out',
      'Гость', 'Guest', 'Пост', 'Post', 'Комментарий', 'Comment',
      'Чат', 'Chat', 'Сообщение', 'Message', 'Лайк', 'Like', 'Реакция', 'Reaction',
      'Уведомление', 'Notification', 'Онлайн', 'Online', 'ВОЙТИ В СИСТЕМУ', 'ПРОДОЛЖИТЬ КАК ГОСТЬ'
    ];
    
    // Ищем ключевые слова в тексте и пытаемся найти их координаты
    console.log('\n🔑 Поиск ключевых слов в тексте:');
    keywords.forEach(keyword => {
      if (result.data.text.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`  ✅ "${keyword}" - найден в тексте`);
      }
    });

    // Пытаемся найти bounding box для ключевых слов
    const foundWords = (result.data.words || []).filter(w =>
      keywords.some(k => w.text.toLowerCase().includes(k.toLowerCase()))
    );
    if (foundWords.length > 0) {
      console.log('\n🔑 Найдены ключевые слова с координатами:');
      foundWords.forEach(w => {
        const b = w.bbox || { x0: '', y0: '', x1: '', y1: '' };
        const width = b.x1 && b.x0 ? b.x1 - b.x0 : '';
        const height = b.y1 && b.y0 ? b.y1 - b.y0 : '';
        console.log(`  - "${w.text}" (conf: ${Math.round(w.confidence)}%, x: ${b.x0}, y: ${b.y0}, w: ${width}, h: ${height})`);
      });
    } else {
      console.log('\n❌ Ключевые слова с координатами не найдены (возможно, Tesseract не вернул words)');
    }

    // Поиск кнопок (по тексту)
    const buttonRegex = /([А-Яа-яA-Za-z0-9\s]+)(кнопка|button|btn|нажмите|click|Войти|Login|Sign in|ПРОДОЛЖИТЬ|Continue|ВОЙТИ В СИСТЕМУ|ПРОДОЛЖИТЬ КАК ГОСТЬ)/gi;
    const buttonMatches = result.data.text.match(buttonRegex);
    if (buttonMatches) {
      console.log('\n🖱️ Найденные кнопки по тексту:');
      buttonMatches.forEach(btn => console.log(`  • ${btn.trim()}`));
    }

    // Поиск форм
    const formRegex = /([А-Яа-яA-Za-z0-9\s]+)(форма|form|введите|enter|email|пароль|password)/gi;
    const formMatches = result.data.text.match(formRegex);
    if (formMatches) {
      console.log('\n📝 Найденные формы:');
      formMatches.forEach(form => console.log(`  • ${form.trim()}`));
    }

    // Таблица всех слов
    printWordTable(result.data.words);

    // Краткий отчет по ключевым элементам
    const keyElements = [
      'войти', 'login', 'sign in', 'гость', 'guest',
      'пользователь', 'user', 'профиль', 'profile',
      'пост', 'post', 'сообщение', 'message',
      'чат', 'chat', 'комментарий', 'comment',
      'лайк', 'like', 'реакция', 'reaction',
      'уведомление', 'notification', 'онлайн', 'online'
    ];
    console.log('\n🔍 Краткий отчет по ключевым элементам:');
    keyElements.forEach(element => {
      if (result.data.text.toLowerCase().includes(element.toLowerCase())) {
        console.log(`  ✅ "${element}"`);
      }
    });

    // Рекомендации для UI-тестов
    console.log('\n💡 Рекомендации для UI-тестов:');
    if (result.data.text.toLowerCase().includes('войти в систему')) {
      console.log('  • Ищите кнопку с текстом "ВОЙТИ В СИСТЕМУ"');
      console.log('  • Возможные селекторы:');
      console.log('    - XPath: //button[contains(., "ВОЙТИ В СИСТЕМУ")]');
      console.log('    - CSS: button:contains("ВОЙТИ В СИСТЕМУ")');
      console.log('    - Puppeteer: page.$x(\'//*[contains(text(), "ВОЙТИ В СИСТЕМУ")]\')');
    }
    if (result.data.text.toLowerCase().includes('продолжить как гость')) {
      console.log('  • Ищите кнопку с текстом "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    }

  } catch (error) {
    console.error('❌ Ошибка анализа:', error.message);
  }
}

// CLI запуск: node analyze_screenshots_ocr.js <имя_файла> [ключевое_слово]
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Использование: node analyze_screenshots_ocr.js <имя_файла> [ключевое_слово1,ключевое_слово2,...]');
    process.exit(0);
  }
  const file = args[0];
  const keywords = args[1] ? args[1].split(',') : [];
  analyzeScreenshotUniversal(file, keywords);
} 