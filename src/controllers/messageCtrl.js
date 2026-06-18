const pool = require('../config/db');

async function createMessage(req, res) {
    try {
        const { topicId, body } = req.body;
        const userId = req.session.userId;
        const [topic] = await pool.query("SELECT state FROM topics WHERE id = ?", [topicId]);
        if (topic[0].state !== 'ouvert') return res.status(403).json({ success: false, message: "Topic non ouvert" });

        await pool.query("INSERT INTO messages (topic_id, author_id, body) VALUES (?, ?, ?)", [topicId, userId, body]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getMessages(req, res) {
    try {
        const { topicId, sort, limit, page = 1 } = req.query;
        const offset = (page - 1) * (limit || 10);
        
        let query = `
            SELECT m.*, u.username, 
            (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'like') as likes,
            (SELECT COUNT(*) FROM votes WHERE message_id = m.id AND vote_type = 'dislike') as dislikes
            FROM messages m JOIN users u ON m.author_id = u.id WHERE m.topic_id = ?
        `;

        if (sort === 'popular') query += " ORDER BY (likes - dislikes) DESC";
        else query += " ORDER BY m.created_at ASC";

        if (limit && limit !== 'all') {
            query += " LIMIT ? OFFSET ?";
            const [messages] = await pool.query(query, [topicId, parseInt(limit), parseInt(offset)]);
            return res.json({ success: true, messages });
        }

        const [messages] = await pool.query(query, [topicId]);
        res.json({ success: true, messages });
    } catch (err) { res.status(500).json({ success: false }); }
}

async function voteMessage(req, res) {
    try {
        const { messageId, voteType } = req.body;
        const userId = req.session.userId;
        await pool.query("INSERT INTO votes (user_id, message_id, vote_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE vote_type = ?", [userId, messageId, voteType, voteType]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
}

async function deleteMessage(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM messages WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
}

module.exports = { createMessage, getMessages, voteMessage, deleteMessage };