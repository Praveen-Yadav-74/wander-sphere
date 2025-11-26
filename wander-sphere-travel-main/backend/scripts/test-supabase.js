import supabase from '../config/supabase.js';
import { config } from '../config/env.js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('Supabase URL:', config.SUPABASE_URL);
  
  try {
    // Test the connection by querying the users table
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log(`Found ${data.length} users in the database.`);
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

testSupabaseConnection();