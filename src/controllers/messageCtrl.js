const pool = require('../config/db');

// FT-5 : Créer un message (Vérifie si le topic est ouvert)
async function createMessage(req, res) {
  try {
    const { topicId, body } = req.body;
    const userId = req.session.userId;

    const [topic] = await pool.query('SELECT state FROM topics WHERE id = ?', [topicId]);
    if (topic.length === 0) return res.status(404).json({ success: false, message: 'Topic introuvable' });

    if (topic[0].state !== 'ouvert') {
      return res.status(403).json({ success: false, message: 'Ce topic est fermé ou archivé.' });
    }

    await pool.query('INSERT INTO messages (topic_id, author_id, body) VALUES (?, ?, ?)', [topicId, userId, body]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-8 & FT-9 : Get messages avec Tri et Pagination
async function getMessages(req, res) {
  try {
    const { topicId, sort = 'recent', limit = 10, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * (limit === 'all' ? 0 : parseInt(limit));

    let orderBy = 'm.created_at DESC';
    if (sort === 'popular') orderBy = '(likes - dislikes) DESC';
    if (sort === 'oldest') orderBy = 'm.created_at ASC';

    const query = `
      SELECT m.*, u.username,
      (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'like') as likes,
      (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'dislike') as dislikes
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.topic_id = ?
      ORDER BY ${orderBy}
      ${limit === 'all' ? '' : 'LIMIT ? OFFSET ?'}
    `;

    const params = [parseInt(topicId)];
    if (limit !== 'all') {
        params.push(parseInt(limit), offset);
    }

    const [messages] = await pool.query(query, params);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-7 : Like/Dislike exclusif
async function voteMessage(req, res) {
  try {
    const { messageId, voteType } = req.body;
    const userId = req.session.userId;
    await pool.query(
      'INSERT INTO votes (user_id, message_id, vote_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE vote_type = ?',
      [userId, messageId, voteType, voteType]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-6 : Suppression (Auteur message OR Propriétaire Topic OR Admin)
async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.role;

    const [rows] = await pool.query(`
      SELECT m.author_id as msg_author, t.author_id as topic_owner 
      FROM messages m 
      JOIN topics t ON m.topic_id = t.id 
      WHERE m.id = ?`, [id]);

    if (rows.length === 0) return res.status(404).json({ success: false });

    const { msg_author, topic_owner } = rows[0];

    if (userId === msg_author || userId === topic_owner || userRole === 'admin') {
      await pool.query('DELETE FROM messages WHERE id = ?', [id]);
      return res.json({ success: true });
    }
    res.status(403).json({ success: false, message: "Non autorisé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createMessage, getMessages, voteMessage, deleteMessage };