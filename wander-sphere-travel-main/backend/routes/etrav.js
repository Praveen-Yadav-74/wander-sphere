import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/supabaseAuth.js';
import { config } from '../config/env.js';
import supabase from '../config/supabase.js';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = express.Router();

// Etrav API Configuration
const ETRAV_API_BASE = process.env.ETRAV_API_URL || 'http://api.etrav.in/';
const ETRAV_CONSUMER_KEY = process.env.ETRAV_CONSUMER_KEY || '';
const ETRAV_CONSUMER_SECRET = process.env.ETRAV_CONSUMER_SECRET || '';

/**
 * Helper function to make authenticated requests to Etrav API
 * Uses Node.js built-in http/https modules for compatibility
 */
async function callEtravAPI(endpoint, method = 'POST', payload = {}) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${ETRAV_API_BASE}${endpoint}`);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestData = method === 'POST' && Object.keys(payload).length > 0
        ? JSON.stringify(payload)
        : '';

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'ConsumerKey': ETRAV_CONSUMER_KEY,
          'ConsumerSecret': ETRAV_CONSUMER_SECRET,
          // Alternative auth format (adjust based on actual Etrav API docs)
          // 'Authorization': `Bearer ${ETRAV_CONSUMER_KEY}`,
        },
      };

      if (requestData) {
        options.headers['Content-Length'] = Buffer.byteLength(requestData);
      }

      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(parsedData.message || `Etrav API error: ${res.statusMessage}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Etrav API Request Error:', error);
        reject(error);
      });

      if (requestData) {
        req.write(requestData);
      }

      req.end();
    } catch (error) {
      console.error('Etrav API Error:', error);
      reject(error);
    }
  });
}

// ============================================
// BUS API ENDPOINTS (v2.0)
// ============================================

/**
 * Search buses
 * POST /api/etrav/bus/search
 */
router.post('/bus/search', [
  body('from').notEmpty().withMessage('Origin is required'),
  body('to').notEmpty().withMessage('Destination is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('adults').optional().isInt({ min: 1 }).withMessage('Adults must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { from, to, date, adults = 1 } = req.body;

    // Call Etrav Bus Search API
    // Adjust endpoint and payload structure based on actual Etrav API docs
    const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
      // Adjust these fields based on actual Etrav API structure
      Origin: from,
      Destination: to,
      JourneyDate: date,
      Adults: adults,
      // Add other required fields from Etrav docs
    });

    // Standardize response format
    res.json({
      success: true,
      data: etravResponse,
      message: 'Bus search completed'
    });
  } catch (error) {
    console.error('Bus search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search buses'
    });
  }
});

/**
 * Get bus seat layout
 * POST /api/etrav/bus/seat-layout
 */
router.post('/bus/seat-layout', [
  body('tripId').notEmpty().withMessage('Trip ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tripId } = req.body;

    // Call Etrav Seat Layout API
    const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
      TripId: tripId,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Seat layout retrieved'
    });
  } catch (error) {
    console.error('Seat layout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get seat layout'
    });
  }
});

/**
 * Block seats
 * POST /api/etrav/bus/block
 */
router.post('/bus/block', auth, [
  body('tripId').notEmpty().withMessage('Trip ID is required'),
  body('seatNumbers').isArray().withMessage('Seat numbers must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tripId, seatNumbers, passengerDetails } = req.body;

    // Call Etrav Block API
    const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
      TripId: tripId,
      SeatNumbers: seatNumbers,
      PassengerDetails: passengerDetails,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Seats blocked successfully'
    });
  } catch (error) {
    console.error('Block seats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to block seats'
    });
  }
});

/**
 * Book bus ticket
 * POST /api/etrav/bus/book
 */
router.post('/bus/book', auth, [
  body('blockId').notEmpty().withMessage('Block ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpayOrderId').notEmpty().withMessage('Razorpay Order ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { blockId, paymentId, razorpayOrderId, bookingDetails } = req.body;

    // TODO: Verify Razorpay payment before booking
    // This should check with Razorpay API that payment was successful

    // Call Etrav Book API
    const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
      BlockId: blockId,
      // Add other required fields
    });

    // Save booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'bus',
        pnr: etravResponse.PNR || etravResponse.pnr || null,
        booking_reference: etravResponse.BookingId || etravResponse.bookingId || null,
        total_amount: bookingDetails?.totalAmount || 0,
        currency: bookingDetails?.currency || 'INR',
        booking_details: {
          ...bookingDetails,
          etravResponse,
          paymentId,
          razorpayOrderId
        },
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error saving booking:', bookingError);
      // Don't fail the request - booking was successful with Etrav
    }

    res.json({
      success: true,
      data: {
        booking: booking || null,
        etravResponse
      },
      message: 'Booking confirmed successfully'
    });
  } catch (error) {
    console.error('Book bus error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book ticket'
    });
  }
});

// ============================================
// FLIGHT API ENDPOINTS (v2.5)
// ============================================

