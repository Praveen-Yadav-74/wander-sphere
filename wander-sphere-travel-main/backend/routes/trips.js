import express from 'express';
import { body, query, validationResult } from 'express-validator';
import SupabaseTrip from '../models/SupabaseTrip.js';
import SupabaseUser from '../models/SupabaseUser.js';
import SupabaseTripRequest from '../models/SupabaseTripRequest.js';
import SupabaseNotification from '../models/SupabaseNotification.js';
import { auth, optionalAuth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// @route   GET /api/trips
// @desc    Get all trips with filtering and pagination
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group']),
  query('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  query('status').optional().isIn(['planning', 'confirmed', 'ongoing', 'completed', 'cancelled']),
  query('minBudget').optional().isFloat({ min: 0 }),
  query('maxBudget').optional().isFloat({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('country').optional().trim(),
  query('city').optional().trim(),
  query('search').optional().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
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

    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      status,
      minBudget,
      maxBudget,
      startDate,
      endDate,
      country,
      city,
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filters = {};
    
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (status) filters.status = status;
    if (featured !== undefined) filters.featured = featured === 'true';
    if (country) filters.country = country;
    if (city) filters.city = city;
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    // Validate and sanitize sort order
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    
    // Build sort string
    let sort = 'created_at:desc';
    switch (sortBy) {
      case 'title':
        sort = `title:${validSortOrder}`;
        break;
      case 'startDate':
        sort = `start_date:${validSortOrder}`;
        break;
      case 'budget':
        sort = `budget:${validSortOrder}`;
        break;
      default:
        sort = 'created_at:desc';
    }
    filters.sort = sort;
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    let trips;
    if (search) {
      trips = await SupabaseTrip.search(search, filters, parseInt(limit), offset);
    } else {
      trips = await SupabaseTrip.find(filters, parseInt(limit), offset);
    }
    
    const total = await SupabaseTrip.count(filters);

    // Add computed fields
    const tripsWithExtras = trips.map(trip => ({
      ...trip,
      participantCount: trip.participants ? trip.participants.filter(p => p.status === 'accepted').length : 0,
      likeCount: trip.likes ? trip.likes.length : 0,
      commentCount: trip.comments ? trip.comments.length : 0,
      isLiked: req.user ? (trip.likes || []).includes(req.user.id) : false
    }));

    res.json({
      success: true,
      data: {
        trips: tripsWithExtras,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trips'
    });
  }
});

// @route   GET /api/trips/featured
// @desc    Get featured trips
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const {
      limit = 10
    } = req.query;

    const trips = await SupabaseTrip.getFeatured(parseInt(limit));

    // Add computed fields
    const tripsWithExtras = trips.map(trip => ({
      ...trip,
      participantCount: trip.participants ? trip.participants.filter(p => p.status === 'accepted').length : 0,
      likeCount: trip.likes ? trip.likes.length : 0,
      commentCount: trip.comments ? trip.comments.length : 0,
      isLiked: req.user ? (trip.likes || []).includes(req.user.id) : false
    }));

    res.json({
      success: true,
      data: {
        trips: tripsWithExtras
      }
    });
  } catch (error) {
    console.error('Get featured trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured trips'
    });
  }
});

