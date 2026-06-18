const pool = require('../config/db');

// FT-3 : Création d'un topic
async function createTopic(req, res) {
  try {
    const { title, body, tags, visibility } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Non authentifié" });

    // Insertion du sujet
    const [result] = await pool.query(
      'INSERT INTO topics (title, body, author_id, state, visibility) VALUES (?, ?, ?, "ouvert", ?)',
      [title, body, userId, visibility || 'public']
    );
    const topicId = result.insertId;

    // Insertion des tags
    if (tags && Array.isArray(tags)) {
      for (let tName of tags) {
        tName = tName.trim();
        if (!tName) continue;
        await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [tName]);
        const [tagRow] = await pool.query('SELECT id FROM tags WHERE name = ?', [tName]);
        await pool.query('INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)', [topicId, tagRow[0].id]);
      }
    }
    res.status(201).json({ success: true, topicId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-10, FT-12 & FT-9 : Liste des topics avec recherche, filtres, tri et pagination
async function getTopics(req, res) {
  try {
    const { search, tag, limit, sort } = req.query;
    
    let query = `
      SELECT t.*, u.username as author_name, GROUP_CONCAT(tg.name) as tags 
      FROM topics t
      JOIN users u ON t.author_id = u.id
      LEFT JOIN topic_tags tt ON t.id = tt.topic_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE t.state != 'archive' AND t.visibility = 'public'
    `;
    let params = [];

    if (search) {
      query += " AND (t.title LIKE ? OR t.body LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
      query += " AND t.id IN (SELECT topic_id FROM topic_tags tt2 JOIN tags tg2 ON tt2.tag_id = tg2.id WHERE tg2.name = ?)";
      params.push(tag);
    }

    query += " GROUP BY t.id";

    // Gestion du tri (Récent ou Ancien)
    if (sort === 'oldest') {
        query += " ORDER BY t.created_at ASC";
    } else {
        query += " ORDER BY t.created_at DESC";
    }

    // Gestion de la pagination
    if (limit && limit !== 'all') {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, topics: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-4 : Détails du topic
async function getTopic(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT t.*, u.username as author_name FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = ?", 
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false });

    const [tagRows] = await pool.query(
      "SELECT tg.name FROM tags tg JOIN topic_tags tt ON tg.id = tt.tag_id WHERE tt.topic_id = ?", 
      [id]
    );

    res.json({ success: true, topic: { ...rows[0], tags: tagRows.map(tr => tr.name) } });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

// FT-6 : Modification par le propriétaire
async function updateTopic(req, res) {
  try {
    const { id } = req.params;
    const { title, body, state, tags } = req.body;
    const userId = req.session.userId;

    const [topic] = await pool.query('SELECT author_id FROM topics WHERE id = ?', [id]);
    if (topic.length === 0) return res.status(404).json({ success: false });
    
    // Seul le proprio ou l'admin peut modifier
    if (topic[0].author_id !== userId && req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Interdit" });
    }

    await pool.query(
        'UPDATE topics SET title = COALESCE(?, title), body = COALESCE(?, body), state = COALESCE(?, state) WHERE id = ?', 
        [title, body, state, id]
    );

    if (tags && Array.isArray(tags)) {
        await pool.query('DELETE FROM topic_tags WHERE topic_id = ?', [id]);
        for (let t of tags) {
            await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [t.trim()]);
            const [tr] = await pool.query('SELECT id FROM tags WHERE name = ?', [t.trim()]);
            await pool.query('INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)', [id, tr[0].id]);
        }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// FT-6 : Suppression
async function deleteTopic(req, res) {
  try {
    const [topic] = await pool.query('SELECT author_id FROM topics WHERE id = ?', [req.params.id]);
    if (topic.length === 0) return res.status(404).json({ success: false });

    if (topic[0].author_id !== req.session.userId && req.session.role !== 'admin') {
        return res.status(403).json({ success: false });
    }

    await pool.query('DELETE FROM topics WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

module.exports = { createTopic, getTopics, getTopic, updateTopic, deleteTopic };