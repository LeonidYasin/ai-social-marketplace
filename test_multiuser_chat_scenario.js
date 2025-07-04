const puppeteer = require('puppeteer');
const {
    clickVisibleButtonByText,
    getProfileUserName
} = require('./puppeteer_helpers');

async function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMultiuserChatScenario() {
    const browser1 = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 900 } });
    const browser2 = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 900 } });
    const page1 = await browser1.newPage();
    const page2 = await browser2.newPage();
    const baseUrl = 'http://localhost:3000';
    let userName1 = '', userName2 = '';
    try {
        // 1. Открыть главную страницу двумя гостями
        await page1.goto(baseUrl);
        await page2.goto(baseUrl);
        await pause(2000);
        await pause(2000);

        // 2. Кликнуть "Продолжить как гость" в обоих браузерах
        await clickVisibleButtonByText(page1, 'Продолжить как гость');
        await clickVisibleButtonByText(page2, 'Продолжить как гость');
        await pause(2000);
        await pause(2000);

        // 3. Получить имя пользователя в профиле каждого гостя
        await clickVisibleButtonByText(page1, 'профиль');
        await pause(1000);
        userName1 = await getProfileUserName(page1);
        await clickVisibleButtonByText(page2, 'профиль');
        await pause(1000);
        userName2 = await getProfileUserName(page2);
        console.log('User1:', userName1, 'User2:', userName2);

        // 4. Проверить наличие этих имён в правой панели пользователей (page1)
        const usersPanelText1 = await page1.evaluate(() => document.body.innerText);
        if (!usersPanelText1.includes(userName2)) throw new Error('User2 not found in User1 panel');
        // Аналогично для page2
        const usersPanelText2 = await page2.evaluate(() => document.body.innerText);
        if (!usersPanelText2.includes(userName1)) throw new Error('User1 not found in User2 panel');

        // 5. Клик по имени второго пользователя в правой панели (page1)
        await clickVisibleButtonByText(page1, userName2);
        await pause(1000);

        // 6. Проверить открытие окна диалога (ищем поле для ввода сообщения)
        const chatInput1 = await page1.$('input, textarea');
        if (!chatInput1) throw new Error('Chat input not found for User1');

        // 7. Отправить сообщение второму пользователю
        const testMsg1 = 'Привет от первого гостя!';
        await chatInput1.type(testMsg1);
        await clickVisibleButtonByText(page1, 'отправить');
        await pause(1500);

        // 8. Проверить получение сообщения вторым пользователем
        await pause(2000);
        const chatText2 = await page2.evaluate(() => document.body.innerText);
        if (!chatText2.includes(testMsg1)) throw new Error('User2 did not receive message');

        // 9. Ответ вторым пользователем первому
        const chatInput2 = await page2.$('input, textarea');
        if (!chatInput2) throw new Error('Chat input not found for User2');
        const testMsg2 = 'Ответ от второго гостя!';
        await chatInput2.type(testMsg2);
        await clickVisibleButtonByText(page2, 'отправить');
        await pause(1500);

        // 10. Проверить получение сообщения первым пользователем
        await pause(2000);
        const chatText1 = await page1.evaluate(() => document.body.innerText);
        if (!chatText1.includes(testMsg2)) throw new Error('User1 did not receive reply');

        console.log('✅ Многопользовательский чат-сценарий успешно пройден!');
    } catch (e) {
        console.error('❌ Ошибка в сценарии:', e.message);
        await page1.screenshot({ path: 'multiuser_error_user1.png', fullPage: true });
        await page2.screenshot({ path: 'multiuser_error_user2.png', fullPage: true });
    } finally {
        await browser1.close();
        await browser2.close();
    }
}

if (require.main === module) {
    runMultiuserChatScenario();
} 