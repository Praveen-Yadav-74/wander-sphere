import { config } from '../config/env.js';
import supabase from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createBudgetExpensesTable() {
  try {
    console.log('Creating budget_expenses table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-budget-expenses-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands by semicolon and execute them one by one
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of sqlCommands) {
      if (command.toLowerCase().includes('commit')) continue;
      
      try {
        const { error } = await supabase.rpc('exec', {
          sql: command + ';'
        });
        
        if (error) {
          console.log(`Command execution note: ${error.message}`);
        }
      } catch (err) {
        console.log(`Command execution note: ${err.message}`);
      }
    }
    
    // Test the table creation
    console.log('\nTesting budget_expenses table...');
    const { data, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error testing budget_expenses table:', error.message);
    } else {
      console.log('✅ budget_expenses table created successfully!');
      console.log('Table is ready for use.');
    }
    
    // Also check if we need to update the budgets table structure
    console.log('\nChecking budgets table structure...');
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .limit(1);
    
    if (budgetError) {
      console.log('Note: budgets table might need to be created first.');
    } else {
      console.log('✅ budgets table exists and is accessible.');
    }
    
  } catch (error) {
    console.error('Error creating budget_expenses table:', error.message);
    process.exit(1);
  }
}

// Run the script
createBudgetExpensesTable();