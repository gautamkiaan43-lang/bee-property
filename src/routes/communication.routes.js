const express = require('express');
const router = express.Router();
const { getCommunications, createCommunication } = require('../controllers/communication.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCommunications);
router.post('/', protect, createCommunication);

module.exports = router;
