const { delay, clickButtonByText, fillInput, waitForElement, screenshotElement } = require('./utils');

// Захват верхней панели
async function captureAppBar(page, takeScreenshot) {
    await takeScreenshot('01_appbar', 'Верхняя панель навигации');
}

// Захват левой боковой панели
async function captureLeftSidebar(page, takeScreenshot) {
    await takeScreenshot('02_sidebar_left', 'Левая боковая панель');
}

// Захват правой боковой панели
async function captureRightSidebar(page, takeScreenshot) {
    await takeScreenshot('03_sidebar_right', 'Правая боковая панель');
}

// Захват ленты постов
async function captureFeed(page, takeScreenshot) {
    await takeScreenshot('04_feed', 'Лента постов');
}

// Захват карточки поста
async function capturePostCard(page, takeScreenshot) {
    const postCard = await page.$('.MuiCard-root, [data-testid="post-card"], .post-card');
    if (postCard) {
        await postCard.screenshot({ path: 'documentation_screenshots/components/05_post_card.png' });
        console.log('📸 Скриншот: 05_post_card.png - Карточка поста');
    }
}

// Захват диалога чата
async function captureChatDialog(page, takeScreenshot) {
    await takeScreenshot('06_chat_dialog', 'Диалог в чате');
}

// Захват уведомлений
async function captureNotifications(page, takeScreenshot) {
    const notificationButton = await page.$('button[aria-label*="уведомление"], button[aria-label*="notification"]');
    if (notificationButton) {
        await notificationButton.click();
        await delay(2000);
        await takeScreenshot('07_notifications', 'Панель уведомлений');
    }
}

// Захват поиска
async function captureSearch(page, takeScreenshot) {
    const searchInput = await page.$('input[placeholder*="Поиск"], input[placeholder*="Search"]');
    if (searchInput) {
        await searchInput.click();
        await delay(1000);
        await takeScreenshot('08_search', 'Форма поиска');
    }
}

// Подготовка к лайку
async function prepareLikeInteraction(page, takeScreenshot) {
    await takeScreenshot('01_before_like', 'Состояние до лайка поста');
}

// Выполнение лайка
async function performLikeInteraction(page, takeScreenshot) {
    const likeButton = await page.$('button[aria-label*="лайк"], button[aria-label*="like"]');
    if (likeButton) {
        await likeButton.click();
        await delay(1000);
        await takeScreenshot('02_after_like', 'Состояние после лайка поста');
    }
}

// Открытие формы комментария
async function openCommentForm(page, takeScreenshot) {
    const commentButton = await page.$('button[aria-label*="комментарий"], button[aria-label*="comment"]');
    if (commentButton) {
        await commentButton.click();
        await delay(1000);
        await takeScreenshot('03_comment_form', 'Форма добавления комментария');
    }
}

// Открытие меню "Поделиться"
async function openShareMenu(page, takeScreenshot) {
    const shareButton = await page.$('button[aria-label*="поделиться"], button[aria-label*="share"]');
    if (shareButton) {
        await shareButton.click();
        await delay(1000);
        await takeScreenshot('04_share_menu', 'Меню "Поделиться"');
    }
}

// Фокус на поле поста
async function focusPostField(page, takeScreenshot) {
    const postInput = await page.$('input[placeholder*="нового"], textarea[placeholder*="нового"]');
    if (postInput) {
        await postInput.click();
        await delay(500);
        await takeScreenshot('05_post_field_focused', 'Поле поста в фокусе');
    }
}

// Заполнение поста текстом
async function fillPostWithText(page, takeScreenshot) {
    const postInput = await page.$('input[placeholder*="нового"], textarea[placeholder*="нового"]');
    if (postInput) {
        await postInput.type('Это тестовый пост для документации');
        await delay(500);
        await takeScreenshot('06_post_with_text', 'Пост с введенным текстом');
    }
}

// Захват кнопки входа
async function captureLoginButton(page, takeScreenshot) {
    const loginButton = await page.$('button:has-text("Войти в систему"), button:has-text("Login")');
    if (loginButton) {
        await loginButton.screenshot({ path: 'documentation_screenshots/elements/buttons/login_button.png' });
        console.log('📸 Скриншот: login_button.png - Кнопка "Войти в систему"');
    }
}

// Захват кнопки гостя
async function captureGuestButton(page, takeScreenshot) {
    const guestButton = await page.$('button:has-text("Продолжить как гость")');
    if (guestButton) {
        await guestButton.screenshot({ path: 'documentation_screenshots/elements/buttons/guest_button.png' });
        console.log('📸 Скриншот: guest_button.png - Кнопка "Продолжить как гость"');
    }
}

// Захват поля ввода поста
async function capturePostInput(page, takeScreenshot) {
    const postInput = await page.$('input[placeholder*="нового"], textarea[placeholder*="нового"]');
    if (postInput) {
        await postInput.screenshot({ path: 'documentation_screenshots/elements/inputs/post_input.png' });
        console.log('📸 Скриншот: post_input.png - Поле ввода поста');
    }
}

