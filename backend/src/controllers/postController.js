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
    const { 
      content, media_urls, media_type, background_color, 
      privacy, section, location, is_ai_generated, ai_prompt 
    } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'content обязателен' });
    }
    
    const userId = req.user.id; // ID из JWT токена
    // Преобразуем media_urls в формат '{"url1","url2"}' для PostgreSQL
    let mediaUrlsPg = null;
    if (Array.isArray(media_urls)) {
      mediaUrlsPg = '{' + media_urls.map(url => '"' + url.replace(/"/g, '\"') + '"').join(',') + '}';
    }
    const result = await query(
      `INSERT INTO posts (
        user_id, content, media_urls, media_type, background_color,
        privacy, section, location, is_ai_generated, ai_prompt,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        userId, content, 
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
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании поста:', error);
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