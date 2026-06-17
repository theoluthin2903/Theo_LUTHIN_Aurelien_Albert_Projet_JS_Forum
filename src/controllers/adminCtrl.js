const pool = require('../config/db');

// Ban user
async function banUser(req, res) {
  try {
    const { userId, reason } = req.body;
    const adminId = req.session.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const connection = await pool.getConnection();

    // Update user ban status
    await connection.query(
      'UPDATE users SET is_banned = TRUE WHERE id = ?',
      [userId]
    );

    // Log action
    await connection.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'ban_user', 'user', userId, reason || 'No reason provided']
    );

    // Also insert into bans table
    await connection.query(
      'INSERT INTO bans (user_id, banned_by, reason) VALUES (?, ?, ?)',
      [userId, adminId, reason || null]
    );

    connection.release();

    res.json({ success: true, message: 'User banned successfully' });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ success: false, message: 'Failed to ban user' });
  }
}

// Update topic state (admin)
async function updateTopicState(req, res) {
  try {
    const { topicId, state } = req.body;
    const adminId = req.session.userId;

    if (!topicId || !['ouvert', 'ferme', 'archive'].includes(state)) {
      return res.status(400).json({ success: false, message: 'Invalid topic ID or state' });
    }

    const connection = await pool.getConnection();

    const [topics] = await connection.query('SELECT id FROM topics WHERE id = ?', [topicId]);
    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    await connection.query(
      'UPDATE topics SET state = ? WHERE id = ?',
      [state, topicId]
    );

    // Log action
    await connection.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'update_topic_state', 'topic', topicId, `Changed state to ${state}`]
    );

    connection.release();

    res.json({ success: true, message: 'Topic state updated' });
  } catch (err) {
    console.error('Update topic state error:', err);
    res.status(500).json({ success: false, message: 'Failed to update topic state' });
  }
}

// Delete topic (admin)
async function deleteTopic(req, res) {
  try {
    const { topicId } = req.body;
    const adminId = req.session.userId;

    const connection = await pool.getConnection();

    const [topics] = await connection.query('SELECT id FROM topics WHERE id = ?', [topicId]);
    if (topics.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    await connection.query('DELETE FROM topics WHERE id = ?', [topicId]);

    // Log action
    await connection.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'delete_topic', 'topic', topicId, 'Topic deleted by admin']
    );

    connection.release();

    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    console.error('Delete topic error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
}

// Delete message (admin)
async function deleteMessage(req, res) {
  try {
    const { messageId } = req.body;
    const adminId = req.session.userId;

    const connection = await pool.getConnection();

    const [messages] = await connection.query('SELECT id FROM messages WHERE id = ?', [messageId]);
    if (messages.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await connection.query('DELETE FROM messages WHERE id = ?', [messageId]);

    // Log action
    await connection.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'delete_message', 'message', messageId, 'Message deleted by admin']
    );

    connection.release();

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

// Get admin dashboard stats
async function getDashboardStats(req, res) {
  try {
    const connection = await pool.getConnection();

    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [topicCount] = await connection.query('SELECT COUNT(*) as count FROM topics');
    const [messageCount] = await connection.query('SELECT COUNT(*) as count FROM messages');
    const [bannedCount] = await connection.query('SELECT COUNT(*) as count FROM users WHERE is_banned = TRUE');
    const [recentActions] = await connection.query(
      'SELECT aa.*, u.username FROM admin_actions aa JOIN users u ON aa.admin_id = u.id ORDER BY aa.created_at DESC LIMIT 10'
    );

    connection.release();

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0].count,
        totalTopics: topicCount[0].count,
        totalMessages: messageCount[0].count,
        bannedUsers: bannedCount[0].count
      },
      recentActions
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
}

// Get all users (admin)
async function getAllUsers(req, res) {
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, username, email, role, is_banned, created_at FROM users ORDER BY created_at DESC'
    );

    connection.release();

    res.json({ success: true, users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

module.exports = {
  banUser,
  updateTopicState,
  deleteTopic,
  deleteMessage,
  getDashboardStats,
  getAllUsers
};
