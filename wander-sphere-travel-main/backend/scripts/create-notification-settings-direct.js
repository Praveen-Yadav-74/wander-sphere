import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

// Initialize Supabase client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

async function createNotificationSettingsTable() {
  try {
    console.log('Creating notification_settings table...');
    
    // SQL to create the notification_settings table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.notification_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        trip_updates BOOLEAN DEFAULT true,
        new_followers BOOLEAN DEFAULT true,
        trip_invitations BOOLEAN DEFAULT true,
        journey_likes BOOLEAN DEFAULT true,
        journey_comments BOOLEAN DEFAULT true,
        marketing_emails BOOLEAN DEFAULT false,
        weekly_digest BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        UNIQUE(user_id)
      );
    `;
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec', {
      sql: createTableSQL
    });
    
    if (error) {
      console.error('Error creating table with RPC:', error);
      
      // Try alternative approach using raw SQL
      console.log('Trying alternative approach...');
      
      // Use the SQL editor approach
      const { data: queryData, error: queryError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notification_settings');
      
      if (queryError) {
        console.error('Error checking table existence:', queryError);
        return;
      }
      
      if (queryData && queryData.length > 0) {
        console.log('✅ notification_settings table already exists');
      } else {
        console.log('❌ notification_settings table does not exist');
        console.log('Please create the table manually in Supabase SQL Editor:');
        console.log('\n' + createTableSQL);
        
        // Also create the trigger for updated_at
        const triggerSQL = `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          CREATE TRIGGER update_notification_settings_updated_at
            BEFORE UPDATE ON public.notification_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `;
        
        console.log('\nAnd the trigger:');
        console.log(triggerSQL);
      }
    } else {
      console.log('✅ notification_settings table created successfully');
      
      // Create the trigger for updated_at
      const triggerSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = TIMEZONE('utc'::text, NOW());
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_notification_settings_updated_at
          BEFORE UPDATE ON public.notification_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;
      
      const { error: triggerError } = await supabase.rpc('exec', {
        sql: triggerSQL
      });
      
      if (triggerError) {
        console.warn('Warning: Could not create trigger:', triggerError);
      } else {
        console.log('✅ Trigger created successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createNotificationSettingsTable()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });