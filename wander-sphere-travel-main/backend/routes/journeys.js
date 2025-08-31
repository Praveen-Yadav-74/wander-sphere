import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth, optionalAuth } from '../middleware/supabaseAuth.js';
import SupabaseUser from '../models/SupabaseUser.js';
import SupabaseTrip from '../models/SupabaseTrip.js';

const router = express.Router();

// In-memory journey store (in production, create a Journey model)
const journeys = new Map();

// Helper function to create journey
const createJourney = (title, description, authorId, isPublic = true) => {
  const journey = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title,
    description,
    author: authorId,
    isPublic,
    createdAt: new Date(),
    updatedAt: new Date(),
    content: '',
    images: [],
    tags: [],
    destinations: [],
    duration: null,
    budget: null,
    difficulty: 'moderate',
    season: [],
    likes: [],
    comments: [],
    views: 0,
    shares: 0,
    featured: false,
    status: 'published', // draft, published, archived
    metadata: {
      readTime: 0,
      wordCount: 0
    }
  };
  
  journeys.set(journey.id, journey);
  return journey;
};

// Helper function to calculate read time
const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readTime };
};

// @route   GET /api/journeys
// @desc    Get all journeys
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('search').optional().trim(),
  query('destination').optional().trim(),
  query('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  query('season').optional().isIn(['spring', 'summer', 'autumn', 'winter']),
  query('sort').optional().isIn(['newest', 'popular', 'trending', 'featured'])
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

    const { page = 1, limit = 10, search, destination, difficulty, season, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let allJourneys = Array.from(journeys.values());
    
    // Filter public journeys only (unless user is the author)
    allJourneys = allJourneys.filter(journey => {
      if (journey.isPublic) return true;
      if (!req.user) return false;
      return journey.author === req.user.id;
    });
    
    // Filter published journeys only
    allJourneys = allJourneys.filter(journey => journey.status === 'published');
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allJourneys = allJourneys.filter(journey => 
        journey.title.toLowerCase().includes(searchLower) ||
        journey.description.toLowerCase().includes(searchLower) ||
        journey.content.toLowerCase().includes(searchLower) ||
        journey.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply destination filter
    if (destination) {
      allJourneys = allJourneys.filter(journey => 
        journey.destinations.some(dest => 
          dest.toLowerCase().includes(destination.toLowerCase())
        )
      );
    }
    
    // Apply difficulty filter
    if (difficulty) {
      allJourneys = allJourneys.filter(journey => journey.difficulty === difficulty);
    }
    
    // Apply season filter
    if (season) {
      allJourneys = allJourneys.filter(journey => 
        journey.season.includes(season)
      );
    }
    
    // Sort journeys
    switch (sort) {
      case 'popular':
        allJourneys.sort((a, b) => (b.likes.length + b.views) - (a.likes.length + a.views));
        break;
      case 'trending':
        // Simple trending algorithm based on recent activity
        allJourneys.sort((a, b) => {
          const aScore = a.likes.length * 2 + a.views + a.shares * 3;
          const bScore = b.likes.length * 2 + b.views + b.shares * 3;
          return bScore - aScore;
        });
        break;
      case 'featured':
        allJourneys.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
      default:
        allJourneys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Pagination
    const total = allJourneys.length;
    const paginatedJourneys = allJourneys.slice(skip, skip + parseInt(limit));
    
    // Get author details
    const authorIds = [...new Set(paginatedJourneys.map(j => j.author))];
    const authors = await Promise.all(
      authorIds.map(id => SupabaseUser.findById(id))
    );
    
    const authorsMap = authors.reduce((acc, author) => {
      if (author) acc[author.id] = author;
      return acc;
    }, {});
    
    // Add author details and user interaction status
    const journeysWithDetails = paginatedJourneys.map(journey => ({
      ...journey,
      author: authorsMap[journey.author] || { firstName: 'Unknown', lastName: 'User' },
      isLiked: req.user ? journey.likes.includes(req.user.id) : false,
      isOwner: req.user ? journey.author === req.user.id : false,
      likeCount: journey.likes.length,
      commentCount: journey.comments.length
    }));

    res.json({
      success: true,
      data: {
        journeys: journeysWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get journeys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journeys'
    });
  }
});

// @route   GET /api/journeys/my-journeys
// @desc    Get user's journeys
// @access  Private
router.get('/my-journeys', auth, [
  query('status').optional().isIn(['draft', 'published', 'archived'])
], async (req, res) => {
  try {
    const { status } = req.query;
    
    let userJourneys = Array.from(journeys.values()).filter(journey => 
      journey.author === req.user.id
    );
    
    // Filter by status if provided
    if (status) {
      userJourneys = userJourneys.filter(journey => journey.status === status);
    }
    
    // Sort by creation date (newest first)
    userJourneys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const journeysWithStats = userJourneys.map(journey => ({
      ...journey,
      likeCount: journey.likes.length,
      commentCount: journey.comments.length
    }));

    res.json({
      success: true,
      data: { journeys: journeysWithStats }
    });
  } catch (error) {
    console.error('Get my journeys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your journeys'
    });
  }
});

// @route   GET /api/journeys/featured
// @desc    Get featured journeys
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const featuredJourneys = Array.from(journeys.values())
      .filter(journey => journey.featured && journey.status === 'published' && journey.isPublic)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
    
    // Get author details
    const authorIds = [...new Set(featuredJourneys.map(j => j.author))];
    const authors = await Promise.all(
      authorIds.map(id => SupabaseUser.findById(id))
    );
    
    const authorsMap = authors.reduce((acc, author) => {
      if (author) acc[author.id] = author;
      return acc;
    }, {});
    
    const journeysWithDetails = featuredJourneys.map(journey => ({
      ...journey,
      author: authorsMap[journey.author] || { firstName: 'Unknown', lastName: 'User' },
      isLiked: req.user ? journey.likes.includes(req.user.id) : false,
      likeCount: journey.likes.length,
      commentCount: journey.comments.length
    }));

    res.json({
      success: true,
      data: { journeys: journeysWithDetails }
    });
  } catch (error) {
    console.error('Get featured journeys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured journeys'
    });
  }
});

