const puppeteer = require('puppeteer');

async function testLogoutFunctionality() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Тестирование функциональности выхода из системы...');
    
    // Переходим на главную страницу
    await page.goto('http://localhost:3000');
    console.log('✅ Страница загружена');
    
    // Ждем загрузки приложения
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем, есть ли пользователь в системе
    const currentUser = await page.evaluate(() => {
      return localStorage.getItem('currentUser');
    });
    
    if (!currentUser) {
      console.log('⚠️ Пользователь не авторизован, сначала войдем в систему...');
      
      // Нажимаем на кнопку профиля для входа
      await page.click('[data-testid="profile-button"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Нажимаем "Продолжить как гость"
      const guestButton = await page.$x("//button[contains(text(), 'Продолжить как гость')]");
      if (guestButton.length > 0) {
        await guestButton[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Вошли как гость');
      } else {
        console.log('❌ Кнопка "Продолжить как гость" не найдена');
        return;
      }
    } else {
      console.log('✅ Пользователь уже авторизован');
    }
    
    // Проверяем, что пользователь действительно авторизован
    const userAfterLogin = await page.evaluate(() => {
      return localStorage.getItem('currentUser');
    });
    
    if (!userAfterLogin) {
      console.log('❌ Пользователь не авторизован после попытки входа');
      return;
    }
    
    console.log('✅ Пользователь авторизован:', JSON.parse(userAfterLogin).name);
    
    // Проверяем наличие токена
    const token = await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    
    if (token) {
      console.log('✅ Токен авторизации найден');
    } else {
      console.log('⚠️ Токен авторизации не найден');
    }
    
    // Тест: Выход через настройки профиля
    console.log('\n🔍 Тест: Выход через настройки профиля');
    
    // Открываем настройки профиля
    await page.click('[data-testid="profile-button"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Ищем кнопку "Выйти" в диалоге настроек
    const settingsLogoutButton = await page.$x("//button[contains(text(), 'Выйти')]");
    
    if (settingsLogoutButton.length > 0) {
      console.log('✅ Кнопка "Выйти" найдена в настройках профиля');
      
      // Нажимаем на кнопку выхода
      await settingsLogoutButton[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Проверяем, что появился диалог подтверждения
      const confirmDialog = await page.$x("//div[@role='dialog'][contains(text(), 'Подтверждение выхода')]");
      
      if (confirmDialog.length > 0) {
        console.log('✅ Диалог подтверждения выхода появился');
        
        // Подтверждаем выход
        const confirmButton = await page.$x("//button[contains(text(), 'Выйти')]");
        if (confirmButton.length > 0) {
          await confirmButton[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Проверяем, что пользователь вышел
          const userAfterConfirmLogout = await page.evaluate(() => {
            return localStorage.getItem('currentUser');
          });
          
          const tokenAfterConfirmLogout = await page.evaluate(() => {
            return localStorage.getItem('authToken');
          });
          
          if (!userAfterConfirmLogout && !tokenAfterConfirmLogout) {
            console.log('✅ Выход через настройки выполнен успешно');
          } else {
            console.log('❌ Выход через настройки не выполнен');
          }
        }
      } else {
        console.log('❌ Диалог подтверждения выхода не появился');
      }
    } else {
      console.log('❌ Кнопка "Выйти" не найдена в настройках профиля');
    }
    
    console.log('\n✅ Тестирование завершено');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await browser.close();
  }
}

testLogoutFunctionality(); 