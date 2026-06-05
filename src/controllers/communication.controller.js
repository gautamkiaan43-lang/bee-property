const db = require('../config/db');

const getCommunications = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM communication_logs ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching communications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createCommunication = async (req, res) => {
    const { type, recipient, message, status, related_entity, entity_id } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO communication_logs (type, recipient, message, status, related_entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
            [type, recipient, message, status || 'Sent', related_entity || null, entity_id || null]
        );
        res.status(201).json({ success: true, message: 'Communication logged successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating communication:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getCommunications, createCommunication };