// @route   GET /api/journeys/:id
// @desc    Get journey by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const journey = journeys.get(req.params.id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    // Check if user can view private journey
    if (!journey.isPublic && (!req.user || journey.author !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This journey is private'
      });
    }

    // Increment view count (only if not the author)
    if (!req.user || journey.author !== req.user.id) {
      journey.views += 1;
      journeys.set(journey.id, journey);
    }

    // Get author details
    const author = await SupabaseUser.findById(journey.author);
    
    // Get comment details
    const commentUserIds = [...new Set(journey.comments.map(c => c.user))];
    const commentUsers = await Promise.all(
      commentUserIds.map(id => SupabaseUser.findById(id))
    );

    const commentUsersMap = commentUsers.reduce((acc, user) => {
      if (user) acc[user.id] = user;
      return acc;
    }, {});
    
    const commentsWithUsers = journey.comments.map(comment => ({
      ...comment,
      user: commentUsersMap[comment.user] || { firstName: 'Unknown', lastName: 'User' }
    }));
    
    const journeyWithDetails = {
      ...journey,
      author: author || { firstName: 'Unknown', lastName: 'User' },
      comments: commentsWithUsers,
      isLiked: req.user ? journey.likes.includes(req.user.id) : false,
      isOwner: req.user ? journey.author === req.user.id : false,
      likeCount: journey.likes.length,
      commentCount: journey.comments.length
    };

    res.json({
      success: true,
      data: { journey: journeyWithDetails }
    });
  } catch (error) {
    console.error('Get journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journey'
    });
  }
});