// @route   GET /api/trips/:id
// @desc    Get single trip by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await SupabaseTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check visibility
    if (trip.visibility === 'private' && (!req.user || trip.organizer_id !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This trip is private'
      });
    }

    // Increment view count if not the organizer
    if (!req.user || trip.organizer_id !== req.user.id) {
      await SupabaseTrip.incrementViews(trip.id);
    }

    // Get additional data
    const [participants, likesCount, comments] = await Promise.all([
      SupabaseTrip.getParticipants(trip.id),
      SupabaseTrip.getLikesCount(trip.id),
      SupabaseTrip.getComments(trip.id, 10, 0)
    ]);

    // Add computed fields
    const tripData = {
      ...trip,
      participantCount: participants.filter(p => p.status === 'accepted').length,
      likeCount: likesCount,
      commentCount: comments.length,
      isLiked: false, // TODO: Check if user liked
      isParticipant: req.user ? participants.some(p => p.user_id === req.user.id) : false,
      participants,
      comments
    };
    tripData.isOrganizer = req.user ? trip.organizer_id === req.user.id : false;

    res.json({
      success: true,
      data: { trip: tripData }
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trip'
    });
  }
});

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('destination.country').trim().notEmpty().withMessage('Country is required'),
  body('destination.city').trim().notEmpty().withMessage('City is required'),
  body('destination.coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('destination.coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('dates.startDate').isISO8601().withMessage('Invalid start date'),
  body('dates.endDate').isISO8601().withMessage('Invalid end date'),
  body('budget.total').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('budget.currency').trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('maxParticipants').isInt({ min: 1, max: 50 }).withMessage('Max participants must be between 1 and 50'),
  body('category').isIn(['adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group']),
  body('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  body('visibility').optional().isIn(['public', 'friends', 'private'])
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

    // Validate dates
    const startDate = new Date(req.body.dates.startDate);
    const endDate = new Date(req.body.dates.endDate);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Create trip
    const { title, description, destination, dates, budget, maxParticipants, itinerary, images, tags, category, difficulty, visibility, requirements } = req.body;
    
    const tripData = {
      title,
      description,
      destination,
      start_date: dates.startDate,
      end_date: dates.endDate,
      budget,
      max_participants: maxParticipants,
      itinerary: itinerary || [],
      images: images || [],
      tags: tags || [],
      category,
      difficulty: difficulty || 'moderate',
      visibility: visibility || 'public',
      requirements: requirements || [],
      user_id: req.user.id,
      organizer_id: req.user.id // Keep for backward compatibility
    };

    const trip = await SupabaseTrip.create(tripData);

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating trip'
    });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update trip
// @access  Private (organizer only)
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }),
  body('budget.total').optional().isFloat({ min: 0 }),
  body('maxParticipants').optional().isInt({ min: 1, max: 50 }),
  body('category').optional().isIn(['adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group']),
  body('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  body('visibility').optional().isIn(['public', 'friends', 'private']),
  body('status').optional().isIn(['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'])
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

    const allowedUpdates = [
      'title', 'description', 'destination', 'dates', 'budget', 'maxParticipants',
      'itinerary', 'images', 'tags', 'category', 'difficulty', 'status', 'visibility', 'requirements'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate date changes
    if (updates.dates) {
      const startDate = new Date(updates.dates.startDate);
      const endDate = new Date(updates.dates.endDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const trip = await SupabaseTrip.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating trip'
    });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete trip
// @access  Private (organizer only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await SupabaseTrip.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting trip'
    });
  }
});

// @route   POST /api/trips/:id/join
// @desc    Join a trip
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const trip = await SupabaseTrip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is already a participant
    const participants = await SupabaseTrip.getParticipants(req.params.id);
    const existingParticipant = participants.find(
      p => p.user_id === req.user.id
    );
    
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this trip'
      });
    }

    // Check if trip is full
    const acceptedParticipants = participants.filter(p => p.status === 'accepted').length;
    if (acceptedParticipants >= trip.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Trip is full'
      });
    }

    // Add participant
    await SupabaseTrip.addParticipant(req.params.id, req.user.id, 'participant', 'accepted');
    
    const updatedTrip = await SupabaseTrip.findById(req.params.id);

    res.json({
      success: true,
      message: 'Successfully joined the trip',
      data: { trip }
    });
  } catch (error) {
    console.error('Join trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining trip'
    });
  }
});

// @route   POST /api/trips/:id/leave
// @desc    Leave a trip
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const trip = await SupabaseTrip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is the organizer
    if (trip.organizer_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Organizer cannot leave the trip. Transfer ownership or delete the trip instead.'
      });
    }

    // Remove participant
    await SupabaseTrip.removeParticipant(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Successfully left the trip'
    });
  } catch (error) {
    console.error('Leave trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving trip'
    });
  }
});

// @route   POST /api/trips/:id/like
// @desc    Like/unlike a trip
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const trip = await SupabaseTrip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user already liked this trip
    let isLiked = false;
    try {
       await SupabaseTrip.addLike(req.params.id, req.user.id);
       isLiked = false; // Was not liked before
     } catch (error) {
      if (error.message.includes('already liked')) {
        await SupabaseTrip.removeLike(req.params.id, req.user.id);
        isLiked = true; // Was liked before
      } else {
        throw error;
      }
    }
    
    const likeCount = await SupabaseTrip.getLikesCount(req.params.id);

    res.json({
      success: true,
      message: isLiked ? 'Trip unliked' : 'Trip liked',
      data: {
        isLiked: !isLiked,
        likeCount: likeCount
      }
    });
  } catch (error) {
    console.error('Like trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking trip'
    });
  }
});

