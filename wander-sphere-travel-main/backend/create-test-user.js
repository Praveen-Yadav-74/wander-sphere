import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import supabase from './config/supabase.js';

dotenv.config();

async function createTestUser() {
  const userId = randomUUID();
  console.log('Creating user with ID:', userId);

  try {
    // Create a test user directly
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        first_name: 'Budget',
        last_name: 'Test',
        username: 'budgettest',
        email: 'budgettest@example.com',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.log('Error creating user:', error);
    } else {
      console.log('User created:', data);
      console.log('User ID:', userId);
    }
  } catch (error) {
    console.log('Exception:', error);
  }
}

createTestUser();