const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function getTextCoordinates(imagePath, searchText = 'ПРОДОЛЖИТЬ КАК ГОСТЬ') {
    return new Promise((resolve, reject) => {
        // Команда для получения TSV с координатами (русский + английский)
        const tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        const command = `${tesseractPath} "${imagePath}" output -l rus+eng tsv`;
        
        console.log(`🔍 Выполняем команду: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Ошибка выполнения tesseract:', error.message);
                console.log('💡 Убедитесь, что Tesseract установлен и доступен в PATH');
                reject(error);
                return;
            }
            
            if (stderr) {
                console.log('⚠️ Предупреждения tesseract:', stderr);
            }
            
            // Читаем результат из файла
            const outputFile = 'output.tsv';
            if (!fs.existsSync(outputFile)) {
                console.error('❌ Файл output.tsv не найден');
                reject(new Error('Output file not found'));
                return;
            }
            
            const content = fs.readFileSync(outputFile, 'utf8');
            const lines = content.trim().split('\n');
            console.log(`📊 Всего строк: ${lines.length}`);
            
            if (lines.length < 2) {
                console.log('❌ Недостаточно данных для анализа');
                resolve([]);
                return;
            }
            
            const headers = lines[0].split('\t');
            console.log(`📋 Заголовки: ${headers.join(', ')}`);
            
            // Выводим весь распознанный текст подряд
            let allText = '';
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split('\t');
                if (values.length >= headers.length) {
                    const text = values[headers.indexOf('text')];
                    if (text && text.trim()) {
                        allText += text + ' ';
                    }
                }
            }
            console.log(`\n📝 Весь распознанный текст подряд:\n${allText}\n`);
            
            // Показываем все найденные слова (без фильтрации по conf)
            console.log('\n📋 Все слова (включая conf<=0 и пустые):');
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split('\t');
                if (values.length >= headers.length) {
                    const text = values[headers.indexOf('text')];
                    const conf = values[headers.indexOf('conf')];
                    const left = values[headers.indexOf('left')];
                    const top = values[headers.indexOf('top')];
                    const width = values[headers.indexOf('width')];
                    const height = values[headers.indexOf('height')];
                    console.log(`  "${text}" - x:${left}, y:${top}, w:${width}, h:${height}, conf:${conf}`);
                }
            }
            
            // Поиск по conf > 0
            const allWords = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split('\t');
                if (values.length >= headers.length) {
                    const text = values[headers.indexOf('text')];
                    const conf = parseFloat(values[headers.indexOf('conf')]);
                    const left = parseInt(values[headers.indexOf('left')]);
                    const top = parseInt(values[headers.indexOf('top')]);
                    const width = parseInt(values[headers.indexOf('width')]);
                    const height = parseInt(values[headers.indexOf('height')]);
                    
                    if (text && text.trim() && conf > 0) {
                        allWords.push({ text, conf, left, top, width, height });
                    }
                }
            }
            
            console.log(`\n📊 Всего слов с conf > 0: ${allWords.length}`);
            
            // Ищем нужный текст
            const found = [];
            for (const word of allWords) {
                if (word.text.toLowerCase().includes(searchText.toLowerCase())) {
                    found.push({
                        text: word.text,
                        confidence: word.conf,
                        x: word.left,
                        y: word.top,
                        width: word.width,
                        height: word.height,
                        bbox: [word.left, word.top, word.left + word.width, word.top + word.height]
                    });
                    
                    console.log(`\n✅ Найдено: "${word.text}"`);
                    console.log(`   Координаты: x=${word.left}, y=${word.top}, w=${word.width}, h=${word.height}`);
                    console.log(`   Уверенность: ${word.conf}%`);
                }
            }
            
            if (found.length === 0) {
                console.log(`\n❌ Текст "${searchText}" не найден`);
                
                // Ищем частичные совпадения
                console.log('\n🔍 Ищем частичные совпадения:');
                const searchWords = searchText.toLowerCase().split(' ');
                const partialMatches = allWords.filter(word => 
                    searchWords.some(searchWord => 
                        word.text.toLowerCase().includes(searchWord) ||
                        searchWord.includes(word.text.toLowerCase())
                    )
                );
                
                if (partialMatches.length > 0) {
                    console.log('Найдены частичные совпадения:');
                    partialMatches.forEach(match => {
                        console.log(`  "${match.text}" - x:${match.left}, y:${match.top}, conf:${match.conf}%`);
                    });
                } else {
                    console.log('Частичные совпадения не найдены');
                }
            }
            
            resolve(found);
        });
    });
}

async function main() {
    const imagePath = process.argv[2] || 'test_screenshots/step2_simple_01_initial.png';
    const searchText = process.argv[3] || 'ПРОДОЛЖИТЬ КАК ГОСТЬ';
    
    console.log(`🚀 Анализируем изображение: ${imagePath}`);
    console.log(`🔍 Ищем текст: "${searchText}"`);
    
    try {
        const coords = await getTextCoordinates(imagePath, searchText);
        console.log(`\n✅ Найдено совпадений: ${coords.length}`);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

main(); 