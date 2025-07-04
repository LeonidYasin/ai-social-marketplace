const Tesseract = require('tesseract.js');
const path = require('path');

async function recognizeButtonCoords(imagePath, keyword = 'ПРОДОЛЖИТЬ КАК ГОСТЬ') {
  const { data } = await Tesseract.recognize(imagePath, 'rus+eng', {
    logger: m => m.status === 'recognizing text' && process.stdout.write(`\r${Math.round(m.progress * 100)}%`)
  });

  if (!data.words || !Array.isArray(data.words)) {
    console.log('❌ Координаты не получены: массив words отсутствует.');
    return;
  }

  let found = false;
  for (const word of data.words) {
    if (word.text && keyword.toLowerCase().includes(word.text.toLowerCase())) {
      found = true;
      const b = word.bbox;
      console.log(`Найдено слово "${word.text}" с координатами: x0=${b.x0}, y0=${b.y0}, x1=${b.x1}, y1=${b.y1}`);
    }
  }
  if (!found) {
    console.log(`Текст "${keyword}" не найден среди слов.`);
  }
}

const image = process.argv[2] || 'test_screenshots/step2_simple_01_initial.png';
const keyword = process.argv[3] || 'ПРОДОЛЖИТЬ КАК ГОСТЬ';

recognizeButtonCoords(image, keyword); 