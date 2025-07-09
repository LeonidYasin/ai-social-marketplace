const { query } = require('../utils/db');

// Получить все посты с информацией о пользователях
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, section } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT 
        p.id, p.content, p.media_urls, p.media_type, p.background_color,
        p.privacy, p.section, p.location, p.is_ai_generated, p.ai_prompt,
        p.created_at, p.updated_at,
        u.id as user_id, u.username, u.first_name, u.last_name, u.avatar_url,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT r.id) as reaction_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
      LEFT JOIN reactions r ON p.id = r.post_id
      WHERE p.deleted_at IS NULL
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (section) {
      sql += ` AND p.section = $${paramIndex}`;
      params.push(section);
      paramIndex++;
    }
    
    sql += `
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Получаем реакции для каждого поста
    for (let post of result.rows) {
      const reactionsResult = await query(
        `SELECT reaction_type, COUNT(*) as count 
         FROM reactions 
         WHERE post_id = $1 
         GROUP BY reaction_type`,
        [post.id]
      );
      post.reactions = reactionsResult.rows;
    }
    
    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Ошибка при получении постов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить пост по ID
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
        p.id, p.content, p.media_urls, p.media_type, p.background_color,
        p.privacy, p.section, p.location, p.is_ai_generated, p.ai_prompt,
        p.created_at, p.updated_at,
        u.id as user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    const post = result.rows[0];
    
    // Получаем комментарии
    const commentsResult = await query(
      `SELECT 
        c.id, c.content, c.media_url, c.created_at,
        u.id as user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [id]
    );
    
    // Получаем реакции
    const reactionsResult = await query(
      `SELECT reaction_type, COUNT(*) as count 
       FROM reactions 
       WHERE post_id = $1 
       GROUP BY reaction_type`,
      [id]
    );
    
    post.comments = commentsResult.rows;
    post.reactions = reactionsResult.rows;
    
    res.json(post);
  } catch (error) {
    console.error('Ошибка при получении поста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Создать новый пост
const createPost = async (req, res) => {
  try {
    console.log('🚀 POST /api/posts - Начинаем создание поста');
    console.log('📝 Данные запроса:', {
      body: req.body,
      user: req.user,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'none'
      }
    });

    const { 
      content, media_urls, media_type, background_color, 
      privacy, section, location, is_ai_generated, ai_prompt 
    } = req.body;
    
    console.log('🔍 Проверяем данные поста:', {
      content: content ? `${content.substring(0, 50)}...` : 'empty',
      media_urls: media_urls,
      media_type: media_type,
      background_color: background_color,
      privacy: privacy,
      section: section,
      location: location,
      is_ai_generated: is_ai_generated,
      ai_prompt: ai_prompt
    });
    
    // Проверяем, что есть либо контент, либо медиафайлы
    if (!content && (!media_urls || media_urls.length === 0)) {
      console.log('❌ Ошибка валидации: нет контента и медиафайлов');
      return res.status(400).json({ error: 'Необходим либо текст, либо медиафайлы' });
    }
    
    const userId = req.user.id; // ID из JWT токена
    
    if (!userId) {
      console.log('❌ Ошибка авторизации: пользователь не найден в req.user');
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    console.log('✅ Пользователь авторизован, ID:', userId);
    
    // Преобразуем media_urls в формат '{"url1","url2"}' для PostgreSQL
    let mediaUrlsPg = null;
    if (Array.isArray(media_urls) && media_urls.length > 0) {
      mediaUrlsPg = '{' + media_urls.map(url => '"' + url.replace(/"/g, '\"') + '"').join(',') + '}';
      console.log('📁 Media URLs для PostgreSQL:', mediaUrlsPg);
    }
    
    console.log('💾 Выполняем SQL запрос для создания поста...');
    
    const result = await query(
      `INSERT INTO posts (
        user_id, content, media_urls, media_type, background_color,
        privacy, section, location, is_ai_generated, ai_prompt,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        userId, content || '', 
        mediaUrlsPg,
        media_type || null,
        background_color || null,
        privacy || 'public',
        section || null,
        location || null,
        is_ai_generated || false,
        ai_prompt || null
      ]
    );
    
    console.log('✅ Пост создан успешно:', {
      postId: result.rows[0].id,
      userId: result.rows[0].user_id,
      content: result.rows[0].content ? `${result.rows[0].content.substring(0, 50)}...` : 'empty',
      createdAt: result.rows[0].created_at
    });
    
    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка при создании поста:', error);
    console.error('📋 Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить пост
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      content, media_urls, media_type, background_color, 
      privacy, section, location 
    } = req.body;
    
    const result = await query(
      `UPDATE posts 
       SET content = COALESCE($1, content),
           media_urls = COALESCE($2, media_urls),
           media_type = COALESCE($3, media_type),
           background_color = COALESCE($4, background_color),
           privacy = COALESCE($5, privacy),
           section = COALESCE($6, section),
           location = COALESCE($7, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING id, content, updated_at`,
      [content, media_urls, media_type, background_color, privacy, section, location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    res.json({
      message: 'Пост обновлен',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при обновлении поста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удалить пост (мягкое удаление)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    res.json({ message: 'Пост удален' });
  } catch (error) {
    console.error('Ошибка при удалении поста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить посты пользователя
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT 
        p.id, p.content, p.media_urls, p.media_type, p.background_color,
        p.privacy, p.section, p.location, p.is_ai_generated, p.ai_prompt,
        p.created_at, p.updated_at,
        u.id as user_id, u.username, u.first_name, u.last_name, u.avatar_url,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT r.id) as reaction_count
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
       LEFT JOIN reactions r ON p.id = r.post_id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Ошибка при получении постов пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getUserPosts
}; 