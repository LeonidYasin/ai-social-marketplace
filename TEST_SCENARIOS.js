/**
 * Готовые сценарии тестирования для OCR бота
 */

// Хелпер для паузы
async function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Сценарий 1: Аутентификация через Google OAuth
const authScenario = {
  name: 'Google OAuth Authentication',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Проверка загрузки главной страницы',
      action: async (bot) => {
        await pause(2000);
      },
      expected: 'Войти через Google',
      wait: 1000
    },
    {
      name: 'Клик по кнопке Google OAuth',
      action: async (bot) => {
        await bot.clickText('Войти через Google');
      },
      expected: 'accounts.google.com',
      wait: 2000
    },
    {
      name: 'Заполнение формы Google (требует ручного ввода)',
      action: async (bot) => {
        console.log('⚠️ Требуется ручной ввод данных Google');
        await pause(10000); // Время для ручного ввода
      },
      expected: 'localhost:3000',
      wait: 2000
    },
    {
      name: 'Проверка успешной авторизации',
      action: async (bot) => {
        await pause(2000);
      },
      expected: 'Профиль',
      wait: 1000
    }
  ]
};

// Сценарий 2: Создание поста
const createPostScenario = {
  name: 'Create Post',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки ленты',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Создать пост',
      wait: 1000
    },
    {
      name: 'Поиск формы создания поста',
      action: async (bot) => {
        await bot.waitForElement('Создать пост');
      },
      expected: 'Создать пост',
      wait: 1000
    },
    {
      name: 'Клик по форме создания поста',
      action: async (bot) => {
        await bot.clickText('Создать пост');
      },
      expected: 'Опубликовать',
      wait: 1000
    },
    {
      name: 'Ввод текста поста',
      action: async (bot) => {
        await bot.typeText('пост', 'Тестовый пост от OCR бота - ' + new Date().toLocaleString());
      },
      expected: 'Тестовый пост от OCR бота',
      wait: 1000
    },
    {
      name: 'Публикация поста',
      action: async (bot) => {
        await bot.clickText('Опубликовать');
      },
      expected: 'Тестовый пост от OCR бота',
      wait: 2000
    },
    {
      name: 'Проверка отображения поста в ленте',
      action: async (bot) => {
        await pause(2000);
      },
      expected: 'Тестовый пост от OCR бота',
      wait: 1000
    }
  ]
};

// Сценарий 3: Добавление реакции на пост
const reactionScenario = {
  name: 'Add Reaction to Post',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки ленты',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Нравится',
      wait: 1000
    },
    {
      name: 'Поиск кнопки лайка',
      action: async (bot) => {
        await bot.waitForElement('Нравится');
      },
      expected: 'Нравится',
      wait: 1000
    },
    {
      name: 'Клик по кнопке лайка',
      action: async (bot) => {
        await bot.clickText('Нравится');
      },
      expected: '1',
      wait: 2000
    },
    {
      name: 'Проверка обновления счетчика',
      action: async (bot) => {
        await pause(1000);
      },
      expected: '1',
      wait: 1000
    }
  ]
};

// Сценарий 4: Добавление комментария
const commentScenario = {
  name: 'Add Comment to Post',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки ленты',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Комментировать',
      wait: 1000
    },
    {
      name: 'Поиск кнопки комментария',
      action: async (bot) => {
        await bot.waitForElement('Комментировать');
      },
      expected: 'Комментировать',
      wait: 1000
    },
    {
      name: 'Клик по кнопке комментария',
      action: async (bot) => {
        await bot.clickText('Комментировать');
      },
      expected: 'Отправить',
      wait: 1000
    },
    {
      name: 'Ввод текста комментария',
      action: async (bot) => {
        await bot.typeText('комментарий', 'Отличный пост! Комментарий от OCR бота');
      },
      expected: 'Отличный пост! Комментарий от OCR бота',
      wait: 1000
    },
    {
      name: 'Отправка комментария',
      action: async (bot) => {
        await bot.clickText('Отправить');
      },
      expected: 'Отличный пост! Комментарий от OCR бота',
      wait: 2000
    },
    {
      name: 'Проверка отображения комментария',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'Отличный пост! Комментарий от OCR бота',
      wait: 1000
    }
  ]
};

