import dotenv from 'dotenv';
import supabase from './config/supabase.js';

dotenv.config();

async function createSupabaseUser() {
  try {
    // Create user using Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'budgettest@example.com',
      password: 'BudgetTest123!',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Budget',
        last_name: 'Test',
        username: 'budgettest'
      }
    });

    if (error) {
      console.log('Error creating Supabase user:', error);
    } else {
      console.log('Supabase user created:', data);
      console.log('User ID:', data.user.id);
      
      // Now try to login to get a token
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'budgettest@example.com',
        password: 'BudgetTest123!'
      });
      
      if (loginError) {
        console.log('Error logging in:', loginError);
      } else {
        console.log('Login successful!');
        console.log('Access Token:', loginData.session.access_token);
        console.log('Refresh Token:', loginData.session.refresh_token);
      }
    }
  } catch (error) {
    console.log('Exception:', error);
  }
}

createSupabaseUser();