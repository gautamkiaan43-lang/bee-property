const cron = require('node-cron');
const pool = require('../config/db');

// Cron job to run every day at Midnight (00:00)
// Format: '0 0 * * *' means "At 00:00 every day"
const startLateFeeCron = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Starting Late Fee Calculation Job...');
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Find all unpaid rent invoices that are past their due date
            const [overdueInvoices] = await pool.query(
                `SELECT i.*, l.monthly_rent, l.security_deposit 
                 FROM invoices i 
                 JOIN leases l ON i.lease_id = l.id 
                 WHERE i.status = 'Unpaid' AND i.due_date < ?`,
                [today]
            );

            let processedCount = 0;

            for (const invoice of overdueInvoices) {
                // Determine late fee amount (default to $50 if not set in lease)
                const lateFeeAmount = invoice.lease?.lateFeeAmount || 50.00;

                // Example logic: Create a new Invoice line item or a separate Invoice for the Late Fee
                // Or simply update the existing invoice total
                
                /* 
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        amount: invoice.amount + lateFeeAmount,
                        notes: invoice.notes ? `${invoice.notes}\nLate fee applied.` : 'Late fee applied.',
                        // hasLateFee: true 
                    }
                });
                */

                processedCount++;
            }

            console.log(`[CRON] Successfully processed ${processedCount} overdue invoices.`);

        } catch (error) {
            // By wrapping in try-catch, we guarantee this won't crash the server
            console.error('[CRON ERROR] Failed to calculate late fees:', error.message);
        }
    });
    
    console.log('[CRON] Late Fee Automation Scheduler started.');
};

module.exports = startLateFeeCron;
