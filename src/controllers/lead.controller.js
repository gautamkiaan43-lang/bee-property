const getLeads = async (req, res) => {
    res.json({ success: true, data: [] });
};
const createLead = async (req, res) => {
    res.status(201).json({ success: true, data: { id: 1 } });
};
const updateLead = async (req, res) => {
    res.json({ success: true, message: 'Lead updated' });
};
module.exports = { getLeads, createLead, updateLead };
