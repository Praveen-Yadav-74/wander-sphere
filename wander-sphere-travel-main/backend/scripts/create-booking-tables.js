import { config } from '../config/env.js';
import supabase from '../config/supabase.js';

async function setupBookingTables() {
  try {
    console.log('Setting up booking tables with sample data...');
    
    // Since table creation via RPC is not available, we'll focus on inserting sample data
    // The tables should be created manually in Supabase dashboard or the app will use mock data
    
    // Insert sample data for booking_partners
    console.log('Inserting sample booking partners...');
    const { error: insertPartnersError } = await supabase
      .from('booking_partners')
      .insert([
        {
          name: 'Booking.com',
          description: 'Find and book accommodations worldwide',
          logo_url: '/placeholder.svg',
          website_url: 'https://booking.com',
          commission_rate: 5.0,
          is_active: true,
          categories: ['hotels', 'apartments', 'resorts']
        },
        {
          name: 'Airbnb',
          description: 'Unique stays and experiences',
          logo_url: '/placeholder.svg',
          website_url: 'https://airbnb.com',
          commission_rate: 3.0,
          is_active: true,
          categories: ['apartments', 'houses', 'unique-stays']
        },
        {
          name: 'Expedia',
          description: 'Complete travel booking platform',
          logo_url: '/placeholder.svg',
          website_url: 'https://expedia.com',
          commission_rate: 4.5,
          is_active: true,
          categories: ['hotels', 'flights', 'car-rental']
        }
      ]);
    
    if (insertPartnersError) {
      console.log('Sample partners insertion error:', insertPartnersError.message);
    } else {
      console.log('✓ Sample booking partners inserted');
    }
    
    // Insert sample data for booking_features
    console.log('Inserting sample booking features...');
    const { error: insertFeaturesError } = await supabase
      .from('booking_features')
      .insert([
        {
          title: 'Best Price Guarantee',
          description: 'We guarantee the best prices for your bookings',
          icon: 'dollar-sign',
          is_active: true,
          display_order: 1
        },
        {
          title: '24/7 Customer Support',
          description: 'Round-the-clock assistance for all your travel needs',
          icon: 'headphones',
          is_active: true,
          display_order: 2
        },
        {
          title: 'Instant Confirmation',
          description: 'Get immediate booking confirmations',
          icon: 'check-circle',
          is_active: true,
          display_order: 3
        },
        {
          title: 'Free Cancellation',
          description: 'Cancel your bookings without any charges',
          icon: 'x-circle',
          is_active: true,
          display_order: 4
        }
      ]);
    
    if (insertFeaturesError) {
      console.log('Sample features insertion error:', insertFeaturesError.message);
    } else {
      console.log('✓ Sample booking features inserted');
    }
    
    console.log('\nBooking tables setup completed!');
    
  } catch (error) {
    console.error('Error setting up booking tables:', error);
    process.exit(1);
  }
}

setupBookingTables();