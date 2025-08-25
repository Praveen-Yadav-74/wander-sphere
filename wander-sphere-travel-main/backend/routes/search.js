const express = require('express');
const { query, validationResult } = require('express-validator');
const SupabaseUser = require('../models/SupabaseUser');
const SupabaseTrip = require('../models/SupabaseTrip');
const { optionalAuth } = require('../middleware/supabaseAuth');

const router = express.Router();

// @route   GET /api/search
// @desc    Global search across trips and users
// @access  Public
router.get('/', optionalAuth, [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('type').optional().isIn(['all', 'trips', 'users']).withMessage('Type must be all, trips, or users'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  query('category').optional().isIn(['adventure', 'cultural', 'relaxation', 'business', 'family', 'solo', 'group']),
  query('difficulty').optional().isIn(['easy', 'moderate', 'challenging']),
  query('budget_min').optional().isFloat({ min: 0 }),
  query('budget_max').optional().isFloat({ min: 0 }),
  query('country').optional().trim(),
  query('city').optional().trim(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('sort').optional().isIn(['relevance', 'date', 'popularity', 'budget_low', 'budget_high'])
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
      q,
      type = 'all',
      page = 1,
      limit = 10,
      category,
      difficulty,
      budget_min,
      budget_max,
      country,
      city,
      start_date,
      end_date,
      sort = 'relevance'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    // Search trips
    if (type === 'all' || type === 'trips') {
      const tripFilter = {
        isActive: true,
        visibility: 'public',
        $or: [
          { title: new RegExp(q, 'i') },
          { description: new RegExp(q, 'i') },
          { 'destination.country': new RegExp(q, 'i') },
          { 'destination.city': new RegExp(q, 'i') },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };

      // Apply filters
      if (category) tripFilter.category = category;
      if (difficulty) tripFilter.difficulty = difficulty;
      if (country) tripFilter['destination.country'] = new RegExp(country, 'i');
      if (city) tripFilter['destination.city'] = new RegExp(city, 'i');
      
      if (budget_min || budget_max) {
        tripFilter['budget.total'] = {};
        if (budget_min) tripFilter['budget.total'].$gte = parseFloat(budget_min);
        if (budget_max) tripFilter['budget.total'].$lte = parseFloat(budget_max);
      }
      
      if (start_date || end_date) {
        tripFilter['dates.start'] = {};
        if (start_date) tripFilter['dates.start'].$gte = new Date(start_date);
        if (end_date) tripFilter['dates.start'].$lte = new Date(end_date);
      }

      // Build sort criteria
      let tripSort = {};
      switch (sort) {
        case 'date':
          tripSort = { 'dates.start': -1 };
          break;
        case 'popularity':
          tripSort = { 'social.views': -1, 'social.likes': -1 };
          break;
        case 'budget_low':
          tripSort = { 'budget.total': 1 };
          break;
        case 'budget_high':
          tripSort = { 'budget.total': -1 };
          break;
        default:
          tripSort = { createdAt: -1 };
      }

      const [trips, tripTotal] = await Promise.all([
        SupabaseTrip.search({
          query: q,
          filters: {
            category,
            difficulty,
            country,
            city,
            budget_min: budget_min ? parseFloat(budget_min) : null,
            budget_max: budget_max ? parseFloat(budget_max) : null,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null
          },
          sort,
          skip: type === 'trips' ? skip : 0,
          limit: type === 'trips' ? parseInt(limit) : Math.ceil(parseInt(limit) / 2)
        }),
        SupabaseTrip.countSearch({
          query: q,
          filters: {
            category,
            difficulty,
            country,
            city,
            budget_min: budget_min ? parseFloat(budget_min) : null,
            budget_max: budget_max ? parseFloat(budget_max) : null,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null
          }
        })
      ]);

      // Add computed fields
      const tripsWithExtras = await Promise.all(
        trips.map(async (trip) => {
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
            isLiked
          };
        })
      );

      results.trips = {
        data: tripsWithExtras,
        total: tripTotal,
        pagination: type === 'trips' ? {
          currentPage: parseInt(page),
          totalPages: Math.ceil(tripTotal / parseInt(limit)),
          totalItems: tripTotal,
          itemsPerPage: parseInt(limit)
        } : null
      };
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const [users, userTotal] = await Promise.all([
        SupabaseUser.search({
          query: q,
          includeFollowing: req.user ? req.user.id : null,
          skip: type === 'users' ? skip : 0,
          limit: type === 'users' ? parseInt(limit) : Math.ceil(parseInt(limit) / 2)
        }),
        SupabaseUser.countSearch({
          query: q,
          includeFollowing: req.user ? req.user.id : null
        })
      ]);

      // Add computed fields
      const usersWithExtras = await Promise.all(
        users.map(async (user) => {
          const [followerCount, followingCount, isFollowing] = await Promise.all([
            SupabaseUser.getFollowerCount(user.id),
            SupabaseUser.getFollowingCount(user.id),
            req.user ? SupabaseUser.isFollowing(req.user.id, user.id) : false
          ]);
          
          return {
            ...user,
            followerCount,
            followingCount,
            isFollowing
          };
        })
      );

      results.users = {
        data: usersWithExtras,
        total: userTotal,
        pagination: type === 'users' ? {
          currentPage: parseInt(page),
          totalPages: Math.ceil(userTotal / parseInt(limit)),
          totalItems: userTotal,
          itemsPerPage: parseInt(limit)
        } : null
      };
    }

    // Calculate total results for 'all' type
    if (type === 'all') {
      const totalResults = (results.trips?.total || 0) + (results.users?.total || 0);
      results.pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResults / parseInt(limit)),
        totalItems: totalResults,
        itemsPerPage: parseInt(limit)
      };
    }

    res.json({
      success: true,
      data: {
        query: q,
        type,
        ...results
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing search'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', optionalAuth, [
  query('q').trim().isLength({ min: 1 }).withMessage('Query is required'),
  query('type').optional().isIn(['destinations', 'tags', 'users'])
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

    const { q, type = 'destinations' } = req.query;
    const suggestions = [];

    if (type === 'destinations') {
      // Get destination suggestions from trips
      const destinations = await SupabaseTrip.getDestinationSuggestions(q, 10);
      suggestions.push(...destinations);
    }

    if (type === 'tags') {
      // Get tag suggestions from trips
      const tags = await SupabaseTrip.getTagSuggestions(q, 10);
      suggestions.push(...tags);
    }

    if (type === 'users') {
      // Get user suggestions
      const users = await SupabaseUser.getUserSuggestions(q, 10);
      suggestions.push(...users);
    }

    res.json({
      success: true,
      data: {
        query: q,
        type,
        suggestions
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching search suggestions'
    });
  }
});

// @route   GET /api/search/popular
// @desc    Get popular searches and trending content
// @access  Public
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    // Get popular destinations
    const popularDestinations = await SupabaseTrip.getPopularDestinations(10);

    // Get popular tags
    const popularTags = await SupabaseTrip.getPopularTags(15);

    // Get trending trips (most liked/viewed recently)
    const trendingTrips = await SupabaseTrip.getTrendingTrips(5);
    
    // Add computed fields for each trip
    const trendingTripsWithExtras = await Promise.all(
      trendingTrips.map(async (trip) => {
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
          isLiked
        };
      })
    );

    res.json({
      success: true,
      data: {
        popularDestinations,
        popularTags,
        trendingTrips: trendingTripsWithExtras
      }
    });
  } catch (error) {
    console.error('Popular search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular content'
    });
  }
});

// @route   GET /api/search/filters
// @desc    Get available filter options
// @access  Public
router.get('/filters', async (req, res) => {
  try {
    // Get available countries and cities
    const destinations = await SupabaseTrip.getAvailableDestinations();

    // Get budget ranges
    const budgetRanges = await SupabaseTrip.getBudgetRanges();

    const filterOptions = {
      categories: ['adventure', 'cultural', 'relaxation', 'business', 'family', 'solo', 'group'],
      difficulties: ['easy', 'moderate', 'challenging'],
      sortOptions: [
        { value: 'relevance', label: 'Most Relevant' },
        { value: 'date', label: 'Date' },
        { value: 'popularity', label: 'Most Popular' },
        { value: 'budget_low', label: 'Budget: Low to High' },
        { value: 'budget_high', label: 'Budget: High to Low' }
      ],
      destinations: destinations || { countries: [], cities: [] },
      budgetRange: budgetRanges || { minBudget: 0, maxBudget: 10000, avgBudget: 1000 }
    };

    res.json({
      success: true,
      data: filterOptions
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching filter options'
    });
  }
});

module.exports = router;