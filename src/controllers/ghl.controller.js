const pool = require('../config/db');

// @desc    Handle GoHighLevel Webhooks (e.g. New Contact created in GHL)
const ghlWebhook = async (req, res) => {
    // GoHighLevel typically sends JSON payload with contact information
    console.log('GHL Webhook received:', req.body);
    
    // Example: Extract data from GHL payload
    // Note: The exact structure depends on how the webhook is configured in GHL.
    // Assuming standard contact creation payload:
    const contactName = req.body.full_name || req.body.first_name + ' ' + req.body.last_name || 'GHL Contact';
    const email = req.body.email || null;
    const phone = req.body.phone || null;
    const source = 'GoHighLevel';

    try {
        // Sync GHL Contact into the local 'leads' table
        const [result] = await pool.query(
            'INSERT INTO leads (full_name, email, phone, source) VALUES (?, ?, ?, ?)',
            [contactName, email, phone, source]
        );
        res.status(200).json({ success: true, message: 'GHL Contact synced to Leads', lead_id: result.insertId });
    } catch (error) {
        console.error('Error syncing GHL webhook:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { ghlWebhook };
