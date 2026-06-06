const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

// ============================================
// Create Checkout Session
// ============================================
exports.createCheckoutSession = async (req, res) => {
    try {
        const { amount, description, metadata } = req.body;
        // metadata should contain tenantId, invoiceId, etc.

        if (!amount || !description) {
            return res.status(400).json({ message: 'Amount and description are required.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: description,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: metadata, // Pass custom data to webhook
            success_url: `${process.env.FRONTEND_URL}/dashboard/tenant?payment=success`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard/tenant?payment=cancelled`,
        });

        res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({ message: 'Failed to create payment session.' });
    }
};

// ============================================
// Stripe Webhook (Receives Raw Body)
// ============================================
exports.stripeWebhook = async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
        } else {
            // For testing locally without secret
            event = JSON.parse(payload.toString());
        }
    } catch (err) {
        console.error('⚠️  Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Fulfill the purchase...
        const metadata = session.metadata;
        
        console.log(`Payment successful for Session ID: ${session.id}`);
        console.log(`Metadata received:`, metadata);

        // TODO: Update database via Prisma
        // e.g., if metadata contains invoiceId, mark it as PAID in database
        // await prisma.invoice.update({
        //     where: { id: parseInt(metadata.invoiceId) },
        //     data: { status: 'PAID', amountPaid: session.amount_total / 100 }
        // });
    }

    res.status(200).send('Webhook received successfully');
};
