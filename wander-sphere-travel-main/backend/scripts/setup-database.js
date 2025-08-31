import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function setupDatabase() {
  try {
    console.log('Setting up essential database tables...');
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          username VARCHAR(50) UNIQUE,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          avatar TEXT DEFAULT '',
          bio TEXT DEFAULT '',
          location TEXT DEFAULT '',
          date_of_birth DATE,
          phone VARCHAR(20) DEFAULT '',
          is_email_verified BOOLEAN DEFAULT FALSE,
          preferences JSONB DEFAULT '{}',
          stats JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.log('Users table might already exist or error:', usersError.message);
    } else {
      console.log('✓ Users table created');
    }
    
    // Create trips table
    console.log('Creating trips table...');
    const { error: tripsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS trips (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          destination JSONB NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          duration INTEGER NOT NULL,
          budget JSONB NOT NULL DEFAULT '{}',
          max_participants INTEGER DEFAULT 10,
          current_participants INTEGER DEFAULT 1,
          organizer_id UUID,
          category VARCHAR(50) DEFAULT 'adventure',
          difficulty_level VARCHAR(20) DEFAULT 'moderate',
          tags TEXT[] DEFAULT '{}',
          images TEXT[] DEFAULT '{}',
          itinerary JSONB DEFAULT '[]',
          requirements TEXT DEFAULT '',
          cancellation_policy TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'active',
          is_featured BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (tripsError) {
      console.log('Trips table might already exist or error:', tripsError.message);
    } else {
      console.log('✓ Trips table created');
    }
    
    // Test the setup
    console.log('\nTesting database setup...');
    const tables = ['users', 'trips'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✓ Table '${table}': exists (${count || 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
    console.log('\nDatabase setup completed!');
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();