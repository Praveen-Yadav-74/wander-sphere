const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/supabaseAuth');
const SupabaseUser = require('../models/SupabaseUser');
const SupabaseTrip = require('../models/SupabaseTrip');

const router = express.Router();

// In-memory club store (in production, create a Club model)
const clubs = new Map();

// Helper function to create club
const createClub = (name, description, creatorId, isPrivate = false) => {
  const club = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    description,
    creator: creatorId,
    members: [creatorId],
    admins: [creatorId],
    isPrivate,
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 1,
    tripCount: 0,
    avatar: null,
    tags: [],
    rules: [],
    settings: {
      allowMemberInvites: true,
      requireApproval: isPrivate,
      allowMemberPosts: true
    }
  };
  
  clubs.set(club.id, club);
  return club;
};

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('sort').optional().isIn(['newest', 'popular', 'members', 'name'])
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

    const { page = 1, limit = 10, search, category, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let allClubs = Array.from(clubs.values());
    
    // Filter private clubs if user is not authenticated or not a member
    allClubs = allClubs.filter(club => {
      if (!club.isPrivate) return true;
      if (!req.user) return false;
      return club.members.includes(req.user.id);
    });
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allClubs = allClubs.filter(club => 
        club.name.toLowerCase().includes(searchLower) ||
        club.description.toLowerCase().includes(searchLower) ||
        club.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (category) {
      allClubs = allClubs.filter(club => 
        club.tags.includes(category.toLowerCase())
      );
    }
    
    // Sort clubs
    switch (sort) {
      case 'popular':
        allClubs.sort((a, b) => (b.memberCount + b.tripCount) - (a.memberCount + a.tripCount));
        break;
      case 'members':
        allClubs.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'name':
        allClubs.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        allClubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Pagination
    const total = allClubs.length;
    const paginatedClubs = allClubs.slice(skip, skip + parseInt(limit));
    
    // Add user membership status
    const clubsWithStatus = paginatedClubs.map(club => ({
      ...club,
      isMember: req.user ? club.members.includes(req.user.id) : false,
      isAdmin: req.user ? club.admins.includes(req.user.id) : false,
      isCreator: req.user ? club.creator === req.user.id : false
    }));

    res.json({
      success: true,
      data: {
        clubs: clubsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clubs'
    });
  }
});

// @route   GET /api/clubs/:id
// @desc    Get club by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if user can view private club
    if (club.isPrivate && (!req.user || !club.members.includes(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'This club is private'
      });
    }
    
    // Get member details
    const memberDetails = await SupabaseUser.findByIds(club.members, ['firstName', 'lastName', 'avatar']);
    
    const clubWithDetails = {
      ...club,
      memberDetails,
      isMember: req.user ? club.members.includes(req.user.id) : false,
      isAdmin: req.user ? club.admins.includes(req.user.id) : false,
      isCreator: req.user ? club.creator === req.user.id : false
    };

    res.json({
      success: true,
      data: { club: clubWithDetails }
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching club'
    });
  }
});

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 3, max: 50 }).withMessage('Club name must be between 3 and 50 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('isPrivate').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ min: 2, max: 20 }),
  body('rules').optional().isArray(),
  body('rules.*').optional().trim().isLength({ min: 5, max: 200 })
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

    const { name, description, isPrivate = false, tags = [], rules = [] } = req.body;
    
    // Check if club name already exists
    const existingClub = Array.from(clubs.values()).find(
      club => club.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'A club with this name already exists'
      });
    }
    
    const club = createClub(name, description, req.user.id, isPrivate);
    club.tags = tags.map(tag => tag.toLowerCase());
    club.rules = rules;
    
    clubs.set(club.id, club);

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: { club }
    });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating club'
    });
  }
});

// @route   PUT /api/clubs/:id
// @desc    Update club
// @access  Private (Admin only)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 3, max: 50 }),
  body('description').optional().trim().isLength({ min: 10, max: 500 }),
  body('isPrivate').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('rules').optional().isArray()
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

    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if user is admin
    if (!club.admins.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only club admins can update the club'
      });
    }
    
    // Update club fields
    const allowedFields = ['name', 'description', 'isPrivate', 'tags', 'rules'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags') {
          club[field] = req.body[field].map(tag => tag.toLowerCase());
        } else {
          club[field] = req.body[field];
        }
      }
    });
    
    club.updatedAt = new Date();
    clubs.set(club.id, club);

    res.json({
      success: true,
      message: 'Club updated successfully',
      data: { club }
    });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating club'
    });
  }
});

// @route   DELETE /api/clubs/:id
// @desc    Delete club
// @access  Private (Creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if user is creator
    if (club.creator !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can delete the club'
      });
    }
    
    clubs.delete(req.params.id);

    res.json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting club'
    });
  }
});

// @route   POST /api/clubs/:id/join
// @desc    Join a club
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if already a member
    if (club.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club'
      });
    }
    
    // For private clubs, this would typically create a join request
    // For simplicity, we'll allow direct joining
    club.members.push(req.user.id);
    club.memberCount = club.members.length;
    club.updatedAt = new Date();
    
    clubs.set(club.id, club);

    res.json({
      success: true,
      message: 'Successfully joined the club',
      data: { memberCount: club.memberCount }
    });
  } catch (error) {
    console.error('Join club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining club'
    });
  }
});

// @route   POST /api/clubs/:id/leave
// @desc    Leave a club
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if user is a member
    if (!club.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this club'
      });
    }
    
    // Creator cannot leave their own club
    if (club.creator === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Club creator cannot leave the club. Transfer ownership or delete the club instead.'
      });
    }
    
    // Remove from members and admins
    club.members = club.members.filter(id => id !== req.user.id);
    club.admins = club.admins.filter(id => id !== req.user.id);
    club.memberCount = club.members.length;
    club.updatedAt = new Date();
    
    clubs.set(club.id, club);

    res.json({
      success: true,
      message: 'Successfully left the club',
      data: { memberCount: club.memberCount }
    });
  } catch (error) {
    console.error('Leave club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving club'
    });
  }
});

// @route   GET /api/clubs/:id/members
// @desc    Get club members
// @access  Private (Members only)
router.get('/:id/members', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const club = clubs.get(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if user is a member
    if (!club.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only club members can view the member list'
      });
    }
    
    // Get paginated member details
    const memberIds = club.members.slice(skip, skip + parseInt(limit));
    const members = await SupabaseUser.findByIds(memberIds, ['firstName', 'lastName', 'avatar', 'bio', 'location', 'stats']);
    
    // Add role information
    const membersWithRoles = members.map(member => ({
      ...member,
      isCreator: member.id === club.creator,
      isAdmin: club.admins.includes(member.id),
      joinedAt: new Date() // In production, track actual join date
    }));

    res.json({
      success: true,
      data: {
        members: membersWithRoles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(club.members.length / parseInt(limit)),
          totalItems: club.members.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get club members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching club members'
    });
  }
});

// @route   GET /api/clubs/my-clubs
// @desc    Get user's clubs
// @access  Private
router.get('/my-clubs', auth, async (req, res) => {
  try {
    const userClubs = Array.from(clubs.values()).filter(club => 
      club.members.includes(req.user.id)
    );
    
    const clubsWithStatus = userClubs.map(club => ({
      ...club,
      isMember: true,
      isAdmin: club.admins.includes(req.user.id),
      isCreator: club.creator === req.user.id
    }));

    res.json({
      success: true,
      data: { clubs: clubsWithStatus }
    });
  } catch (error) {
    console.error('Get my clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your clubs'
    });
  }
});

module.exports = router;