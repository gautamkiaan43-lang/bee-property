const express = require('express');
const router = express.Router();
const docusignController = require('../controllers/docusign.controller');
const { protect } = require('../middleware/auth');

// Protected route to trigger sending a lease agreement via DocuSign
router.post('/send-lease', protect, docusignController.sendLeaseForSignature);

// Public webhook route for DocuSign Connect (receives updates when signed)
// DocuSign sends XML or JSON. Using standard post for now.
router.post('/webhook', docusignController.docusignWebhook);

module.exports = router;
