// Ideally these should be in .env, but for now we centralize them here
// to ensure they work without complex .env file manipulation via CLI.

export const PAYMENT_CONFIG = {
    ACTIVE_GATEWAY: process.env.ACTIVE_GATEWAY || 'RAZORPAY', // 'RAZORPAY' or 'PHONEPE'
    
    PHONEPE: {
        MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || 'M23CPC6XYW31I_2601111816',
        SALT_KEY: process.env.PHONEPE_SALT_KEY || 'NjQ3MDViYTgtODI1Mi00MjRjLTk0NDgtNTZkMTQwOWIzNjFk',
        SALT_INDEX: process.env.PHONEPE_SALT_INDEX || 1,
        HOST_URL: 'https://api.phonepe.com/apis/hermes', // Production
        // HOST_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox' // UAT
    }
};

export const setGateway = (gateway) => {
    PAYMENT_CONFIG.ACTIVE_GATEWAY = gateway;
    console.log(`Payment Gateway switched to: ${gateway}`);
};
