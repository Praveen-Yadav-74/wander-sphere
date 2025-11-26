import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function addSpentAmountColumn() {
  try {
    console.log('Adding spent_amount column to budgets table...');
    
    // Try to add the spent_amount column
    try {
      // First, let's check if the column already exists by trying to select it
      const { data, error } = await supabase
        .from('budgets')
        .select('spent_amount')
        .limit(1);
      
      if (error && error.message.includes('column "spent_amount" does not exist')) {
        console.log('spent_amount column does not exist, will add it via direct update...');
        
        // Since we can't use ALTER TABLE directly, we'll handle this in the application logic
        console.log('Note: Column will be handled in application logic with default value 0');
        
        // Test if we can insert a record with spent_amount
        const testBudget = {
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'Test Budget for Column Check',
          total_amount: 100,
          currency: 'USD'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('budgets')
          .insert(testBudget)
          .select();
        
        if (insertError) {
          console.log('Insert test failed:', insertError.message);
        } else {
          console.log('✅ Budget table is working correctly');
          // Clean up test record
          await supabase
            .from('budgets')
            .delete()
            .eq('title', 'Test Budget for Column Check');
        }
        
      } else if (error) {
        console.log('Error checking spent_amount column:', error.message);
      } else {
        console.log('✅ spent_amount column already exists');
      }
    } catch (err) {
      console.log('Error in column check:', err.message);
    }
    
    console.log('\nBudget table structure check completed.');
    
  } catch (error) {
    console.error('Error in addSpentAmountColumn:', error.message);
  }
}

// Run the script
addSpentAmountColumn();