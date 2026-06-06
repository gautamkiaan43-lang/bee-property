const twilio = require('twilio');

const sendSMS = async (to, body) => {
    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const message = await client.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to // Ensure the number has country code, e.g., +1234567890
        });
        console.log(`SMS sent successfully to ${to}, SID: ${message.sid}`);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

module.exports = { sendSMS };