// @route   POST /api/trips/:id/comments
// @desc    Add comment to trip
// @access  Private
router.post('/:id/comments', auth, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
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

    const trip = await SupabaseTrip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const newComment = await SupabaseTrip.addComment(req.params.id, req.user.id, req.body.content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   POST /api/trips/:id/request
// @desc    Request to join a trip
// @access  Private
router.post('/:id/request', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const tripId = req.params.id;
    const userId = req.user.id;

    const trip = await SupabaseTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check if already a participant
    const participants = await SupabaseTrip.getParticipants(tripId);
    if (participants.some(p => p.user_id === userId)) {
      return res.status(400).json({ success: false, message: 'You have already joined this trip' });
    }

    // Check if request already exists
    // (We rely on unique constraint in DB, but can check here too)
    try {
      await SupabaseTripRequest.create({
        trip_id: tripId,
        user_id: userId,
        message
      });
    } catch (err) {
      if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
         return res.status(400).json({ success: false, message: 'Request already sent' });
      }
      throw err;
    }

    // Send notification to organizer
    await SupabaseNotification.create({
      user_id: trip.organizer_id,
      type: 'system', // or new type 'trip_request'
      title: 'New Trip Request',
      message: `${req.user.first_name || 'Someone'} requested to join "${trip.title}"`,
      data: { tripId, requesterId: userId },
      action_url: `/trips/${tripId}/requests` // Or dashboard link
    });

    res.status(201).json({
      success: true,
      message: 'Request sent successfully'
    });
  } catch (error) {
    console.error('Create trip request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create request' });
  }
});

// @route   GET /api/trips/requests/my
// @desc    Get current user's trip requests
// @access  Private
router.get('/requests/my', auth, async (req, res) => {
  try {
    console.log('Fetching requests for user:', req.user.id);
    const requests = await SupabaseTripRequest.getByUserId(req.user.id);
    res.json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Get user requests error [CRITICAL]:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch requests', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// @route   GET /api/trips/:id/requests
// @desc    Get requests for a trip (Host only)
// @access  Private
router.get('/:id/requests', auth, async (req, res) => {
  try {
    const trip = await SupabaseTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const requests = await SupabaseTripRequest.getByTripId(req.params.id);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get trip requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// @route   POST /api/trips/requests/:requestId/approve
// @desc    Approve a trip request
// @access  Private (Host only)
router.post('/requests/:requestId/approve', auth, async (req, res) => {
  try {
    const request = await SupabaseTripRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const trip = await SupabaseTrip.findById(request.trip_id);
    if (trip.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check capacity
    const participants = await SupabaseTrip.getParticipants(trip.id);
    const acceptedCount = participants.filter(p => p.status === 'accepted').length;
    
    if (acceptedCount >= trip.max_participants) {
      return res.status(400).json({ success: false, message: 'Trip is full' });
    }

    // Approve request
    await SupabaseTripRequest.updateStatus(req.params.requestId, 'approved');

    // Add participant
    await SupabaseTrip.addParticipant(trip.id, request.user_id, 'participant', 'accepted');

    // Notify user
    await SupabaseNotification.create({
      user_id: request.user_id,
      type: 'system', // or 'trip_request_approved'
      title: 'Request Approved',
      message: `Your request to join "${trip.title}" has been approved!`,
      data: { tripId: trip.id },
      action_url: `/trips/${trip.id}`
    });

    res.json({ success: true, message: 'Request approved' });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

// @route   POST /api/trips/requests/:requestId/reject
// @desc    Reject a trip request
// @access  Private (Host only)
router.post('/requests/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await SupabaseTripRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const trip = await SupabaseTrip.findById(request.trip_id);
    if (trip.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Reject request
    await SupabaseTripRequest.updateStatus(req.params.requestId, 'rejected');

    // Notify user (optional? maybe don't notify on rejection to be nice, or do.)
    // Let's notify.
    await SupabaseNotification.create({
      user_id: request.user_id,
      type: 'system',
      title: 'Request Rejected',
      message: `Your request to join "${trip.title}" was declined.`,
      data: { tripId: trip.id },
      action_url: `/trips/${trip.id}`
    });

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

export default router;