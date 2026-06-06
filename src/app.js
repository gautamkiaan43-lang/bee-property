const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('express-async-errors'); // Avoid unhandled promise rejection crashes
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ============================================
// 1. MIDDLEWARE 
// ============================================

// CORS setup MUST be first
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://bee-property.netlify.app',
        'https://bee-property.netlify.app/',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(helmet({ crossOriginResourcePolicy: false })); // allows sending images to frontend

// Stripe Webhook MUST be placed before express.json() so it can parse the raw body
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payments/webhook', express.raw({type: 'application/json'}), paymentRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logger

// Setup static file serving for Uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// 2. ROOT ENDPOINT (Health Check)
// ============================================
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Peach State Residences API (v4.0)' });
});

// ============================================
// 3. API ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/tenants', require('./routes/tenant.routes'));
app.use('/api/leases', require('./routes/lease.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/communications', require('./routes/communication.routes'));
app.use('/api/payments', require('./routes/payment.routes')); // Added for standard JSON payment requests
app.use('/api/docusign', require('./routes/docusign.routes')); // Added for DocuSign lease signing
app.use('/api/ghl', require('./routes/ghl.routes')); // Added for GoHighLevel Sync

// ============================================
// 4. ERROR HANDLING
// ============================================
app.use(notFound);       // Catches 404s
app.use(errorHandler);   // Catches everything else without crashing server

module.exports = app;
