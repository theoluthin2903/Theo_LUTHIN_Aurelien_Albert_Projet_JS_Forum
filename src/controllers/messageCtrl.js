const pool = require('../config/db');

// Create message (FT-5)
async function createMessage(req, res) {
  try {
    const { topicId, body } = req.body;
    const userId = req.session.userId;

    if (!topicId || !body) {
      return res.status(400).json({ success: false, message: 'Topic ID and body are required' });
    }

    const connection = await pool.getConnection();

    // Check if topic exists and is open
    const [topics] = await connection.query(
      'SELECT state FROM topics WHERE id = ?',
      [topicId]
    );

    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (topics[0].state !== 'ouvert') {
      connection.release();
      return res.status(403).json({ success: false, message: 'Cannot post to a closed or archived topic' });
    }

    // Insert message
    const [result] = await connection.query(
      'INSERT INTO messages (topic_id, author_id, body) VALUES (?, ?, ?)',
      [topicId, userId, body]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      messageId: result.insertId
    });
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ success: false, message: 'Failed to create message' });
  }
}

// Get messages by topic (FT-8, FT-9)
async function getMessages(req, res) {
  try {
    const { topicId, page = 1, limit = 10, sort = 'recent' } = req.query;

    if (!topicId) {
      return res.status(400).json({ success: false, message: 'Topic ID is required' });
    }

    const validLimit = ['10', '20', '30', 'all'].includes(limit) ? limit : 10;
    const queryLimit = validLimit === 'all' ? 10000 : validLimit;
    const offset = (page - 1) * queryLimit;

    const connection = await pool.getConnection();

    let query = `
      SELECT m.*, u.username,
      (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'like') as likes,
      (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'dislike') as dislikes
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.topic_id = ?
    `;
    const params = [topicId];

    // Sorting
    if (sort === 'popular') {
      query += ` ORDER BY (likes - dislikes) DESC`;
    } else {
      query += ' ORDER BY m.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(queryLimit, offset);

    const [messages] = await connection.query(query, params);

    // Get total count
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM messages WHERE topic_id = ?',
      [topicId]
    );
    const total = countResult[0].total;

    connection.release();

    res.json({
      success: true,
      messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: queryLimit,
        pages: Math.ceil(total / queryLimit)
      }
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
}

// Like/Dislike message (FT-7)
async function voteMessage(req, res) {
  try {
    const { messageId, voteType } = req.body;
    const userId = req.session.userId;

    if (!messageId || !['like', 'dislike'].includes(voteType)) {
      return res.status(400).json({ success: false, message: 'Invalid message ID or vote type' });
    }

    const connection = await pool.getConnection();

    // Check if message exists
    const [messages] = await connection.query('SELECT id FROM messages WHERE id = ?', [messageId]);
    if (messages.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check existing vote
    const [existingVotes] = await connection.query(
      'SELECT vote_type FROM votes WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0].vote_type;
      if (existingVote === voteType) {
        // Remove vote if same type
        await connection.query(
          'DELETE FROM votes WHERE message_id = ? AND user_id = ?',
          [messageId, userId]
        );
      } else {
        // Update vote if different type
        await connection.query(
          'UPDATE votes SET vote_type = ? WHERE message_id = ? AND user_id = ?',
          [voteType, messageId, userId]
        );
      }
    } else {
      // Insert new vote
      await connection.query(
        'INSERT INTO votes (message_id, user_id, vote_type) VALUES (?, ?, ?)',
        [messageId, userId, voteType]
      );
    }

    // Get updated vote counts
    const [likeCount] = await connection.query(
      'SELECT COUNT(*) as count FROM votes WHERE message_id = ? AND vote_type = "like"',
      [messageId]
    );
    const [dislikeCount] = await connection.query(
      'SELECT COUNT(*) as count FROM votes WHERE message_id = ? AND vote_type = "dislike"',
      [messageId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Vote recorded',
      stats: {
        likes: likeCount[0].count,
        dislikes: dislikeCount[0].count
      }
    });
  } catch (err) {
    console.error('Vote message error:', err);
    res.status(500).json({ success: false, message: 'Failed to vote' });
  }
}

// Delete message (FT-6)
async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    // Check ownership
    const [messages] = await connection.query(
      'SELECT author_id, topic_id FROM messages WHERE id = ?',
      [id]
    );

    if (messages.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user owns message or is topic owner or admin
    const topicId = messages[0].topic_id;
    const [topics] = await connection.query('SELECT author_id FROM topics WHERE id = ?', [topicId]);

    if (messages[0].author_id !== userId && topics[0].author_id !== userId && req.session.role !== 'admin') {
      connection.release();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await connection.query('DELETE FROM messages WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

module.exports = {
  createMessage,
  getMessages,
  voteMessage,
  deleteMessage
};
