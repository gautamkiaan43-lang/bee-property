const docusign = require('docusign-esign');
const pool = require('../config/db');

// @desc    Send Lease Agreement for Signature
const sendLeaseForSignature = async (req, res) => {
    // In a real app, you would fetch tenant, property, and lease details from DB
    // and generate a dynamic PDF or use a DocuSign template.
    const { tenantEmail, tenantName, documentBase64, leaseId } = req.body;

    if (!tenantEmail || !tenantName || !documentBase64) {
        return res.status(400).json({ message: 'Email, name, and document are required' });
    }

    try {
        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH); // e.g. https://demo.docusign.net/restapi
        apiClient.addDefaultHeader('Authorization', 'Bearer ' + process.env.DOCUSIGN_ACCESS_TOKEN);

        const docusignEnv = new docusign.EnvelopeDefinition();
        docusignEnv.emailSubject = 'Please sign your Lease Agreement - BEE Property Management';

        // Add document
        const doc = new docusign.Document();
        doc.documentBase64 = documentBase64;
        doc.name = 'Lease Agreement';
        doc.fileExtension = 'pdf';
        doc.documentId = '1';

        docusignEnv.documents = [doc];

        // Add signer
        const signer = docusign.Signer.constructFromObject({
            email: tenantEmail,
            name: tenantName,
            recipientId: '1',
            routingOrder: '1',
        });

        // Add sign here tab (signature placement)
        const signHere = docusign.SignHere.constructFromObject({
            anchorString: '/sn1/', // This text needs to be in the PDF (white font)
            anchorYOffset: '10',
            anchorUnits: 'pixels',
            anchorXOffset: '20'
        });

        const tabs = docusign.Tabs.constructFromObject({
            signHereTabs: [signHere],
        });
        signer.tabs = tabs;

        docusignEnv.recipients = docusign.Recipients.constructFromObject({
            signers: [signer],
        });
        docusignEnv.status = 'sent';

        const envelopesApi = new docusign.EnvelopesApi(apiClient);
        const results = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, {
            envelopeDefinition: docusignEnv,
        });

        // Optionally, update the lease record in database to note that it's sent
        if (leaseId) {
            await pool.query('UPDATE leases SET status = ? WHERE id = ?', ['sent_for_signature', leaseId]);
        }

        res.status(200).json({ success: true, envelopeId: results.envelopeId });
    } catch (error) {
        console.error('DocuSign Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send document', error: error.message });
    }
};

// @desc    DocuSign Connect Webhook (Listens for signature completion)
const docusignWebhook = async (req, res) => {
    // Note: DocuSign sends XML by default unless configured for JSON
    const payload = req.body;
    console.log('DocuSign Webhook received');
    
    // Logic to parse DocuSign webhook and update DB
    // e.g., if status is Completed, mark lease as active and save signed PDF link

    res.status(200).send('Webhook Received');
};

module.exports = { sendLeaseForSignature, docusignWebhook };
