const express = require('express');
const { query, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/supabaseAuth');
const SupabaseTrip = require('../models/SupabaseTrip');
const { Client } = require('@googlemaps/google-maps-services-js');

const router = express.Router();

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Validate Google Maps API key
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn('Warning: GOOGLE_MAPS_API_KEY not found in environment variables. Maps functionality will be limited.');
}

// @route   GET /api/maps/geocode
// @desc    Geocode an address to coordinates
// @access  Public
router.get('/geocode', [
  query('address').trim().isLength({ min: 3 }).withMessage('Address must be at least 3 characters')
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

    const { address } = req.query;
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }
    
    // Use Google Maps Geocoding API
    const response = await googleMapsClient.geocode({ 
      params: { 
        address, 
        key: process.env.GOOGLE_MAPS_API_KEY 
      } 
    });
    
    if (response.data.status !== 'OK' || !response.data.results.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    const result = response.data.results[0];
    const location = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id
    };
    
    res.json({
      success: true,
      data: {
        location,
        query: address
      }
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while geocoding address'
    });
  }
});

// @route   GET /api/maps/reverse-geocode
// @desc    Reverse geocode coordinates to address
// @access  Public
router.get('/reverse-geocode', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
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

    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }
    
    // Use Google Maps Reverse Geocoding API
    const response = await googleMapsClient.reverseGeocode({ 
      params: { 
        latlng: `${latitude},${longitude}`, 
        key: process.env.GOOGLE_MAPS_API_KEY 
      } 
    });
    
    if (response.data.status !== 'OK' || !response.data.results.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found for coordinates'
      });
    }
    
    const result = response.data.results[0];
    const address = {
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      address_components: result.address_components
    };
    
    res.json({
      success: true,
      data: {
        address,
        coordinates: { lat: latitude, lng: longitude }
      }
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reverse geocoding coordinates'
    });
  }
});

// @route   GET /api/maps/places/nearby
// @desc    Find places near a location
// @access  Public
router.get('/places/nearby', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('Radius must be between 100 and 50000 meters'),
  query('type').optional().isIn(['restaurant', 'lodging', 'tourist_attraction', 'gas_station', 'hospital', 'pharmacy', 'bank', 'atm'])
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

    const { lat, lng, radius = 5000, type } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }
    
    // Use Google Maps Places Nearby API
    const params = {
      location: `${latitude},${longitude}`,
      radius: parseInt(radius),
      key: process.env.GOOGLE_MAPS_API_KEY
    };
    
    if (type) {
      params.type = type;
    }
    
    const response = await googleMapsClient.placesNearby({ params });
    
    if (response.data.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: `Places API error: ${response.data.status}`
      });
    }
    
    const places = response.data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      types: place.types,
      geometry: place.geometry,
      rating: place.rating,
      price_level: place.price_level,
      photos: place.photos
    }));
    
    res.json({
      success: true,
      data: {
        places,
        center: { lat: latitude, lng: longitude },
        radius: parseInt(radius),
        type: type || 'all'
      }
    });
  } catch (error) {
    console.error('Places nearby error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding nearby places'
    });
  }
});

// @route   GET /api/maps/trips/nearby
// @desc    Find trips near a location
// @access  Public
router.get('/trips/nearby', optionalAuth, [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').optional().isFloat({ min: 1, max: 1000 }).withMessage('Radius must be between 1 and 1000 km'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { lat, lng, radius = 50, limit = 20 } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    // Find trips within radius using Supabase geospatial query
    const trips = await SupabaseTrip.findNearby(latitude, longitude, radiusKm, parseInt(limit));
    
    // Add computed fields and distance
    const tripsWithExtras = await Promise.all(
      trips.map(async (trip) => {
        // Calculate distance (approximate)
        const tripLat = trip.destination_lat;
        const tripLng = trip.destination_lng;
        const distance = calculateDistance(latitude, longitude, tripLat, tripLng);
        
        const [participantCount, likeCount, commentCount, isLiked] = await Promise.all([
          SupabaseTrip.getParticipantCount(trip.id),
          SupabaseTrip.getLikeCount(trip.id),
          SupabaseTrip.getCommentCount(trip.id),
          req.user ? SupabaseTrip.isLikedByUser(trip.id, req.user.id) : false
        ]);
        
        return {
          ...trip,
          participantCount,
          likeCount,
          commentCount,
          spotsAvailable: trip.max_participants - participantCount,
          isLiked,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        trips: tripsWithExtras,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm,
        total: tripsWithExtras.length
      }
    });
  } catch (error) {
    console.error('Nearby trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding nearby trips'
    });
  }
});

// @route   GET /api/maps/directions
// @desc    Get directions between two points
// @access  Public
router.get('/directions', [
  query('origin').trim().isLength({ min: 3 }).withMessage('Origin must be at least 3 characters'),
  query('destination').trim().isLength({ min: 3 }).withMessage('Destination must be at least 3 characters'),
  query('mode').optional().isIn(['driving', 'walking', 'bicycling', 'transit']).withMessage('Invalid travel mode')
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

    const { origin, destination, mode = 'driving' } = req.query;
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }
    
    // Use Google Maps Directions API
    const response = await googleMapsClient.directions({ 
      params: { 
        origin, 
        destination, 
        mode, 
        key: process.env.GOOGLE_MAPS_API_KEY 
      } 
    });
    
    if (response.data.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: `Directions API error: ${response.data.status}`
      });
    }
    
    res.json({
      success: true,
      data: {
        directions: response.data,
        origin,
        destination,
        mode
      }
    });
  } catch (error) {
    console.error('Directions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting directions'
    });
  }
});

// @route   GET /api/maps/distance-matrix
// @desc    Get distance and duration between multiple origins and destinations
// @access  Public
router.get('/distance-matrix', [
  query('origins').trim().isLength({ min: 3 }).withMessage('Origins must be provided'),
  query('destinations').trim().isLength({ min: 3 }).withMessage('Destinations must be provided'),
  query('mode').optional().isIn(['driving', 'walking', 'bicycling', 'transit'])
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

    const { origins, destinations, mode = 'driving' } = req.query;
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }
    
    // Use Google Maps Distance Matrix API
    const response = await googleMapsClient.distanceMatrix({ 
      params: { 
        origins, 
        destinations, 
        mode, 
        key: process.env.GOOGLE_MAPS_API_KEY 
      } 
    });
    
    if (response.data.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: `Distance Matrix API error: ${response.data.status}`
      });
    }
    
    res.json({
      success: true,
      data: {
        matrix: response.data,
        mode
      }
    });
  } catch (error) {
    console.error('Distance matrix error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating distance matrix'
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

module.exports = router;