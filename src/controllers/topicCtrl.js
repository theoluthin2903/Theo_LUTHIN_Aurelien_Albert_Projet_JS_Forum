const pool = require('../config/db');

// Create topic (FT-3)
async function createTopic(req, res) {
  try {
    const { title, body, tags } = req.body;
    const userId = req.session.userId;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const connection = await pool.getConnection();

    // Insert topic
    const [result] = await connection.query(
      'INSERT INTO topics (title, body, author_id) VALUES (?, ?, ?)',
      [title, body, userId]
    );

    const topicId = result.insertId;

    // Insert tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const [tagResult] = await connection.query(
          'INSERT IGNORE INTO tags (name) VALUES (?)',
          [tagName]
        );
        const tagId = tagResult.insertId || (await connection.query('SELECT id FROM tags WHERE name = ?', [tagName]))[0][0].id;
        await connection.query(
          'INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)',
          [topicId, tagId]
        );
      }
    }

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic: { id: topicId, title, body }
    });
  } catch (err) {
    console.error('Create topic error:', err);
    res.status(500).json({ success: false, message: 'Failed to create topic' });
  }
}

// Get all topics with pagination and filters (FT-4, FT-9, FT-10)
async function getTopics(req, res) {
  try {
    const { page = 1, limit = 10, tag, search, sort = 'recent', visibility = 'public' } = req.query;
    const userId = req.session.userId;
    const offset = (page - 1) * limit;
    const validLimit = ['10', '20', '30', 'all'].includes(limit) ? limit : 10;
    const queryLimit = validLimit === 'all' ? 10000 : validLimit;

    let query = 'SELECT DISTINCT t.* FROM topics t LEFT JOIN topic_tags tt ON t.id = tt.topic_id LEFT JOIN tags tg ON tt.tag_id = tg.id WHERE t.visibility = ?';
    let params = [visibility];

    // Filter by tag
    if (tag) {
      query += ' AND tg.name = ?';
      params.push(tag);
    }

    // Filter by search
    if (search) {
      query += ' AND (t.title LIKE ? OR t.body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter archived topics
    query += ' AND t.state != "archive"';

    // Sorting
    if (sort === 'popular') {
      query += ` ORDER BY (SELECT COUNT(*) FROM votes v JOIN messages m ON v.message_id = m.id WHERE m.topic_id = t.id AND v.vote_type = 'like') - (SELECT COUNT(*) FROM votes v JOIN messages m ON v.message_id = m.id WHERE m.topic_id = t.id AND v.vote_type = 'dislike') DESC`;
    } else {
      query += ' ORDER BY t.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(queryLimit, offset);

    const connection = await pool.getConnection();
    const [topics] = await connection.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(DISTINCT t.id) as total FROM topics t LEFT JOIN topic_tags tt ON t.id = tt.topic_id LEFT JOIN tags tg ON tt.tag_id = tg.id WHERE t.visibility = ?';
    let countParams = [visibility];
    if (tag) {
      countQuery += ' AND tg.name = ?';
      countParams.push(tag);
    }
    if (search) {
      countQuery += ' AND (t.title LIKE ? OR t.body LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    countQuery += ' AND t.state != "archive"';

    const [countResult] = await connection.query(countQuery, countParams);
    const total = countResult[0].total;

    connection.release();

    res.json({
      success: true,
      topics,
      pagination: {
        total,
        page: parseInt(page),
        limit: queryLimit,
        pages: Math.ceil(total / queryLimit)
      }
    });
  } catch (err) {
    console.error('Get topics error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch topics' });
  }
}

// Get single topic (FT-4)
async function getTopic(req, res) {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [topics] = await connection.query(
      'SELECT * FROM topics WHERE id = ?',
      [id]
    );

    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const topic = topics[0];

    // Get tags
    const [tagResults] = await connection.query(
      'SELECT tg.name FROM tags tg JOIN topic_tags tt ON tg.id = tt.tag_id WHERE tt.topic_id = ?',
      [id]
    );

    // Get messages
    const [messages] = await connection.query(
      'SELECT m.*, u.username FROM messages m JOIN users u ON m.author_id = u.id WHERE m.topic_id = ? ORDER BY m.created_at DESC LIMIT 1000',
      [id]
    );

    connection.release();

    topic.tags = tagResults.map(t => t.name);
    topic.messages = messages;

    res.json({ success: true, topic });
  } catch (err) {
    console.error('Get topic error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch topic' });
  }
}

// Update topic state (admin + owner)
async function updateTopic(req, res) {
  try {
    const { id } = req.params;
    const { state, visibility } = req.body;
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    // Check ownership
    const [topics] = await connection.query('SELECT author_id FROM topics WHERE id = ?', [id]);
    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (topics[0].author_id !== userId && req.session.role !== 'admin') {
      connection.release();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updates = [];
    const params = [];
    if (state) {
      updates.push('state = ?');
      params.push(state);
    }
    if (visibility) {
      updates.push('visibility = ?');
      params.push(visibility);
    }
    params.push(id);

    await connection.query(`UPDATE topics SET ${updates.join(', ')} WHERE id = ?`, params);
    connection.release();

    res.json({ success: true, message: 'Topic updated' });
  } catch (err) {
    console.error('Update topic error:', err);
    res.status(500).json({ success: false, message: 'Failed to update topic' });
  }
}

// Delete topic (FT-6)
async function deleteTopic(req, res) {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    // Check ownership
    const [topics] = await connection.query('SELECT author_id FROM topics WHERE id = ?', [id]);
    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (topics[0].author_id !== userId && req.session.role !== 'admin') {
      connection.release();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete all related data (cascade handled by DB foreign keys)
    await connection.query('DELETE FROM topics WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    console.error('Delete topic error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
}

module.exports = {
  createTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic
};
