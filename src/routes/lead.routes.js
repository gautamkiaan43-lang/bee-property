const express = require('express');
const router = express.Router();
const { getLeads, createLead, updateLead } = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLeads);
router.post('/', protect, createLead);
router.put('/:id', protect, updateLead);

module.exports = router;