// Сценарий 5: Открытие чата
const chatScenario = {
  name: 'Open Chat',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Чат',
      wait: 1000
    },
    {
      name: 'Поиск кнопки чата',
      action: async (bot) => {
        await bot.waitForElement('Чат');
      },
      expected: 'Чат',
      wait: 1000
    },
    {
      name: 'Клик по кнопке чата',
      action: async (bot) => {
        await bot.clickText('Чат');
      },
      expected: 'онлайн',
      wait: 2000
    },
    {
      name: 'Проверка открытия чата',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'онлайн',
      wait: 1000
    }
  ]
};

// Сценарий 6: Отправка сообщения в чат
const sendMessageScenario = {
  name: 'Send Message in Chat',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Открытие чата',
      action: async (bot) => {
        await pause(3000);
        await bot.clickText('Чат');
        await pause(2000);
      },
      expected: 'онлайн',
      wait: 1000
    },
    {
      name: 'Поиск пользователя в списке',
      action: async (bot) => {
        await bot.waitForElement('пользователь');
      },
      expected: 'пользователь',
      wait: 1000
    },
    {
      name: 'Клик по пользователю',
      action: async (bot) => {
        await bot.clickText('пользователь');
      },
      expected: 'Отправить',
      wait: 2000
    },
    {
      name: 'Ввод сообщения',
      action: async (bot) => {
        await bot.typeText('сообщение', 'Привет! Сообщение от OCR бота');
      },
      expected: 'Привет! Сообщение от OCR бота',
      wait: 1000
    },
    {
      name: 'Отправка сообщения',
      action: async (bot) => {
        await bot.clickText('Отправить');
      },
      expected: 'Привет! Сообщение от OCR бота',
      wait: 2000
    },
    {
      name: 'Проверка отправки сообщения',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'Привет! Сообщение от OCR бота',
      wait: 1000
    }
  ]
};

// Сценарий 7: Поиск
const searchScenario = {
  name: 'Search Functionality',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Поиск',
      wait: 1000
    },
    {
      name: 'Поиск кнопки поиска',
      action: async (bot) => {
        await bot.waitForElement('Поиск');
      },
      expected: 'Поиск',
      wait: 1000
    },
    {
      name: 'Клик по кнопке поиска',
      action: async (bot) => {
        await bot.clickText('Поиск');
      },
      expected: 'Результаты',
      wait: 2000
    },
    {
      name: 'Ввод поискового запроса',
      action: async (bot) => {
        await bot.typeText('поиск', 'тест');
      },
      expected: 'тест',
      wait: 1000
    },
    {
      name: 'Проверка результатов поиска',
      action: async (bot) => {
        await pause(2000);
      },
      expected: 'Результаты',
      wait: 1000
    }
  ]
};

// Сценарий 8: Открытие аналитики
const analyticsScenario = {
  name: 'Open Analytics',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Аналитика',
      wait: 1000
    },
    {
      name: 'Поиск кнопки аналитики',
      action: async (bot) => {
        await bot.waitForElement('Аналитика');
      },
      expected: 'Аналитика',
      wait: 1000
    },
    {
      name: 'Клик по кнопке аналитики',
      action: async (bot) => {
        await bot.clickText('Аналитика');
      },
      expected: 'Статистика',
      wait: 2000
    },
    {
      name: 'Проверка открытия аналитики',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'Статистика',
      wait: 1000
    }
  ]
};

// Сценарий 9: Открытие уведомлений
const notificationsScenario = {
  name: 'Open Notifications',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Уведомления',
      wait: 1000
    },
    {
      name: 'Поиск кнопки уведомлений',
      action: async (bot) => {
        await bot.waitForElement('Уведомления');
      },
      expected: 'Уведомления',
      wait: 1000
    },
    {
      name: 'Клик по кнопке уведомлений',
      action: async (bot) => {
        await bot.clickText('Уведомления');
      },
      expected: 'список',
      wait: 2000
    },
    {
      name: 'Проверка открытия уведомлений',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'список',
      wait: 1000
    }
  ]
};

// Сценарий 10: Открытие настроек
const settingsScenario = {
  name: 'Open Settings',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Настройки',
      wait: 1000
    },
    {
      name: 'Поиск кнопки настроек',
      action: async (bot) => {
        await bot.waitForElement('Настройки');
      },
      expected: 'Настройки',
      wait: 1000
    },
    {
      name: 'Клик по кнопке настроек',
      action: async (bot) => {
        await bot.clickText('Настройки');
      },
      expected: 'Профиль',
      wait: 2000
    },
    {
      name: 'Проверка открытия настроек',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'Профиль',
      wait: 1000
    }
  ]
};