// Захват поля email
async function captureEmailInput(page, takeScreenshot) {
    const emailInput = await page.$('input[placeholder*="email"], input[type="email"]');
    if (emailInput) {
        await emailInput.screenshot({ path: 'documentation_screenshots/elements/inputs/email_input.png' });
        console.log('📸 Скриншот: email_input.png - Поле ввода email');
    }
}

// Захват поля пароля
async function capturePasswordInput(page, takeScreenshot) {
    const passwordInput = await page.$('input[placeholder*="пароль"], input[type="password"]');
    if (passwordInput) {
        await passwordInput.screenshot({ path: 'documentation_screenshots/elements/inputs/password_input.png' });
        console.log('📸 Скриншот: password_input.png - Поле ввода пароля');
    }
}

// Захват поля поиска
async function captureSearchInput(page, takeScreenshot) {
    const searchInput = await page.$('input[placeholder*="Поиск"], input[placeholder*="Search"]');
    if (searchInput) {
        await searchInput.screenshot({ path: 'documentation_screenshots/elements/inputs/search_input.png' });
        console.log('📸 Скриншот: search_input.png - Поле поиска');
    }
}

// Захват иконки меню
async function captureMenuIcon(page, takeScreenshot) {
    const menuIcon = await page.$('button[aria-label*="меню"], button[aria-label*="menu"]');
    if (menuIcon) {
        await menuIcon.screenshot({ path: 'documentation_screenshots/elements/icons/menu_icon.png' });
        console.log('📸 Скриншот: menu_icon.png - Иконка меню');
    }
}

// Захват иконки уведомлений
async function captureNotificationIcon(page, takeScreenshot) {
    const notificationIcon = await page.$('button[aria-label*="уведомление"], button[aria-label*="notification"]');
    if (notificationIcon) {
        await notificationIcon.screenshot({ path: 'documentation_screenshots/elements/icons/notification_icon.png' });
        console.log('📸 Скриншот: notification_icon.png - Иконка уведомлений');
    }
}

// Захват кнопки лайка
async function captureLikeButton(page, takeScreenshot) {
    const likeButton = await page.$('button[aria-label*="лайк"], button[aria-label*="like"]');
    if (likeButton) {
        await likeButton.screenshot({ path: 'documentation_screenshots/elements/buttons/like_button.png' });
        console.log('📸 Скриншот: like_button.png - Кнопка лайка');
    }
}

// Захват кнопки отправки
async function captureSendButton(page, takeScreenshot) {
    const sendButton = await page.$('button:has-text("Отправить"), button:has-text("Send")');
    if (sendButton) {
        await sendButton.screenshot({ path: 'documentation_screenshots/elements/buttons/send_button.png' });
        console.log('📸 Скриншот: send_button.png - Кнопка отправки');
    }
}

// Триггер ошибки неверного email
async function triggerInvalidEmailError(page, takeScreenshot) {
    const emailInput = await page.$('input[placeholder*="email"], input[type="email"]');
    if (emailInput) {
        await emailInput.type('invalid-email');
        await delay(500);
        await takeScreenshot('01_invalid_email', 'Ошибка неверного email');
    }
}

// Триггер ошибки пустого поста
async function triggerEmptyPostError(page, takeScreenshot) {
    const postInput = await page.$('input[placeholder*="нового"], textarea[placeholder*="нового"]');
    if (postInput) {
        await postInput.click();
        await clickButtonByText(page, 'Отправить', 'Кнопка "Отправить"');
        await delay(1000);
        await takeScreenshot('02_empty_post', 'Ошибка пустого поста');
    }
}

// Триггер сетевой ошибки (симуляция)
async function triggerNetworkError(page, takeScreenshot) {
    // Симулируем сетевую ошибку
    await page.evaluate(() => {
        // Создаем элемент с ошибкой
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Ошибка сети: не удалось подключиться к серверу';
        errorDiv.style.cssText = 'color: red; padding: 10px; border: 1px solid red; margin: 10px;';
        document.body.appendChild(errorDiv);
    });
    
    await delay(1000);
    await takeScreenshot('03_network_error', 'Ошибка сети');
}

module.exports = {
    // Компоненты
    captureAppBar,
    captureLeftSidebar,
    captureRightSidebar,
    captureFeed,
    capturePostCard,
    captureChatDialog,
    captureNotifications,
    captureSearch,
    
    // Взаимодействия
    prepareLikeInteraction,
    performLikeInteraction,
    openCommentForm,
    openShareMenu,
    focusPostField,
    fillPostWithText,
    
    // Элементы для OCR
    captureLoginButton,
    captureGuestButton,
    capturePostInput,
    captureEmailInput,
    capturePasswordInput,
    captureSearchInput,
    captureMenuIcon,
    captureNotificationIcon,
    captureLikeButton,
    captureSendButton,
    
    // Ошибки
    triggerInvalidEmailError,
    triggerEmptyPostError,
    triggerNetworkError
}; 