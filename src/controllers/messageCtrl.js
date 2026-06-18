const pool = require('../config/db');

// FT-5 : Créer un message (Vérifie si le topic est ouvert)
async function createMessage(req, res) {
  try {
    const { topicId, body } = req.body;
    const userId = req.session.userId;

    if (!topicId || !body) return res.status(400).json({ success: false, message: 'Données manquantes' });

    const [topic] = await pool.query('SELECT state FROM topics WHERE id = ?', [topicId]);
    if (topic.length === 0) return res.status(404).json({ success: false, message: 'Topic introuvable' });

    // Seul un topic "ouvert" accepte des messages
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
    const offset = (parseInt(page) - 1) * parseInt(limit);

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
      LIMIT ? OFFSET ?
    `;

    const [messages] = await pool.query(query, [parseInt(topicId), parseInt(limit === 'all' ? 1000 : limit), offset]);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-7 : Like/Dislike (Exclusif)
async function voteMessage(req, res) {
  try {
    const { messageId, voteType } = req.body;
    const userId = req.session.userId;

    // Utilisation de ON DUPLICATE KEY UPDATE pour gérer l'exclusivité (géré par la contrainte UNIQUE en DB)
    await pool.query(
      'INSERT INTO votes (user_id, message_id, vote_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE vote_type = ?',
      [userId, messageId, voteType, voteType]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.role;

    const [msg] = await pool.query('SELECT m.author_id, t.author_id as owner_id FROM messages m JOIN topics t ON m.topic_id = t.id WHERE m.id = ?', [id]);
    if (msg.length === 0) return res.status(404).json({ success: false });

    // Auteur message, propriétaire topic ou admin
    if (msg[0].author_id === userId || msg[0].owner_id === userId || userRole === 'admin') {
      await pool.query('DELETE FROM messages WHERE id = ?', [id]);
      return res.json({ success: true });
    }
    res.status(403).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

module.exports = { createMessage, getMessages, voteMessage, deleteMessage };