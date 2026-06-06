const pool = require('../config/db');

// @desc    Get all leads
const getLeads = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Zillow Webhook / Create Lead manually
const createLead = async (req, res) => {
    // Check if it's a Zillow webhook format (Zillow sends specific JSON payload)
    // We'll extract common fields. Adjust based on exact Zillow payload structure.
    let full_name, email, phone, source, unit_of_interest, notes;

    if (req.body.ContactMessage) {
        // Zillow payload format extraction
        const contact = req.body.ContactMessage.Contact;
        const property = req.body.ContactMessage.Property;
        full_name = `${contact.FirstName} ${contact.LastName}`;
        email = contact.Email;
        phone = contact.Phone;
        source = 'Zillow';
        unit_of_interest = property?.Address || null;
        notes = req.body.ContactMessage.Message || null;
    } else {
        // Standard CRM UI creation
        ({ full_name, email, phone, source, unit_of_interest, notes } = req.body);
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO leads (full_name, email, phone, source, unit_of_interest, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, source || 'Manual', unit_of_interest, notes]
        );
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Lead Status
const updateLead = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE leads SET status=?, notes=? WHERE id=?',
            [status, notes, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, message: 'Lead updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getLeads, createLead, updateLead };
