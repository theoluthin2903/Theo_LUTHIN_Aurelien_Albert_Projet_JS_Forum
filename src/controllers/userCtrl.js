const pool = require('../config/db');

// Get user profile
async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, username, bio, profile_picture, last_login, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // Get message count
    const [messageCount] = await connection.query(
      'SELECT COUNT(*) as count FROM messages WHERE author_id = ?',
      [userId]
    );

    // Get topic count
    const [topicCount] = await connection.query(
      'SELECT COUNT(*) as count FROM topics WHERE author_id = ?',
      [userId]
    );

    connection.release();

    res.json({
      success: true,
      profile: {
        ...user,
        messageCount: messageCount[0].count,
        topicCount: topicCount[0].count
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
}

// Update user profile
async function updateUserProfile(req, res) {
  try {
    const { bio, profile_picture } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const connection = await pool.getConnection();

    const updates = [];
    const params = [];
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (profile_picture !== undefined) {
      updates.push('profile_picture = ?');
      params.push(profile_picture);
    }
    params.push(userId);

    await connection.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    connection.release();

    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
