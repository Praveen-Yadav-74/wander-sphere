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

async function setupTargetedRLS() {
  try {
    console.log('Setting up Row Level Security (RLS) policies for existing tables only...');
    
    // Read the targeted SQL file
    const sqlFilePath = path.join(__dirname, 'setup-rls-targeted.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands by semicolon and filter out empty commands and comments
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Filter out empty commands, comments, and commented-out commands
        return cmd.length > 0 && 
               !cmd.startsWith('--') && 
               !cmd.startsWith('/*') &&
               !cmd.includes('-- CREATE POLICY') &&
               !cmd.includes('-- ALTER TABLE') &&
               !cmd.includes('-- GRANT') &&
               !cmd.includes('-- CREATE INDEX') &&
               !cmd.includes('-- ALTER PUBLICATION');
      });
    
    console.log(`Found ${sqlCommands.length} SQL commands to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\nExecuting command ${i + 1}/${sqlCommands.length}:`);
      console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      try {
        // Try using the query method directly
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', command)
          .single();
        
        // If that doesn't work, try a different approach
        if (error || !data) {
          // For DDL commands like CREATE POLICY, we'll need to handle them differently
          // Let's try to execute them using the REST API directly
          const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabase.supabaseKey}`,
              'apikey': supabase.supabaseKey
            },
            body: JSON.stringify({ sql: command })
          });
          
          if (response.ok) {
            console.log(`✅ Command ${i + 1} executed successfully`);
            successCount++;
          } else {
            const errorText = await response.text();
            console.error(`❌ Error executing command ${i + 1}:`, errorText);
            errorCount++;
          }
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception executing command ${i + 1}:`, err.message);
        errorCount++;
      }
      
      // Add a small delay between commands
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('RLS SETUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful commands: ${successCount}`);
    console.log(`❌ Failed commands: ${errorCount}`);
    console.log(`📊 Total commands: ${sqlCommands.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All RLS policies have been set up successfully!');
      console.log('Your application should now be secure with proper Row Level Security.');
    } else {
      console.log('\n⚠️  Some commands failed. Please review the errors above.');
      console.log('You may need to manually fix any remaining issues.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error setting up RLS:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupTargetedRLS();