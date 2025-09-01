import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Create Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addRoleColumn() {
  try {
    console.log('Adding role column to users table...');
    
    // First, check if the role column already exists by trying to select it
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .limit(1);
    
    if (error && error.message.includes('column "role" does not exist')) {
      console.log('Role column does not exist. This needs to be added manually in Supabase dashboard.');
      console.log('\nTo add the role column:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Table Editor');
      console.log('3. Select the "users" table');
      console.log('4. Click "Add Column"');
      console.log('5. Set:');
      console.log('   - Name: role');
      console.log('   - Type: varchar');
      console.log('   - Length: 20');
      console.log('   - Default value: user');
      console.log('   - Allow nullable: false');
      console.log('6. Click "Save"');
      console.log('\nAlternatively, run this SQL in the Supabase SQL Editor:');
      console.log('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT \'user\';');
    } else if (error) {
      console.log('Error checking role column:', error.message);
    } else {
      console.log('✓ Role column already exists in users table');
      console.log(`Found ${data?.length || 0} users with role data`);
      
      // Check if any users have null roles and update them
      const { data: usersWithoutRole, error: nullRoleError } = await supabase
        .from('users')
        .select('id, email, role')
        .is('role', null);
      
      if (nullRoleError) {
        console.log('Error checking for users without roles:', nullRoleError.message);
      } else if (usersWithoutRole && usersWithoutRole.length > 0) {
        console.log(`Found ${usersWithoutRole.length} users without roles. Updating to 'user'...`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'user' })
          .is('role', null);
        
        if (updateError) {
          console.log('Error updating user roles:', updateError.message);
        } else {
          console.log('✓ Updated users without roles to default "user" role');
        }
      } else {
        console.log('✓ All users have roles assigned');
      }
    }
    
    // Test the users table structure
    console.log('\nTesting users table structure...');
    const { data: sampleUser, error: structureError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, is_active')
      .limit(1);
    
    if (structureError) {
      console.log('Users table structure test failed:', structureError.message);
    } else {
      console.log('✓ Users table structure is working correctly');
      if (sampleUser && sampleUser.length > 0) {
        console.log('Sample user structure:', {
          id: sampleUser[0].id ? '[UUID]' : 'missing',
          first_name: sampleUser[0].first_name || 'empty',
          last_name: sampleUser[0].last_name || 'empty',
          email: sampleUser[0].email || 'empty',
          role: sampleUser[0].role || 'missing',
          is_active: sampleUser[0].is_active !== undefined ? sampleUser[0].is_active : 'missing'
        });
      }
    }
    
    console.log('\nRole column setup completed!');
    
  } catch (error) {
    console.error('Role column setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
addRoleColumn();