// @route   POST /api/journeys
// @desc    Create a new journey
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 500 }).withMessage('Description must be between 20 and 500 characters'),
  body('content').trim().isLength({ min: 100 }).withMessage('Content must be at least 100 characters'),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ min: 2, max: 20 }),
  body('destinations').optional().isArray(),
  body('destinations.*').optional().trim().isLength({ min: 2, max: 50 }),
  body('duration').optional().isInt({ min: 1 }),
  body('budget').optional().isNumeric(),
  body('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  body('season').optional().isArray(),
  body('season.*').optional().isIn(['spring', 'summer', 'autumn', 'winter'])
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
      title,
      description,
      content,
      isPublic = true,
      tags = [],
      destinations = [],
      duration,
      budget,
      difficulty = 'moderate',
      season = [],
      images = []
    } = req.body;
    
    const journey = createJourney(title, description, req.user.id, isPublic);
    
    // Set additional fields
    journey.content = content;
    journey.tags = tags.map(tag => tag.toLowerCase());
    journey.destinations = destinations;
    journey.duration = duration;
    journey.budget = budget;
    journey.difficulty = difficulty;
    journey.season = season;
    journey.images = images;
    
    // Calculate metadata
    const metadata = calculateReadTime(content);
    journey.metadata = metadata;
    
    journeys.set(journey.id, journey);

    res.status(201).json({
      success: true,
      message: 'Journey created successfully',
      data: { journey }
    });
  } catch (error) {
    console.error('Create journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating journey'
    });
  }
});

// @route   PUT /api/journeys/:id
// @desc    Update journey
// @access  Private (Author only)
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 20, max: 500 }),
  body('content').optional().trim().isLength({ min: 100 }),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('destinations').optional().isArray(),
  body('difficulty').optional().isIn(['easy', 'moderate', 'challenging', 'extreme']),
  body('season').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
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

    const journey = journeys.get(req.params.id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    // Check if user is the author
    if (journey.author !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can update this journey'
      });
    }
    
    // Update journey fields
    const allowedFields = [
      'title', 'description', 'content', 'isPublic', 'tags', 
      'destinations', 'duration', 'budget', 'difficulty', 'season', 
      'images', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags') {
          journey[field] = req.body[field].map(tag => tag.toLowerCase());
        } else {
          journey[field] = req.body[field];
        }
      }
    });
    
    // Recalculate metadata if content was updated
    if (req.body.content) {
      const metadata = calculateReadTime(req.body.content);
      journey.metadata = metadata;
    }
    
    journey.updatedAt = new Date();
    journeys.set(journey.id, journey);

    res.json({
      success: true,
      message: 'Journey updated successfully',
      data: { journey }
    });
  } catch (error) {
    console.error('Update journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating journey'
    });
  }
});

// @route   DELETE /api/journeys/:id
// @desc    Delete journey
// @access  Private (Author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const journey = journeys.get(req.params.id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    // Check if user is the author
    if (journey.author !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can delete this journey'
      });
    }
    
    journeys.delete(req.params.id);

    res.json({
      success: true,
      message: 'Journey deleted successfully'
    });
  } catch (error) {
    console.error('Delete journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting journey'
    });
  }
});

// @route   POST /api/journeys/:id/like
// @desc    Toggle like on journey
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const journey = journeys.get(req.params.id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    const userId = req.user.id;
    const likeIndex = journey.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      journey.likes.splice(likeIndex, 1);
    } else {
      // Like
      journey.likes.push(userId);
    }
    
    journey.updatedAt = new Date();
    journeys.set(journey.id, journey);

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Journey unliked' : 'Journey liked',
      data: {
        isLiked: likeIndex === -1,
        likeCount: journey.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// @route   POST /api/journeys/:id/comments
// @desc    Add comment to journey
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

    const journey = journeys.get(req.params.id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    const comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user: req.user.id,
      content: req.body.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    journey.comments.push(comment);
    journey.updatedAt = new Date();
    journeys.set(journey.id, journey);
    
    // Get user details for the response
    const user = await SupabaseUser.findById(req.user.id);
    
    const commentWithUser = {
      ...comment,
      user: user || { firstName: 'Unknown', lastName: 'User' }
    };

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: commentWithUser,
        commentCount: journey.comments.length
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

export default router;