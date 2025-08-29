import express from 'express';
import supabase from '../config/supabase.js';
import { auth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Get booking partners
router.get('/partners', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = supabase.from('booking_partners').select('*');
    
    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }
    
    const { data: partners, error } = await query.order('name');

    if (error) {
      console.error('Error fetching booking partners:', error);
      return res.status(500).json({ message: 'Error fetching booking partners' });
    }

    // Return mock data if no partners found
    const mockPartners = [
      {
        id: '1',
        name: 'Booking.com',
        description: 'Find and book accommodations worldwide',
        logo_url: '/placeholder.svg',
        website_url: 'https://booking.com',
        commission_rate: 5.0,
        is_active: true,
        categories: ['hotels', 'apartments', 'resorts']
      },
      {
        id: '2',
        name: 'Airbnb',
        description: 'Unique stays and experiences',
        logo_url: '/placeholder.svg',
        website_url: 'https://airbnb.com',
        commission_rate: 3.0,
        is_active: true,
        categories: ['apartments', 'houses', 'unique-stays']
      },
      {
        id: '3',
        name: 'Expedia',
        description: 'Complete travel booking platform',
        logo_url: '/placeholder.svg',
        website_url: 'https://expedia.com',
        commission_rate: 4.5,
        is_active: true,
        categories: ['hotels', 'flights', 'car-rental']
      }
    ];

    res.json(partners && partners.length > 0 ? partners : mockPartners);
  } catch (error) {
    console.error('Error in GET /booking/partners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get booking features
router.get('/features', async (req, res) => {
  try {
    const { data: features, error } = await supabase
      .from('booking_features')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching booking features:', error);
      return res.status(500).json({ message: 'Error fetching booking features' });
    }

    // Return mock data if no features found
    const mockFeatures = [
      {
        id: '1',
        title: 'Best Price Guarantee',
        description: 'We guarantee the best prices for your bookings',
        icon: 'dollar-sign',
        is_active: true,
        display_order: 1
      },
      {
        id: '2',
        title: '24/7 Customer Support',
        description: 'Round-the-clock assistance for all your travel needs',
        icon: 'headphones',
        is_active: true,
        display_order: 2
      },
      {
        id: '3',
        title: 'Instant Confirmation',
        description: 'Get immediate booking confirmations',
        icon: 'check-circle',
        is_active: true,
        display_order: 3
      },
      {
        id: '4',
        title: 'Secure Payments',
        description: 'Your payment information is always protected',
        icon: 'shield',
        is_active: true,
        display_order: 4
      }
    ];

    res.json(features && features.length > 0 ? features : mockFeatures);
  } catch (error) {
    console.error('Error in GET /booking/features:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const offset = (page - 1) * limit;
    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user bookings:', error);
      return res.status(500).json({ message: 'Error fetching bookings' });
    }

    res.json(bookings || []);
  } catch (error) {
    console.error('Error in GET /booking/my-bookings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      partner_id,
      booking_type,
      destination,
      check_in_date,
      check_out_date,
      guests,
      total_amount,
      currency,
      booking_details
    } = req.body;
    
    if (!partner_id || !booking_type || !destination) {
      return res.status(400).json({ 
        message: 'Partner ID, booking type, and destination are required' 
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        partner_id,
        booking_type,
        destination,
        check_in_date,
        check_out_date,
        guests: guests || 1,
        total_amount,
        currency: currency || 'USD',
        booking_details,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ message: 'Error creating booking' });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error in POST /booking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update booking status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return res.status(500).json({ message: 'Error updating booking status' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error in PATCH /booking/:id/status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;