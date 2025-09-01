import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to existing tables...');
    
    // Check if role column exists in users table
    console.log('Checking users table structure...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userData && userData[0]) {
      const columns = Object.keys(userData[0]);
      console.log('Current users table columns:', columns);
      
      if (!columns.includes('role')) {
        console.log('Adding role column to users table...');
        
        // Since we can't use ALTER TABLE directly, we'll update existing users with a default role
        // and ensure new users get the role field
        const { data: allUsers, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .is('role', null);
        
        if (fetchError) {
          console.log('Could not fetch users to update role. This might mean the column doesn\'t exist yet.');
          console.log('The application will handle this by using default values.');
        } else if (allUsers && allUsers.length > 0) {
          console.log(`Found ${allUsers.length} users without role. Setting default role...`);
          
          // Update users in batches
          for (let i = 0; i < allUsers.length; i += 100) {
            const batch = allUsers.slice(i, i + 100);
            const userIds = batch.map(u => u.id);
            
            const { error: updateError } = await supabase
              .from('users')
              .update({ role: 'user' })
              .in('id', userIds);
            
            if (updateError) {
              console.log(`Error updating batch ${i/100 + 1}:`, updateError.message);
            } else {
              console.log(`Updated batch ${i/100 + 1} (${batch.length} users)`);
            }
          }
        }
      } else {
        console.log('✓ Role column already exists in users table');
      }
    }
    
    // Test the users table with role column
    console.log('\nTesting users table with role...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .limit(1);
      
      if (testError) {
        console.log('❌ Users table test failed:', testError.message);
        console.log('Note: The role column might need to be added manually in Supabase dashboard.');
        console.log('Go to your Supabase project > Table Editor > users table > Add Column:');
        console.log('- Name: role');
        console.log('- Type: varchar');
        console.log('- Default value: user');
        console.log('- Max length: 20');
      } else {
        console.log('✓ Users table with role column is working');
        if (testData && testData[0]) {
          console.log('Sample user data:', testData[0]);
        }
      }
    } catch (err) {
      console.log('Users table test error:', err.message);
    }
    
    console.log('\nColumn addition process completed!');
    console.log('\nIf you see errors above, you may need to manually add the role column in Supabase:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Table Editor');
    console.log('3. Select the "users" table');
    console.log('4. Click "Add Column"');
    console.log('5. Add: name="role", type="varchar", default="user", max_length=20');
    
  } catch (error) {
    console.error('Failed to add missing columns:', error.message);
    process.exit(1);
  }
}

// Run the script
addMissingColumns();