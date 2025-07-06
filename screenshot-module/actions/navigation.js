const { delay, clickButtonByText, fillInput, waitForElement } = require('./utils');

// Переход на главную страницу
async function navigateToMain(page) {
    console.log('🌐 Переход на главную страницу...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await delay(3000);
}

// Клик на "Продолжить как гость"
async function clickGuestLogin(page, takeScreenshot) {
    await clickButtonByText(page, 'Продолжить как гость', 'Кнопка "Продолжить как гость"');
    await takeScreenshot('02_guest_mode', 'Гостевой режим');
    await delay(2000);
}

// Открытие формы входа
async function openLoginForm(page, takeScreenshot) {
    await clickButtonByText(page, 'Войти в систему', 'Кнопка "Войти в систему"');
    await delay(2000);
    await takeScreenshot('03_login_form', 'Форма входа в систему');
}

// Вход в систему и переход на главную
async function loginAndNavigate(page, takeScreenshot) {
    // Заполняем форму входа
    const emailInput = await page.$('input[placeholder*="email"], input[placeholder*="Email"], input[type="email"]');
    const passwordInput = await page.$('input[placeholder*="пароль"], input[placeholder*="password"], input[type="password"]');
    
    if (emailInput) await emailInput.type('test@example.com');
    if (passwordInput) await passwordInput.type('password123');
    
    await takeScreenshot('04_login_form_filled', 'Форма входа заполнена');
    
    // Нажимаем кнопку входа
    await clickButtonByText(page, 'Войти', 'Кнопка "Войти"');
    await clickButtonByText(page, 'Login', 'Кнопка "Login"');
    
    await delay(3000);
    await takeScreenshot('04_main_page', 'Главная страница после входа');
}

// Открытие создания поста
async function openPostCreation(page, takeScreenshot) {
    await clickButtonByText(page, 'Что у вас нового?', 'Поле создания поста');
    await delay(2000);
    await takeScreenshot('05_post_creation', 'Создание нового поста');
}

// Открытие главного меню
async function openMainMenu(page, takeScreenshot) {
    const menuButton = await page.$('button[aria-label*="меню"], button[aria-label*="menu"], .MuiIconButton-root');
    if (menuButton) {
        await menuButton.click();
        await delay(2000);
        await takeScreenshot('06_menu_open', 'Открытое главное меню');
    }
}

// Открытие чата
async function openChat(page, takeScreenshot) {
    await clickButtonByText(page, 'Чаты', 'Вкладка "Чаты"');
    await delay(2000);
    await takeScreenshot('07_chat_open', 'Открытый чат');
}

// Открытие профиля
async function openProfile(page, takeScreenshot) {
    const avatar = await page.$('.MuiAvatar-root, img[alt*="avatar"], img[alt*="profile"]');
    if (avatar) {
        await avatar.click();
        await delay(2000);
        await takeScreenshot('08_profile_page', 'Страница профиля пользователя');
    }
}

// Настройка начального состояния пользователя 1
async function setupUser1Initial(page, takeScreenshot) {
    await navigateToMain(page);
    await clickGuestLogin(page, takeScreenshot);
    await takeScreenshot('01_user1_initial', 'Пользователь 1 - начальное состояние');
}

// Настройка начального состояния пользователя 2
async function setupUser2Initial(page, takeScreenshot) {
    await navigateToMain(page);
    await clickGuestLogin(page, takeScreenshot);
    await takeScreenshot('02_user2_initial', 'Пользователь 2 - начальное состояние');
}

// Пользователь 1 создает пост
async function user1CreatesPost(page, takeScreenshot) {
    await openPostCreation(page, takeScreenshot);
    
    const postInput = await page.$('input[placeholder*="нового"], textarea[placeholder*="нового"], .MuiInputBase-input');
    if (postInput) {
        await postInput.type('Тестовый пост от пользователя 1');
        await takeScreenshot('03_user1_post_filled', 'Пост заполнен пользователем 1');
        
        await clickButtonByText(page, 'Отправить', 'Кнопка "Отправить"');
        await delay(3000);
        await takeScreenshot('03_user1_post_created', 'Пользователь 1 создал пост');
    }
}

// Пользователь 2 видит пост
async function user2SeesPost(page, takeScreenshot) {
    await delay(2000); // Ждем обновления ленты
    await takeScreenshot('04_user2_sees_post', 'Пользователь 2 видит пост');
}

// Пользователь 2 лайкает пост
async function user2LikesPost(page, takeScreenshot) {
    const likeButton = await page.$('button[aria-label*="лайк"], button[aria-label*="like"], .MuiIconButton-root');
    if (likeButton) {
        await likeButton.click();
        await delay(1000);
        await takeScreenshot('05_user2_liked_post', 'Пользователь 2 лайкнул пост');
    }
}

// Пользователь 1 видит лайк
async function user1SeesLike(page, takeScreenshot) {
    await delay(2000); // Ждем синхронизации
    await takeScreenshot('06_user1_sees_like', 'Пользователь 1 видит лайк');
}

module.exports = {
    navigateToMain,
    clickGuestLogin,
    openLoginForm,
    loginAndNavigate,
    openPostCreation,
    openMainMenu,
    openChat,
    openProfile,
    setupUser1Initial,
    setupUser2Initial,
    user1CreatesPost,
    user2SeesPost,
    user2LikesPost,
    user1SeesLike
}; 