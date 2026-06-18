const pool = require('../config/db');

async function createTopic(req, res) {
  try {
    const { title, body, tags } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Non connecté" });

    const [result] = await pool.query('INSERT INTO topics (title, body, author_id, state) VALUES (?, ?, ?, "ouvert")', [title, body, userId]);
    const topicId = result.insertId;

    if (tags && Array.isArray(tags)) {
      for (let t of tags) {
        if (!t.trim()) continue;
        await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [t.trim()]);
        const [tagRow] = await pool.query('SELECT id FROM tags WHERE name = ?', [t.trim()]);
        await pool.query('INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)', [topicId, tagRow[0].id]);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getTopics(req, res) {
  try {
    const { search, tag, limit } = req.query;
    let query = `
      SELECT t.*, u.username as author_name, GROUP_CONCAT(tg.name) as tags 
      FROM topics t 
      JOIN users u ON t.author_id = u.id 
      LEFT JOIN topic_tags tt ON t.id = tt.topic_id 
      LEFT JOIN tags tg ON tt.tag_id = tg.id 
      WHERE t.state != 'archive'
    `;
    let params = [];
    if (search) { query += " AND (t.title LIKE ? OR t.body LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (tag) { query += " AND t.id IN (SELECT topic_id FROM topic_tags tt2 JOIN tags tg2 ON tt2.tag_id = tg2.id WHERE tg2.name = ?)"; params.push(tag); }
    
    query += " GROUP BY t.id ORDER BY t.created_at DESC";
    if (limit && limit !== 'all') { query += " LIMIT ?"; params.push(parseInt(limit)); }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, topics: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getTopic(req, res) {
  try {
    const [rows] = await pool.query("SELECT t.*, u.username as author_name FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false });
    const [tags] = await pool.query("SELECT tg.name FROM tags tg JOIN topic_tags tt ON tg.id = tt.tag_id WHERE tt.topic_id = ?", [req.params.id]);
    res.json({ success: true, topic: { ...rows[0], tags: tags.map(t => t.name) } });
  } catch (err) { res.status(500).json({ success: false }); }
}

// CETTE FONCTION ÉTAIT MANQUANTE ET CAUSAIT L'ERREUR
async function updateTopic(req, res) {
    try {
        const { title, body, state, visibility } = req.body;
        const { id } = req.params;
        await pool.query(
            'UPDATE topics SET title = COALESCE(?, title), body = COALESCE(?, body), state = COALESCE(?, state), visibility = COALESCE(?, visibility) WHERE id = ?',
            [title, body, state, visibility, id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteTopic(req, res) {
    try {
        await pool.query("DELETE FROM topics WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
}

module.exports = { createTopic, getTopics, getTopic, updateTopic, deleteTopic };