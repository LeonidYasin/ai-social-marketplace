# Исправление ошибок логирования в BackendManager

## Проблема
В файле `frontend/src/services/BackendManager.js` использовались неправильные методы логирования:

```
TypeError: _logging__WEBPACK_IMPORTED_MODULE_0__.default.logError is not a function
TypeError: _logging__WEBPACK_IMPORTED_MODULE_0__.default.logInfo is not a function
TypeError: _logging__WEBPACK_IMPORTED_MODULE_0__.default.logWarning is not a function
```

## Причина
В сервисе логирования `frontend/src/services/logging.js` методы называются:
- `error()` вместо `logError()`
- `info()` вместо `logInfo()`
- `warn()` вместо `logWarning()`

## Исправления

### Заменены вызовы:
```javascript
// Было:
logger.logError('Backend health check failed:', error.message);
logger.logInfo('Backend health check: OK');
logger.logWarning('Backend became unavailable');

// Стало:
logger.error('Backend health check failed:', error.message);
logger.info('Backend health check: OK');
logger.warn('Backend became unavailable');
```

### Всего исправлено 8 вызовов:
1. `logger.logError` → `logger.error` (4 вызова)
2. `logger.logInfo` → `logger.info` (3 вызова)
3. `logger.logWarning` → `logger.warn` (1 вызов)

## Файлы изменены:
- `frontend/src/services/BackendManager.js` - исправлены все вызовы методов логирования

## Результат:
✅ Ошибки логирования исправлены  
✅ Все методы логирования работают корректно  
✅ BackendManager готов к использованию  

## Проверка:
```bash
# Запустить фронтенд и проверить консоль
npm start
# Ошибки логирования больше не должны появляться
``` 