// Сценарий 11: Сложный многопользовательский сценарий - Создание и взаимодействие с постами
const complexMultiuserScenario = {
  name: 'Complex Multi-User Post Interaction',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Создать пост',
      wait: 1000
    },
    {
      name: 'Создание первого поста',
      action: async (bot) => {
        await bot.clickText('Создать пост');
        await pause(1000);
        await bot.typeText('пост', 'Первый пост для многопользовательского тестирования - ' + new Date().toLocaleString());
        await bot.clickText('Опубликовать');
        await pause(2000);
      },
      expected: 'Первый пост для многопользовательского тестирования',
      wait: 1000
    },
    {
      name: 'Создание второго поста',
      action: async (bot) => {
        await bot.clickText('Создать пост');
        await pause(1000);
        await bot.typeText('пост', 'Второй пост для тестирования взаимодействий - ' + new Date().toLocaleString());
        await bot.clickText('Опубликовать');
        await pause(2000);
      },
      expected: 'Второй пост для тестирования взаимодействий',
      wait: 1000
    },
    {
      name: 'Добавление лайка к первому посту',
      action: async (bot) => {
        await bot.clickText('Нравится');
        await pause(1000);
      },
      expected: '1',
      wait: 1000
    },
    {
      name: 'Добавление комментария ко второму посту',
      action: async (bot) => {
        await bot.clickText('Комментировать');
        await pause(1000);
        await bot.typeText('комментарий', 'Отличный пост! Комментарий от многопользовательского теста');
        await bot.clickText('Отправить');
        await pause(2000);
      },
      expected: 'Отличный пост! Комментарий от многопользовательского теста',
      wait: 1000
    }
  ]
};

// Сценарий 12: Многопользовательский чат
const multiuserChatScenario = {
  name: 'Multi-User Chat Interaction',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Открытие чата',
      action: async (bot) => {
        await pause(3000);
        await bot.clickText('Чат');
        await pause(2000);
      },
      expected: 'онлайн',
      wait: 1000
    },
    {
      name: 'Проверка списка онлайн пользователей',
      action: async (bot) => {
        await bot.waitForElement('пользователь');
      },
      expected: 'пользователь',
      wait: 1000
    },
    {
      name: 'Отправка первого сообщения',
      action: async (bot) => {
        await bot.clickText('пользователь');
        await pause(1000);
        await bot.typeText('сообщение', 'Привет! Первое сообщение от многопользовательского теста');
        await bot.clickText('Отправить');
        await pause(2000);
      },
      expected: 'Привет! Первое сообщение от многопользовательского теста',
      wait: 1000
    },
    {
      name: 'Отправка второго сообщения',
      action: async (bot) => {
        await bot.typeText('сообщение', 'Как дела? Второе сообщение от теста');
        await bot.clickText('Отправить');
        await pause(2000);
      },
      expected: 'Как дела? Второе сообщение от теста',
      wait: 1000
    },
    {
      name: 'Проверка истории сообщений',
      action: async (bot) => {
        await pause(1000);
      },
      expected: 'Привет! Первое сообщение от многопользовательского теста',
      wait: 1000
    }
  ]
};

