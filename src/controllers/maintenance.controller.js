const pool = require('../config/db');
const { sendSMS } = require('../utils/sms');

// @desc    Get all maintenance tickets
const getMaintenance = async (req, res) => {
    try {
        let query = `SELECT m.*, p.name as property_name, t.full_name as tenant_name, u.name as added_by_name 
                     FROM maintenance m 
                     LEFT JOIN properties p ON m.property_id = p.id 
                     LEFT JOIN tenants t ON m.tenant_id = t.id
                     LEFT JOIN users u ON m.added_by = u.id`;
        let params = [];
        if (req.user.role === 'manager') {
            query += ' WHERE m.added_by = ?';
            params.push(req.user.id);
        }
        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Maintenance
const createMaintenance = async (req, res) => {
    const { title, description, property_id, tenant_id, category, priority, status, vendor_id, vendor_notes } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO maintenance (title, description, property_id, tenant_id, category, priority, status, vendor_id, vendor_notes, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, property_id, tenant_id, category, priority, status, vendor_id, vendor_notes, req.user.id]
        );
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Maintenance Ticket
const updateMaintenance = async (req, res) => {
    const { id } = req.params;
    const { title, description, property_id, tenant_id, category, priority, status, vendor_id, vendor_notes } = req.body;
    try {
        let query = 'UPDATE maintenance SET title=?, description=?, property_id=?, tenant_id=?, category=?, priority=?, status=?, vendor_id=?, vendor_notes=? WHERE id=?';
        let params = [title, description, property_id, tenant_id, category, priority, status, vendor_id, vendor_notes, id];

        if (req.user.role === 'manager') {
            query += ' AND added_by=?';
            params.push(req.user.id);
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Auto-dispatch SMS if vendor_id is provided and status is in_progress
        if (vendor_id && status === 'in_progress') {
            const [vendorRows] = await pool.query('SELECT * FROM vendors WHERE id=?', [vendor_id]);
            if (vendorRows.length > 0) {
                const vendor = vendorRows[0];
                if (vendor.phone) {
                    const smsBody = `Hi ${vendor.company_name}, you have a new maintenance ticket: "${title}". Description: ${description}. Priority: ${priority}. Please log in to BEE Property CRM for details.`;
                    await sendSMS(vendor.phone, smsBody);
                }
            }
        }

        res.json({ success: true, message: 'Ticket updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Maintenance
const deleteMaintenance = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? 'DELETE FROM maintenance WHERE id=?' : 'DELETE FROM maintenance WHERE id=? AND added_by=?';
        const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Ticket not found' });
        res.json({ success: true, message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance };
