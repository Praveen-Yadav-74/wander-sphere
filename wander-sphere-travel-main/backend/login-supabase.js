import dotenv from 'dotenv';
import supabase from './config/supabase.js';
import fs from 'fs';

dotenv.config();

async function main() {
  try {
    console.log('Logging in via Supabase auth...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'budgettest@example.com',
      password: 'BudgetTest123!'
    });

    if (error) {
      console.error('Login error:', error.message);
      process.exit(1);
    }

    const token = data?.session?.access_token;
    const refresh = data?.session?.refresh_token;
    if (!token) {
      console.error('No access token returned');
      process.exit(1);
    }

    fs.writeFileSync('fresh_token.txt', token, 'utf8');
    console.log('Access token written to fresh_token.txt');
    console.log('Access token:', token);
    if (refresh) {
      fs.writeFileSync('refresh_token.txt', refresh, 'utf8');
      console.log('Refresh token written to refresh_token.txt');
    }
  } catch (e) {
    console.error('Exception during login:', e);
    process.exit(1);
  }
}

main();