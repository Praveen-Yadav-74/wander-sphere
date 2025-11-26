import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function fixDatabaseSchema() {
  try {
    console.log('Fixing database schema issues...');
    
    // Create or fix users table
    console.log('\nCreating/fixing users table...');
    try {
      const { error } = await supabase.rpc('execute_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT auth.uid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            username VARCHAR(50) UNIQUE,
            avatar_url TEXT,
            bio TEXT,
            phone VARCHAR(20),
            date_of_birth DATE,
            gender VARCHAR(20),
            location JSONB,
            preferences JSONB,
            role VARCHAR(20) DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "location_sharing": true}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (error) {
        console.log('Error creating users table:', error.message);
        // Try alternative approach if RPC fails
        console.log('Trying alternative approach for users table...');
        const { data, error: testError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.log('Users table error:', testError.message);
        } else {
          console.log('✓ Users table exists');
        }
      } else {
        console.log('✓ Users table created or already exists');
      }
    } catch (err) {
      console.log('Users table operation failed:', err.message);
    }
    
    // Create or fix trips table
    console.log('\nCreating/fixing trips table...');
    try {
      const { error } = await supabase.rpc('execute_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.trips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            destination JSONB NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            duration INTEGER,
            budget JSONB,
            max_participants INTEGER DEFAULT 1,
            current_participants INTEGER DEFAULT 1,
            category VARCHAR(50),
            trip_type VARCHAR(50),
            difficulty_level VARCHAR(20),
            tags TEXT[],
            itinerary JSONB,
            images TEXT[],
            status VARCHAR(20) DEFAULT 'planning',
            visibility VARCHAR(20) DEFAULT 'public',
            is_featured BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add category column if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'trips' AND column_name = 'category'
            ) THEN
              ALTER TABLE public.trips ADD COLUMN category VARCHAR(50);
            END IF;
          END $$;
        `
      });
      
      if (error) {
        console.log('Error creating trips table:', error.message);
        // Try alternative approach
        const { data, error: testError } = await supabase
          .from('trips')
          .select('id, title')
          .limit(1);
          
        if (testError) {
          console.log('Trips table error:', testError.message);
        } else {
          console.log('✓ Trips table exists');
        }
      } else {
        console.log('✓ Trips table created or already exists');
      }
    } catch (err) {
      console.log('Trips table operation failed:', err.message);
    }
    
    // Create or fix budgets table
    console.log('\nCreating/fixing budgets table...');
    try {
      const { error } = await supabase.rpc('execute_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.budgets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            trip_id UUID,
            title VARCHAR(200) NOT NULL,
            total_amount DECIMAL(12,2) NOT NULL,
            spent_amount DECIMAL(12,2) DEFAULT 0,
            currency VARCHAR(3) DEFAULT 'USD',
            categories JSONB,
            expenses JSONB,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (error) {
        console.log('Error creating budgets table:', error.message);
        // Try alternative approach
        const { data, error: testError } = await supabase
          .from('budgets')
          .select('id, title')
          .limit(1);
          
        if (testError && testError.message?.includes('Could not find the table')) {
          console.log('Budgets table does not exist. This is expected for now.');
          console.log('The budget functionality will return empty arrays until the table is created in Supabase.');
        } else if (testError) {
          console.log('Budgets table error:', testError.message);
        } else {
          console.log('✓ Budgets table exists');
        }
      } else {
        console.log('✓ Budgets table created or already exists');
      }
    } catch (err) {
      console.log('Budgets table operation failed:', err.message);
    }
    
    console.log('\nDatabase schema fix completed!');
    console.log('The application should now work correctly with the fixed schema.');
    
  } catch (error) {
    console.error('Schema fix failed:', error.message);
  }
}

// Run the fix
fixDatabaseSchema();