// Сценарий 13: Полный цикл взаимодействия
const fullInteractionScenario = {
  name: 'Full User Interaction Cycle',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Начальная загрузка',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'Создать пост',
      wait: 1000
    },
    {
      name: 'Создание поста',
      action: async (bot) => {
        await bot.clickText('Создать пост');
        await pause(1000);
        await bot.typeText('пост', 'Полный цикл взаимодействия - ' + new Date().toLocaleString());
        await bot.clickText('Опубликовать');
        await pause(2000);
      },
      expected: 'Полный цикл взаимодействия',
      wait: 1000
    },
    {
      name: 'Добавление лайка',
      action: async (bot) => {
        await bot.clickText('Нравится');
        await pause(1000);
      },
      expected: '1',
      wait: 1000
    },
    {
      name: 'Добавление комментария',
      action: async (bot) => {
        await bot.clickText('Комментировать');
        await pause(1000);
        await bot.typeText('комментарий', 'Отличный пост! Полный цикл тестирования');
        await bot.clickText('Отправить');
        await pause(2000);
      },
      expected: 'Отличный пост! Полный цикл тестирования',
      wait: 1000
    },
    {
      name: 'Открытие чата',
      action: async (bot) => {
        await bot.clickText('Чат');
        await pause(2000);
      },
      expected: 'онлайн',
      wait: 1000
    },
    {
      name: 'Отправка сообщения в чат',
      action: async (bot) => {
        await bot.clickText('пользователь');
        await pause(1000);
        await bot.typeText('сообщение', 'Сообщение из полного цикла тестирования');
        await bot.clickText('Отправить');
        await pause(2000);
      },
      expected: 'Сообщение из полного цикла тестирования',
      wait: 1000
    },
    {
      name: 'Проверка поиска',
      action: async (bot) => {
        await bot.clickText('Поиск');
        await pause(1000);
        await bot.typeText('поиск', 'цикл');
        await pause(2000);
      },
      expected: 'цикл',
      wait: 1000
    }
  ]
};

// Сценарий 14: Тестирование уведомлений
const notificationTestScenario = {
  name: 'Notification Testing',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Создание поста для генерации уведомлений',
      action: async (bot) => {
        await pause(3000);
        await bot.clickText('Создать пост');
        await pause(1000);
        await bot.typeText('пост', 'Пост для тестирования уведомлений - ' + new Date().toLocaleString());
        await bot.clickText('Опубликовать');
        await pause(2000);
      },
      expected: 'Пост для тестирования уведомлений',
      wait: 1000
    },
    {
      name: 'Добавление лайка для уведомления',
      action: async (bot) => {
        await bot.clickText('Нравится');
        await pause(1000);
      },
      expected: '1',
      wait: 1000
    },
    {
      name: 'Проверка уведомлений',
      action: async (bot) => {
        await bot.clickText('Уведомления');
        await pause(2000);
      },
      expected: 'список',
      wait: 1000
    }
  ]
};

// Многопользовательский сценарий (базовый)
const multiuserScenario = {
  name: 'Multi-User Basic Interaction',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Ожидание загрузки страницы',
      action: async (bot) => {
        await pause(3000);
      },
      expected: 'онлайн',
      wait: 1000
    },
    {
      name: 'Проверка списка онлайн пользователей',
      action: async (bot) => {
        await bot.waitForElement('онлайн');
      },
      expected: 'онлайн',
      wait: 1000
    },
    {
      name: 'Создание поста для взаимодействия',
      action: async (bot) => {
        await bot.clickText('Создать пост');
        await pause(1000);
        await bot.typeText('пост', 'Пост для многопользовательского тестирования');
        await bot.clickText('Опубликовать');
        await pause(2000);
      },
      expected: 'Пост для многопользовательского тестирования',
      wait: 1000
    }
  ]
};

// Экспорт всех сценариев
module.exports = {
  authScenario,
  createPostScenario,
  reactionScenario,
  commentScenario,
  chatScenario,
  sendMessageScenario,
  searchScenario,
  analyticsScenario,
  notificationsScenario,
  settingsScenario,
  multiuserScenario,
  complexMultiuserScenario,
  multiuserChatScenario,
  fullInteractionScenario,
  notificationTestScenario,
  
  // Группы сценариев
  basicScenarios: [
    authScenario,
    createPostScenario,
    reactionScenario,
    commentScenario
  ],
  
  advancedScenarios: [
    chatScenario,
    sendMessageScenario,
    searchScenario,
    analyticsScenario,
    notificationsScenario,
    settingsScenario
  ],
  
  multiuserScenarios: [
    multiuserScenario,
    complexMultiuserScenario,
    multiuserChatScenario,
    fullInteractionScenario,
    notificationTestScenario
  ],
  
  allScenarios: [
    authScenario,
    createPostScenario,
    reactionScenario,
    commentScenario,
    chatScenario,
    sendMessageScenario,
    searchScenario,
    analyticsScenario,
    notificationsScenario,
    settingsScenario,
    multiuserScenario,
    complexMultiuserScenario,
    multiuserChatScenario,
    fullInteractionScenario,
    notificationTestScenario
  ]
}; 