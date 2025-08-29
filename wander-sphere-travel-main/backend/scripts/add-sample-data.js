import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function addSampleData() {
  try {
    console.log('Adding more sample trips...');
    
    const sampleTrips = [
      {
        title: 'Tropical Paradise in Bali',
        description: 'Discover the beautiful beaches, temples, and culture of Bali with fellow travelers.',
        destination: {
          city: 'Ubud',
          country: 'Indonesia',
          coordinates: { lat: -8.5069, lng: 115.2625 }
        },
        start_date: '2024-02-15',
        end_date: '2024-02-25',
        duration: 10,
        max_participants: 12,
        category: 'relaxation'
      },
      {
        title: 'European City Hopping',
        description: 'Visit multiple European capitals in one amazing journey through history and culture.',
        destination: {
          city: 'Prague',
          country: 'Czech Republic',
          coordinates: { lat: 50.0755, lng: 14.4378 }
        },
        start_date: '2024-05-01',
        end_date: '2024-05-14',
        duration: 14,
        max_participants: 8,
        category: 'cultural'
      },
      {
        title: 'Safari Adventure in Kenya',
        description: 'Experience the incredible wildlife of Kenya with guided safari tours and local guides.',
        destination: {
          city: 'Nairobi',
          country: 'Kenya',
          coordinates: { lat: -1.2921, lng: 36.8219 }
        },
        start_date: '2024-06-10',
        end_date: '2024-06-20',
        duration: 10,
        max_participants: 6,
        category: 'adventure'
      },
      {
        title: 'Northern Lights in Iceland',
        description: 'Chase the aurora borealis and explore the stunning landscapes of Iceland.',
        destination: {
          city: 'Reykjavik',
          country: 'Iceland',
          coordinates: { lat: 64.1466, lng: -21.9426 }
        },
        start_date: '2024-11-15',
        end_date: '2024-11-22',
        duration: 7,
        max_participants: 10,
        category: 'adventure'
      },
      {
        title: 'Food Tour Through Italy',
        description: 'Taste authentic Italian cuisine while exploring the beautiful cities of Italy.',
        destination: {
          city: 'Rome',
          country: 'Italy',
          coordinates: { lat: 41.9028, lng: 12.4964 }
        },
        start_date: '2024-09-05',
        end_date: '2024-09-15',
        duration: 10,
        max_participants: 15,
        category: 'cultural'
      }
    ];
    
    const { data, error } = await supabase
      .from('trips')
      .insert(sampleTrips)
      .select();
    
    if (error) {
      console.log('Error adding sample trips:', error.message);
    } else {
      console.log(`✓ Successfully added ${data.length} sample trips`);
      
      // Test the count after adding data
      const { count, error: countError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (countError) {
        console.log('Error counting trips:', countError.message);
      } else {
        console.log(`✓ Total trips in database: ${count}`);
      }
    }
    
  } catch (error) {
    console.error('Failed to add sample data:', error.message);
  }
}

// Run the script
addSampleData();