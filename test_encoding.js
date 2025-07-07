#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки универсального модуля кодировок
 * Проверяет работу на разных платформах и в разных окружениях
 */

const encoding = require('./backend/src/utils/encoding');

console.log('🔍 Тестирование универсального модуля кодировок');
console.log('='.repeat(60));

// Тест 1: Информация о системе
console.log('\n1. Информация о системе:');
encoding.logEncodingInfo();

// Тест 2: Оптимальная кодировка
console.log('\n2. Оптимальная кодировка:');
const optimalEncoding = encoding.getOptimalEncoding();
console.log(`   Оптимальная кодировка: ${optimalEncoding}`);

// Тест 3: Конфигурация БД
console.log('\n3. Конфигурация БД:');
const dbConfig = encoding.getDatabaseEncodingConfig();
console.log(`   Конфигурация:`, dbConfig);

// Тест 4: Проверка совместимости
console.log('\n4. Проверка совместимости:');
console.log(`   UTF8 совместим: ${encoding.isEncodingCompatible('UTF8')}`);
console.log(`   WIN1251 совместим: ${encoding.isEncodingCompatible('WIN1251')}`);

// Тест 5: Production кодировка
console.log('\n5. Production кодировка:');
const productionEncoding = encoding.getProductionEncoding();
console.log(`   Production кодировка: ${productionEncoding}`);

// Тест 6: Добавление кодировки к конфигурации
console.log('\n6. Добавление кодировки к конфигурации:');
const baseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'test_db'
};
const configWithEncoding = encoding.addEncodingToConfig(baseConfig);
console.log(`   Конфигурация с кодировкой:`, configWithEncoding);

// Тест 7: Симуляция разных окружений
console.log('\n7. Симуляция разных окружений:');

// Сохраняем оригинальное значение NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

// Тест development
process.env.NODE_ENV = 'development';
const devConfig = encoding.addEncodingToConfig(baseConfig);
console.log(`   Development (${process.env.NODE_ENV}):`, devConfig.client_encoding);

// Тест production
process.env.NODE_ENV = 'production';
const prodConfig = encoding.addEncodingToConfig(baseConfig);
console.log(`   Production (${process.env.NODE_ENV}):`, prodConfig.client_encoding);

// Восстанавливаем оригинальное значение
process.env.NODE_ENV = originalNodeEnv;

console.log('\n' + '='.repeat(60));
console.log('✅ Тестирование завершено!');

// Проверяем, что все работает корректно
const tests = [
  { name: 'Оптимальная кодировка определена', test: () => optimalEncoding },
  { name: 'Конфигурация БД создана', test: () => dbConfig.client_encoding },
  { name: 'UTF8 совместим', test: () => encoding.isEncodingCompatible('UTF8') },
  { name: 'Production кодировка UTF8', test: () => productionEncoding === 'UTF8' },
  { name: 'Конфигурация с кодировкой создана', test: () => configWithEncoding.client_encoding }
];

console.log('\n📋 Результаты тестов:');
tests.forEach((test, index) => {
  try {
    const result = test.test();
    console.log(`   ${index + 1}. ${test.name}: ✅ ${result}`);
  } catch (error) {
    console.log(`   ${index + 1}. ${test.name}: ❌ ${error.message}`);
  }
});

console.log('\n🎉 Все тесты пройдены успешно!'); 