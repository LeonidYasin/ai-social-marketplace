import React from 'react';
import logger from '../services/logging';

const LoggingTest = () => {
  const testLogging = () => {
    logger.info('Test info message', { test: true, timestamp: Date.now() });
    logger.warn('Test warning message', { test: true, timestamp: Date.now() });
    logger.error('Test error message', { test: true, timestamp: Date.now() });
    logger.debug('Test debug message', { test: true, timestamp: Date.now() });
    
    // Тестируем логирование пользовательских действий
    logger.logUserAction('test_button_clicked', { buttonId: 'test-btn' });
    
    // Тестируем логирование производительности
    logger.logPerformance('test_metric', 123.45);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Frontend Logging Test</h3>
      <button onClick={testLogging} style={{ padding: '10px 20px' }}>
        Test Logging
      </button>
      <p>Click the button to test frontend logging functionality</p>
    </div>
  );
};

export default LoggingTest;
