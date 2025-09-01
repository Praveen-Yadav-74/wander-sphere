import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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
  console.error('Missing Supabase environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'undefined');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupRLS() {
  try {
    console.log('Setting up Row Level Security (RLS) policies...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands by semicolon and filter out empty commands
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`Found ${sqlCommands.length} SQL commands to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Skip comments and empty commands
      if (command.startsWith('--') || command.startsWith('/*') || command.trim() === '') {
        continue;
      }
      
      try {
        console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: command
        });
        
        if (error) {
          console.log(`⚠️  Command ${i + 1} warning:`, error.message);
          // Some errors are expected (like "already exists" errors)
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist') &&
              !error.message.includes('permission denied')) {
            errorCount++;
          }
        } else {
          successCount++;
          console.log(`✓ Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Command ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n=== RLS Setup Summary ===');
    console.log(`✓ Successful commands: ${successCount}`);
    console.log(`⚠️  Commands with warnings/errors: ${errorCount}`);
    
    // Test the setup by checking if RLS is enabled on key tables
    console.log('\nTesting RLS setup...');
    
    const tablesToTest = ['users', 'trips', 'budgets', 'notifications'];
    
    for (const table of tablesToTest) {
      try {
        // Try to query the table (this will test RLS policies)
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('permission denied') || 
              error.message.includes('RLS')) {
            console.log(`✓ Table '${table}': RLS is active (permission denied as expected)`);
          } else {
            console.log(`⚠️  Table '${table}': ${error.message}`);
          }
        } else {
          console.log(`✓ Table '${table}': Accessible (${data?.length || 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. Check your Supabase dashboard for any remaining security warnings');
    console.log('2. Test your application to ensure RLS policies work correctly');
    console.log('3. Review and adjust policies if needed based on your app requirements');
    console.log('\nRLS setup completed!');
    
  } catch (error) {
    console.error('RLS setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using individual policy creation
async function setupRLSAlternative() {
  try {
    console.log('Setting up RLS using alternative method...');
    
    // Enable RLS on key tables
    const tables = [
      'users', 'trips', 'budgets', 'journeys', 
      'notifications', 'stories', 'clubs', 
      'refresh_tokens', 'trip_comment_likes'
    ];
    
    for (const table of tables) {
      try {
        console.log(`Enabling RLS on ${table}...`);
        
        const { error } = await supabase.rpc('exec', {
          sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
        });
        
        if (error && !error.message.includes('already')) {
          console.log(`⚠️  ${table}:`, error.message);
        } else {
          console.log(`✓ RLS enabled on ${table}`);
        }
      } catch (err) {
        console.log(`❌ Failed to enable RLS on ${table}:`, err.message);
      }
    }
    
    // Create basic policies for users table
    const userPolicies = [
      {
        name: 'Users can view their own profile',
        sql: `CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);`
      },
      {
        name: 'Users can update their own profile',
        sql: `CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);`
      },
      {
        name: 'Users can insert their own profile',
        sql: `CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);`
      }
    ];
    
    for (const policy of userPolicies) {
      try {
        const { error } = await supabase.rpc('exec', { sql: policy.sql });
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️  ${policy.name}:`, error.message);
        } else {
          console.log(`✓ Created policy: ${policy.name}`);
        }
      } catch (err) {
        console.log(`❌ Failed to create policy ${policy.name}:`, err.message);
      }
    }
    
    console.log('\nAlternative RLS setup completed!');
    
  } catch (error) {
    console.error('Alternative RLS setup failed:', error.message);
  }
}

// Run the setup
if (process.argv.includes('--alternative')) {
  setupRLSAlternative();
} else {
  setupRLS();
}

export { setupRLS, setupRLSAlternative };