import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Import supabase after loading env
import supabase from './config/supabase.js';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Found', data.length, 'users');
      if (data.length > 0) {
        console.log('Sample user:', data[0].email);
      }
    }
  } catch (error) {
    console.error('Connection test error:', error.message);
  }
}

testConnection();