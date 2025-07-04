const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function analyzeStep1Screenshot() {
  const screenshotPath = './test_screenshots/step1_01_initial.png';
  
  if (!fs.existsSync(screenshotPath)) {
    console.error('❌ Скриншот не найден:', screenshotPath);
    return;
  }
  
  console.log('🔍 Анализируем скриншот step1_01_initial.png...');
  
  try {
    const { data: { text, words } } = await Tesseract.recognize(screenshotPath, 'rus+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('\n\n📋 Распознанный текст:');
    console.log('='.repeat(50));
    console.log(text);
    console.log('='.repeat(50));
    
    // Ищем кнопки входа
    const loginKeywords = ['Войти', 'Login', 'Sign in', 'Вход', 'Профиль', 'Profile', 'ВОЙТИ В СИСТЕМУ'];
    const foundLoginElements = words ? words.filter(w => 
      loginKeywords.some(keyword => 
        w.text.toLowerCase().includes(keyword.toLowerCase())
      )
    ) : [];
    
    if (foundLoginElements.length > 0) {
      console.log('\n🔘 Найдены элементы входа:');
      foundLoginElements.forEach((element, index) => {
        console.log(`  ${index + 1}. "${element.text}" (уверенность: ${Math.round(element.confidence)}%)`);
      });
    } else {
      console.log('\n❌ Элементы входа не найдены на скриншоте');
      console.log('Возможные причины:');
      console.log('  - Пользователь уже залогинен');
      console.log('  - Кнопка входа не видна на скриншоте');
      console.log('  - Кнопка имеет другой текст');
    }
    
    // Показываем все найденные слова для анализа
    console.log('\n📝 Все найденные слова:');
    if (words) {
      words.slice(0, 20).forEach((word, index) => {
        console.log(`  ${index + 1}. "${word.text}" (уверенность: ${Math.round(word.confidence)}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка анализа:', error.message);
  }
}

analyzeStep1Screenshot(); 