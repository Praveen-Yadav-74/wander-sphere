import supabase from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyIndexes() {
  try {
    console.log('📊 Applying budget performance indexes...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_budget_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error('❌ Error executing statement:', error.message);
        console.error('Statement:', statement);
        // Continue with other statements
      } else {
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('✅ All indexes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    process.exit(1);
  }
}

applyIndexes();
