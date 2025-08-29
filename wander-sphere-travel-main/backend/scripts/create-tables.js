import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function createTables() {
  try {
    console.log('Creating essential tables manually...');
    
    // Create a simple test table first to verify connection
    console.log('Testing Supabase connection...');
    
    // Try to create users table by inserting a test record and letting Supabase auto-create
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          is_active: true
        })
        .select();
      
      if (error) {
        console.log('Users table does not exist. Error:', error.message);
      } else {
        console.log('✓ Users table exists and working');
        // Delete the test record
        await supabase.from('users').delete().eq('email', 'test@example.com');
      }
    } catch (err) {
      console.log('Users table test failed:', err.message);
    }
    
    // Try to create trips table by inserting a test record
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          title: 'Test Trip',
          description: 'A test trip',
          destination: { city: 'Test City', country: 'Test Country' },
          start_date: '2024-01-01',
          end_date: '2024-01-07',
          duration: 7,
          budget: { total: 1000, currency: 'USD' },
          is_active: true
        })
        .select();
      
      if (error) {
        console.log('Trips table does not exist. Error:', error.message);
      } else {
        console.log('✓ Trips table exists and working');
        // Delete the test record
        await supabase.from('trips').delete().eq('title', 'Test Trip');
      }
    } catch (err) {
      console.log('Trips table test failed:', err.message);
    }
    
    // Create some sample data for testing
    console.log('\nCreating sample data for testing...');
    
    // Sample trips data
    const sampleTrips = [
      {
        title: 'Mountain Adventure in Nepal',
        description: 'Experience the breathtaking beauty of the Himalayas with this guided trekking adventure.',
        destination: {
          city: 'Kathmandu',
          country: 'Nepal',
          coordinates: { lat: 27.7172, lng: 85.3240 }
        },
        start_date: '2024-03-15',
        end_date: '2024-03-25',
        duration: 10,
        budget: {
          total: 2500,
          currency: 'USD',
          breakdown: {
            accommodation: 800,
            food: 600,
            transport: 700,
            activities: 400
          }
        },
        max_participants: 8,
        current_participants: 3,
        category: 'adventure',
        difficulty_level: 'challenging',
        tags: ['hiking', 'mountains', 'culture'],
        images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
        status: 'active',
        is_featured: true,
        is_active: true
      },
      {
        title: 'Cultural Tour of Japan',
        description: 'Immerse yourself in Japanese culture, from ancient temples to modern cities.',
        destination: {
          city: 'Tokyo',
          country: 'Japan',
          coordinates: { lat: 35.6762, lng: 139.6503 }
        },
        start_date: '2024-04-10',
        end_date: '2024-04-20',
        duration: 10,
        budget: {
          total: 3500,
          currency: 'USD',
          breakdown: {
            accommodation: 1200,
            food: 800,
            transport: 900,
            activities: 600
          }
        },
        max_participants: 12,
        current_participants: 7,
        category: 'cultural',
        difficulty_level: 'easy',
        tags: ['culture', 'temples', 'food', 'cities'],
        images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e'],
        status: 'active',
        is_featured: false,
        is_active: true
      }
    ];
    
    // Try to insert sample trips
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert(sampleTrips)
        .select();
      
      if (error) {
        console.log('Could not create sample trips:', error.message);
      } else {
        console.log(`✓ Created ${data.length} sample trips`);
      }
    } catch (err) {
      console.log('Sample trips creation failed:', err.message);
    }
    
    console.log('\nSetup completed! Check your Supabase dashboard to verify tables.');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
createTables();