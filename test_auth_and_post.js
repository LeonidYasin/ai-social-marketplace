const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PostTest {
  constructor() {
    this.baseUrl = 'https://social-marketplace-api.onrender.com';
    this.token = null;
    this.userId = null;
  }

  async testAuth() {
    console.log('🔐 Тестируем авторизацию...');
    
    try {
      // Сначала попробуем гостевой вход
      const guestResponse = await fetch(`${this.baseUrl}/api/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (guestResponse.ok) {
        const guestData = await guestResponse.json();
        this.token = guestData.token;
        this.userId = guestData.user.id;
        console.log('✅ Гостевой вход успешен');
        console.log('👤 Пользователь:', guestData.user.username);
        console.log('🔑 Токен:', this.token.substring(0, 20) + '...');
        return true;
      }

      // Если гостевой вход не работает, попробуем создать пользователя
      console.log('⚠️ Гостевой вход не работает, создаём пользователя...');
      
      const registerResponse = await fetch(`${this.baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: `testuser_${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'testpass123',
          first_name: 'Test',
          last_name: 'User'
        })
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        this.token = registerData.token;
        this.userId = registerData.user.id;
        console.log('✅ Регистрация успешна');
        console.log('👤 Пользователь:', registerData.user.username);
        console.log('🔑 Токен:', this.token.substring(0, 20) + '...');
        return true;
      }

      console.log('❌ Не удалось авторизоваться');
      return false;

    } catch (error) {
      console.error('❌ Ошибка авторизации:', error.message);
      return false;
    }
  }

  async testUpload() {
    console.log('\n📤 Тестируем загрузку файла...');
    
    try {
      // Создаём тестовое изображение
      const testImagePath = path.join(__dirname, 'test-image.png');
      const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(testImagePath, testImageData);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath), {
        filename: 'test-image.png',
        contentType: 'image/png'
      });

      const uploadResponse = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('✅ Файл загружен успешно');
        console.log('📁 Имя файла:', uploadData.filename);
        console.log('🔗 URL:', uploadData.url);
        
        // Удаляем тестовый файл
        fs.unlinkSync(testImagePath);
        
        return uploadData.filename;
      } else {
        const errorData = await uploadResponse.json();
        console.log('❌ Ошибка загрузки файла:', errorData);
        return null;
      }

    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error.message);
      return null;
    }
  }

  async testCreatePost(filename) {
    console.log('\n📝 Тестируем создание поста...');
    
    try {
      const postData = {
        content: 'Тестовый пост с картинкой',
        media_urls: filename ? [filename] : [],
        media_type: filename ? 'image' : null,
        background_color: '#f0f0f0',
        privacy: 'public',
        section: 'general',
        location: null,
        is_ai_generated: false,
        ai_prompt: null
      };

      const postResponse = await fetch(`${this.baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(postData)
      });

      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log('✅ Пост создан успешно');
        console.log('📄 ID поста:', postData.post?.id);
        console.log('🖼️ Медиа файлы:', postData.post?.media_urls);
        return postData.post?.id;
      } else {
        const errorData = await postResponse.json();
        console.log('❌ Ошибка создания поста:', errorData);
        return null;
      }

    } catch (error) {
      console.error('❌ Ошибка создания поста:', error.message);
      return null;
    }
  }

  async testGetPosts() {
    console.log('\n📖 Тестируем получение постов...');
    
    try {
      const postsResponse = await fetch(`${this.baseUrl}/api/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        console.log('✅ Посты получены успешно');
        console.log('📊 Количество постов:', postsData.posts?.length || 0);
        
        if (postsData.posts && postsData.posts.length > 0) {
          const lastPost = postsData.posts[0];
          console.log('📄 Последний пост:', {
            id: lastPost.id,
            content: lastPost.content?.substring(0, 50) + '...',
            media_urls: lastPost.media_urls,
            user: lastPost.username
          });
        }
        
        return postsData.posts;
      } else {
        const errorData = await postsResponse.json();
        console.log('❌ Ошибка получения постов:', errorData);
        return null;
      }

    } catch (error) {
      console.error('❌ Ошибка получения постов:', error.message);
      return null;
    }
  }

  async runFullTest() {
    console.log('🚀 Начинаем полный тест авторизации и создания постов\n');
    
    // Шаг 1: Авторизация
    const authSuccess = await this.testAuth();
    if (!authSuccess) {
      console.log('❌ Тест прерван из-за ошибки авторизации');
      return;
    }

    // Шаг 2: Загрузка файла
    const filename = await this.testUpload();
    
    // Шаг 3: Создание поста
    const postId = await this.testCreatePost(filename);
    
    // Шаг 4: Получение постов
    await this.testGetPosts();
    
    console.log('\n✅ Тест завершён!');
    
    if (postId) {
      console.log(`\n🔗 Для проверки в браузере:`);
      console.log(`1. Войдите в систему на https://social-marketplace-frontend.onrender.com`);
      console.log(`2. Найдите пост с ID: ${postId}`);
      console.log(`3. Проверьте, что картинка отображается`);
    }
  }
}

// Запускаем тест
const test = new PostTest();
test.runFullTest().catch(console.error); 