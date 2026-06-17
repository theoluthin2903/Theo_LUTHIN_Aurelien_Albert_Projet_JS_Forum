const pool = require('../config/db');

// Send friend request
async function sendFriendRequest(req, res) {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    if (!friendId) {
      return res.status(400).json({ success: false, message: 'Friend ID is required' });
    }

    if (friendId === userId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    const connection = await pool.getConnection();

    // Check if users exist
    const [friend] = await connection.query('SELECT id FROM users WHERE id = ?', [friendId]);
    if (friend.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if request already exists
    const [existing] = await connection.query(
      'SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: 'Friend request already exists' });
    }

    // Send request
    await connection.query(
      'INSERT INTO friends (user_id, friend_id, requested_by) VALUES (?, ?, ?)',
      [userId, friendId, userId]
    );

    connection.release();

    res.status(201).json({ success: true, message: 'Friend request sent' });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
}

// Accept friend request
async function acceptFriendRequest(req, res) {
  try {
    const { requestId } = req.body;
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    const [requests] = await connection.query(
      'SELECT id, user_id FROM friends WHERE id = ? AND friend_id = ?',
      [requestId, userId]
    );

    if (requests.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    await connection.query(
      'UPDATE friends SET status = "accepted" WHERE id = ?',
      [requestId]
    );

    connection.release();

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
}

// Reject friend request
async function rejectFriendRequest(req, res) {
  try {
    const { requestId } = req.body;
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    await connection.query(
      'DELETE FROM friends WHERE id = ? AND friend_id = ?',
      [requestId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (err) {
    console.error('Reject friend request error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject friend request' });
  }
}

// Get user friends
async function getUserFriends(req, res) {
  try {
    const userId = req.session.userId || req.query.userId;

    const connection = await pool.getConnection();

    const [friends] = await connection.query(
      'SELECT u.id, u.username, u.profile_picture FROM users u JOIN friends f ON (f.friend_id = u.id OR f.user_id = u.id) WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = "accepted"',
      [userId, userId]
    );

    connection.release();

    res.json({ success: true, friends });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
}

// Get pending friend requests
async function getPendingRequests(req, res) {
  try {
    const userId = req.session.userId;

    const connection = await pool.getConnection();

    const [requests] = await connection.query(
      'SELECT f.id, u.id as userId, u.username, u.profile_picture FROM friends f JOIN users u ON f.user_id = u.id WHERE f.friend_id = ? AND f.status = "pending"',
      [userId]
    );

    connection.release();

    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get pending requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getUserFriends,
  getPendingRequests
};
