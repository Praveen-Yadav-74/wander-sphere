import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export environment variables for use in other modules
export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://wander-sphere-zpml.vercel.app' 
    : 'http://localhost:8080'),
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? 1000 : 100),
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760,
  MAX_FILES_PER_REQUEST: process.env.MAX_FILES_PER_REQUEST || 5,
  // Etrav API Configuration
  ETRAV_API_URL: process.env.ETRAV_API_URL || 'http://api.etrav.in/',
  ETRAV_CONSUMER_KEY: process.env.ETRAV_CONSUMER_KEY || '',
  ETRAV_CONSUMER_SECRET: process.env.ETRAV_CONSUMER_SECRET || '',
  // Razorpay Configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ''
};

// Only log non-sensitive configuration in development
if (config.NODE_ENV === 'development') {
  console.log('Environment configuration loaded:');
  console.log('NODE_ENV:', config.NODE_ENV);
  console.log('PORT:', config.PORT);
  console.log('SUPABASE_URL:', config.SUPABASE_URL ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', config.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
}