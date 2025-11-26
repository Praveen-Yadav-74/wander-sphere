import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env file in the backend directory.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to execute SQL commands
async function executeSqlFile(filePath, description) {
    console.log(`\n🔄 ${description}...`);
    
    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL content into individual commands
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => {
                // Filter out empty commands and comments
                return cmd.length > 0 && 
                       !cmd.startsWith('--') && 
                       !cmd.startsWith('/*') &&
                       cmd !== '';
            });

        console.log(`   Found ${commands.length} SQL commands to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (!command) continue;
            
            try {
                // Use direct SQL execution via Supabase
                const { data, error } = await supabase.rpc('exec', {
                    sql: command
                });
                
                if (error) {
                    console.error(`   ❌ Command ${i + 1} failed:`, error.message);
                    errorCount++;
                } else {
                    successCount++;
                    if (i % 10 === 0 || i === commands.length - 1) {
                        console.log(`   ✅ Executed ${i + 1}/${commands.length} commands`);
                    }
                }
            } catch (err) {
                console.error(`   ❌ Command ${i + 1} failed:`, err.message);
                errorCount++;
            }
        }
        
        console.log(`\n📊 ${description} Results:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);
        
        return { successCount, errorCount };
        
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        return { successCount: 0, errorCount: 1 };
    }
}

// Function to verify database setup
async function verifyDatabaseSetup() {
    console.log('\n🔍 Verifying database setup...');
    
    const tablesToCheck = [
        'users', 'trips', 'budgets', 'journeys', 'stories', 'clubs',
        'notifications', 'trip_participants', 'trip_comments', 
        'trip_likes', 'trip_comment_likes', 'user_relationships',
        'blocked_users', 'refresh_tokens'
    ];
    
    let verificationResults = [];
    
    for (const table of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                verificationResults.push({ table, status: 'error', message: error.message });
            } else {
                verificationResults.push({ table, status: 'success', message: 'Table accessible' });
            }
        } catch (err) {
            verificationResults.push({ table, status: 'error', message: err.message });
        }
    }
    
    console.log('\n📋 Database Verification Results:');
    verificationResults.forEach(result => {
        const icon = result.status === 'success' ? '✅' : '❌';
        console.log(`   ${icon} ${result.table}: ${result.message}`);
    });
    
    const successfulTables = verificationResults.filter(r => r.status === 'success').length;
    console.log(`\n📊 Summary: ${successfulTables}/${tablesToCheck.length} tables verified successfully`);
    
    return successfulTables === tablesToCheck.length;
}

// Main setup function
async function setupFreshDatabase() {
    console.log('🚀 Starting Fresh Database Setup for Wander Sphere Travel');
    console.log('=' .repeat(60));
    
    const scriptsDir = __dirname;
    const databaseSetupFile = path.join(scriptsDir, 'fresh-database-setup.sql');
    const rlsPoliciesFile = path.join(scriptsDir, 'fresh-rls-policies.sql');
    
    // Check if files exist
    if (!fs.existsSync(databaseSetupFile)) {
        console.error(`❌ Database setup file not found: ${databaseSetupFile}`);
        process.exit(1);
    }
    
    if (!fs.existsSync(rlsPoliciesFile)) {
        console.error(`❌ RLS policies file not found: ${rlsPoliciesFile}`);
        process.exit(1);
    }
    
    try {
        // Step 1: Create fresh database structure
        const dbResults = await executeSqlFile(
            databaseSetupFile, 
            'Creating fresh database structure'
        );
        
        if (dbResults.errorCount > 0) {
            console.log('\n⚠️  Some database creation commands failed. Continuing with RLS setup...');
        }
        
        // Step 2: Apply RLS policies
        const rlsResults = await executeSqlFile(
            rlsPoliciesFile, 
            'Applying Row Level Security policies'
        );
        
        // Step 3: Verify setup
        const verificationSuccess = await verifyDatabaseSetup();
        
        // Final summary
        console.log('\n' + '=' .repeat(60));
        console.log('🎯 Fresh Database Setup Summary:');
        console.log(`   📊 Database Commands: ${dbResults.successCount} success, ${dbResults.errorCount} failed`);
        console.log(`   🔒 RLS Commands: ${rlsResults.successCount} success, ${rlsResults.errorCount} failed`);
        console.log(`   ✅ Verification: ${verificationSuccess ? 'PASSED' : 'FAILED'}`);
        
        if (verificationSuccess && dbResults.errorCount === 0 && rlsResults.errorCount === 0) {
            console.log('\n🎉 Fresh database setup completed successfully!');
            console.log('   Your Wander Sphere Travel database is ready to use.');
        } else if (verificationSuccess) {
            console.log('\n✅ Database setup completed with some warnings.');
            console.log('   Core functionality should work, but check the errors above.');
        } else {
            console.log('\n❌ Database setup completed with errors.');
            console.log('   Please review the errors and run the setup again if needed.');
        }
        
        console.log('\n📝 Next Steps:');
        console.log('   1. Test your application endpoints');
        console.log('   2. Create your first user account');
        console.log('   3. Verify authentication is working');
        console.log('   4. Test trip creation and management');
        
    } catch (error) {
        console.error('\n💥 Fatal error during database setup:', error.message);
        process.exit(1);
    }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
    setupFreshDatabase().catch(error => {
        console.error('💥 Unhandled error:', error);
        process.exit(1);
    });
}

export { setupFreshDatabase, executeSqlFile, verifyDatabaseSetup };