/**
 * Search flights
 * POST /api/etrav/flight/search
 */
router.post('/flight/search', [
  body('from').notEmpty().withMessage('Origin is required'),
  body('to').notEmpty().withMessage('Destination is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('adults').optional().isInt({ min: 1 }).withMessage('Adults must be at least 1'),
  body('children').optional().isInt({ min: 0 }).withMessage('Children cannot be negative'),
  body('infants').optional().isInt({ min: 0 }).withMessage('Infants cannot be negative'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { from, to, date, adults = 1, children = 0, infants = 0 } = req.body;

    // Call Etrav Flight Search API
    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      Origin: from,
      Destination: to,
      JourneyDate: date,
      Adults: adults,
      Children: children,
      Infants: infants,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Flight search completed'
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search flights'
    });
  }
});

/**
 * Get fare rules
 * POST /api/etrav/flight/fare-rules
 */
router.post('/flight/fare-rules', [
  body('resultIndex').notEmpty().withMessage('Result Index is required'),
  body('traceId').notEmpty().withMessage('Trace ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { resultIndex, traceId } = req.body;

    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      ResultIndex: resultIndex,
      TraceId: traceId,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Fare rules retrieved'
    });
  } catch (error) {
    console.error('Fare rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fare rules'
    });
  }
});

/**
 * Book flight
 * POST /api/etrav/flight/book
 */
router.post('/flight/book', auth, [
  body('resultIndex').notEmpty().withMessage('Result Index is required'),
  body('traceId').notEmpty().withMessage('Trace ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { resultIndex, traceId, paymentId, passengerDetails, bookingDetails } = req.body;

    // TODO: Verify Razorpay payment

    // Call Etrav Book API
    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      ResultIndex: resultIndex,
      TraceId: traceId,
      PassengerDetails: passengerDetails,
      // Add other required fields
    });

    // Save booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'flight',
        pnr: etravResponse.PNR || etravResponse.pnr || null,
        booking_reference: etravResponse.BookingId || etravResponse.bookingId || null,
        total_amount: bookingDetails?.totalAmount || 0,
        currency: bookingDetails?.currency || 'INR',
        booking_details: {
          ...bookingDetails,
          etravResponse,
          paymentId
        },
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error saving booking:', bookingError);
    }

    res.json({
      success: true,
      data: {
        booking: booking || null,
        etravResponse
      },
      message: 'Flight booking confirmed'
    });
  } catch (error) {
    console.error('Flight book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book flight'
    });
  }
});

// ============================================
// HOTEL API ENDPOINTS (v1.2)
// ============================================

/**
 * Search hotels
 * POST /api/etrav/hotel/search
 */
router.post('/hotel/search', [
  body('city').notEmpty().withMessage('City is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('guests').optional().isInt({ min: 1 }).withMessage('Guests must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { city, checkIn, checkOut, guests = 1, rooms = 1 } = req.body;

    // Call Etrav Hotel Search API
    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      City: city,
      CheckIn: checkIn,
      CheckOut: checkOut,
      Guests: guests,
      Rooms: rooms,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Hotel search completed'
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search hotels'
    });
  }
});

/**
 * Get room types
 * POST /api/etrav/hotel/room-types
 */
router.post('/hotel/room-types', [
  body('hotelId').notEmpty().withMessage('Hotel ID is required'),
  body('resultIndex').notEmpty().withMessage('Result Index is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { hotelId, resultIndex } = req.body;

    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      HotelId: hotelId,
      ResultIndex: resultIndex,
      // Add other required fields
    });

    res.json({
      success: true,
      data: etravResponse,
      message: 'Room types retrieved'
    });
  } catch (error) {
    console.error('Room types error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get room types'
    });
  }
});

/**
 * Book hotel
 * POST /api/etrav/hotel/book
 */
router.post('/hotel/book', auth, [
  body('hotelId').notEmpty().withMessage('Hotel ID is required'),
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { hotelId, roomId, paymentId, guestDetails, bookingDetails } = req.body;

    // TODO: Verify Razorpay payment

    // Call Etrav Book API
    const etravResponse = await callEtravAPI('TradeHost/TradeAPIService.svc/JSONService', 'POST', {
      HotelId: hotelId,
      RoomId: roomId,
      GuestDetails: guestDetails,
      // Add other required fields
    });

    // Save booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'hotel',
        pnr: etravResponse.PNR || etravResponse.pnr || null,
        booking_reference: etravResponse.BookingId || etravResponse.bookingId || null,
        total_amount: bookingDetails?.totalAmount || 0,
        currency: bookingDetails?.currency || 'INR',
        booking_details: {
          ...bookingDetails,
          etravResponse,
          paymentId
        },
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error saving booking:', bookingError);
    }

    res.json({
      success: true,
      data: {
        booking: booking || null,
        etravResponse
      },
      message: 'Hotel booking confirmed'
    });
  } catch (error) {
    console.error('Hotel book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book hotel'
    });
  }
});

export default router;

