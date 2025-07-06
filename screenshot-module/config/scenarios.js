module.exports = {
  // Сценарии состояний приложения
  states: [
    {
      name: '01_initial_page',
      action: 'navigateToMain',
      folder: 'states',
      description: 'Начальная страница приложения',
      priority: 'high'
    },
    {
      name: '02_guest_mode',
      action: 'clickGuestLogin',
      folder: 'states',
      description: 'Гостевой режим',
      priority: 'high'
    },
    {
      name: '03_login_form',
      action: 'openLoginForm',
      folder: 'states',
      description: 'Форма входа в систему',
      priority: 'high'
    },
    {
      name: '04_main_page',
      action: 'loginAndNavigate',
      folder: 'states',
      description: 'Главная страница после входа',
      priority: 'high'
    },
    {
      name: '05_post_creation',
      action: 'openPostCreation',
      folder: 'states',
      description: 'Создание нового поста',
      priority: 'medium'
    },
    {
      name: '06_menu_open',
      action: 'openMainMenu',
      folder: 'states',
      description: 'Открытое главное меню',
      priority: 'medium'
    },
    {
      name: '07_chat_open',
      action: 'openChat',
      folder: 'states',
      description: 'Открытый чат',
      priority: 'medium'
    },
    {
      name: '08_profile_page',
      action: 'openProfile',
      folder: 'states',
      description: 'Страница профиля пользователя',
      priority: 'medium'
    }
  ],

  // Сценарии компонентов UI
  components: [
    {
      name: '01_appbar',
      action: 'captureAppBar',
      folder: 'components',
      description: 'Верхняя панель навигации',
      priority: 'high'
    },
    {
      name: '02_sidebar_left',
      action: 'captureLeftSidebar',
      folder: 'components',
      description: 'Левая боковая панель',
      priority: 'high'
    },
    {
      name: '03_sidebar_right',
      action: 'captureRightSidebar',
      folder: 'components',
      description: 'Правая боковая панель',
      priority: 'high'
    },
    {
      name: '04_feed',
      action: 'captureFeed',
      folder: 'components',
      description: 'Лента постов',
      priority: 'high'
    },
    {
      name: '05_post_card',
      action: 'capturePostCard',
      folder: 'components',
      description: 'Карточка поста',
      priority: 'medium'
    },
    {
      name: '06_chat_dialog',
      action: 'captureChatDialog',
      folder: 'components',
      description: 'Диалог в чате',
      priority: 'medium'
    },
    {
      name: '07_notifications',
      action: 'captureNotifications',
      folder: 'components',
      description: 'Панель уведомлений',
      priority: 'medium'
    },
    {
      name: '08_search',
      action: 'captureSearch',
      folder: 'components',
      description: 'Форма поиска',
      priority: 'medium'
    }
  ],

  // Сценарии взаимодействий
  interactions: [
    {
      name: '01_before_like',
      action: 'prepareLikeInteraction',
      folder: 'interactions',
      description: 'Состояние до лайка поста',
      priority: 'medium'
    },
    {
      name: '02_after_like',
      action: 'performLikeInteraction',
      folder: 'interactions',
      description: 'Состояние после лайка поста',
      priority: 'medium'
    },
    {
      name: '03_comment_form',
      action: 'openCommentForm',
      folder: 'interactions',
      description: 'Форма добавления комментария',
      priority: 'medium'
    },
    {
      name: '04_share_menu',
      action: 'openShareMenu',
      folder: 'interactions',
      description: 'Меню "Поделиться"',
      priority: 'low'
    },
    {
      name: '05_post_field_focused',
      action: 'focusPostField',
      folder: 'interactions',
      description: 'Поле поста в фокусе',
      priority: 'medium'
    },
    {
      name: '06_post_with_text',
      action: 'fillPostWithText',
      folder: 'interactions',
      description: 'Пост с введенным текстом',
      priority: 'medium'
    }
  ],

  // Мультипользовательские сценарии
  multiuser: [
    {
      name: '01_user1_initial',
      action: 'setupUser1Initial',
      folder: 'multiuser',
      description: 'Пользователь 1 - начальное состояние',
      priority: 'high'
    },
    {
      name: '02_user2_initial',
      action: 'setupUser2Initial',
      folder: 'multiuser',
      description: 'Пользователь 2 - начальное состояние',
      priority: 'high'
    },
    {
      name: '03_user1_post_created',
      action: 'user1CreatesPost',
      folder: 'multiuser',
      description: 'Пользователь 1 создал пост',
      priority: 'medium'
    },
    {
      name: '04_user2_sees_post',
      action: 'user2SeesPost',
      folder: 'multiuser',
      description: 'Пользователь 2 видит пост',
      priority: 'medium'
    },
    {
      name: '05_user2_liked_post',
      action: 'user2LikesPost',
      folder: 'multiuser',
      description: 'Пользователь 2 лайкнул пост',
      priority: 'medium'
    },
    {
      name: '06_user1_sees_like',
      action: 'user1SeesLike',
      folder: 'multiuser',
      description: 'Пользователь 1 видит лайк',
      priority: 'medium'
    }
  ],

  // Сценарии для OCR (отдельные элементы)
  elements: [
    {
      name: 'login_button',
      action: 'captureLoginButton',
      folder: 'elements/buttons',
      description: 'Кнопка "Войти в систему"',
      priority: 'high'
    },
    {
      name: 'guest_button',
      action: 'captureGuestButton',
      folder: 'elements/buttons',
      description: 'Кнопка "Продолжить как гость"',
      priority: 'high'
    },
    {
      name: 'post_input',
      action: 'capturePostInput',
      folder: 'elements/inputs',
      description: 'Поле ввода поста',
      priority: 'high'
    },
    {
      name: 'email_input',
      action: 'captureEmailInput',
      folder: 'elements/inputs',
      description: 'Поле ввода email',
      priority: 'high'
    },
    {
      name: 'password_input',
      action: 'capturePasswordInput',
      folder: 'elements/inputs',
      description: 'Поле ввода пароля',
      priority: 'high'
    },
    {
      name: 'search_input',
      action: 'captureSearchInput',
      folder: 'elements/inputs',
      description: 'Поле поиска',
      priority: 'medium'
    },
    {
      name: 'menu_icon',
      action: 'captureMenuIcon',
      folder: 'elements/icons',
      description: 'Иконка меню',
      priority: 'medium'
    },
    {
      name: 'notification_icon',
      action: 'captureNotificationIcon',
      folder: 'elements/icons',
      description: 'Иконка уведомлений',
      priority: 'medium'
    },
    {
      name: 'like_button',
      action: 'captureLikeButton',
      folder: 'elements/buttons',
      description: 'Кнопка лайка',
      priority: 'medium'
    },
    {
      name: 'send_button',
      action: 'captureSendButton',
      folder: 'elements/buttons',
      description: 'Кнопка отправки',
      priority: 'medium'
    }
  ],

  // Сценарии ошибок
  errors: [
    {
      name: '01_invalid_email',
      action: 'triggerInvalidEmailError',
      folder: 'errors',
      description: 'Ошибка неверного email',
      priority: 'low'
    },
    {
      name: '02_empty_post',
      action: 'triggerEmptyPostError',
      folder: 'errors',
      description: 'Ошибка пустого поста',
      priority: 'low'
    },
    {
      name: '03_network_error',
      action: 'triggerNetworkError',
      folder: 'errors',
      description: 'Ошибка сети',
      priority: 'low'
    }
  ]
}; 