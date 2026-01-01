import express from 'express';
import { body, query, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';
import SupabaseUser from '../models/SupabaseUser.js';
import SupabaseTrip from '../models/SupabaseTrip.js';
import { auth, optionalAuth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// @route   GET /api/users/profile/stats
// @desc    Get user profile statistics
// @access  Private
router.get('/profile/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user stats from various tables
    const [tripsResult, journeysResult, followersResult, followingResult] = await Promise.all([
      supabase.from('trips').select('id').eq('user_id', userId),
      supabase.from('journeys').select('id').eq('user_id', userId),
      supabase.from('user_follows').select('id').eq('following_id', userId),
      supabase.from('user_follows').select('id').eq('follower_id', userId)
    ]);

    const stats = {
      trips_count: tripsResult.data?.length || 0,
      journeys_count: journeysResult.data?.length || 0,
      followers_count: followersResult.data?.length || 0,
      following_count: followingResult.data?.length || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await SupabaseUser.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get followers and following data
    const [followers, following] = await Promise.all([
      SupabaseUser.getFollowers(req.user.id),
      SupabaseUser.getFollowing(req.user.id)
    ]);

    // Add social stats to user profile
    const userProfile = {
      ...user,
      followersCount: followers.length,
      followingCount: following.length,
      isFollowing: false, // Not applicable for own profile
      isFollowedBy: false // Not applicable for own profile
    };

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile/privacy
// @desc    Update user privacy settings
// @access  Private
router.put('/profile/privacy', auth, async (req, res) => {
  try {
    const { isPrivate, showLocation, showTravelStats, allowTagging } = req.body;
    const userId = req.user.id;

    // Validate input (basic)
    if (typeof isPrivate !== 'undefined' && typeof isPrivate !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isPrivate must be a boolean' });
    }

    const updateData = {};
    
    // Handle is_private column
    if (typeof isPrivate !== 'undefined') {
      updateData.is_private = isPrivate;
    }

    // Handle privacy_settings JSONB column
    // First fetch existing settings to merge to avoid overwriting other potential settings
    const currentUser = await SupabaseUser.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const currentPrivacySettings = currentUser.privacy_settings || {};
    
    const newPrivacySettings = {
        ...currentPrivacySettings,
        profile_visibility: isPrivate !== undefined ? (isPrivate ? 'private' : 'public') : currentPrivacySettings.profile_visibility,
        show_location: showLocation !== undefined ? showLocation : currentPrivacySettings.show_location,
        show_travel_stats: showTravelStats !== undefined ? showTravelStats : currentPrivacySettings.show_travel_stats,
        allow_tagging: allowTagging !== undefined ? allowTagging : currentPrivacySettings.allow_tagging
    };
    
    updateData.privacy_settings = newPrivacySettings;

    const updatedUser = await SupabaseUser.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      data: {
        isPrivate: updatedUser.is_private,
        privacySettings: updatedUser.privacy_settings
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/profile/:id', optionalAuth, async (req, res) => {
  try {
    const user = await SupabaseUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get followers and following data
    const [followers, following] = await Promise.all([
      SupabaseUser.getFollowers(req.params.id),
      SupabaseUser.getFollowing(req.params.id)
    ]);

    // Check privacy settings
    const isOwnProfile = req.user && req.user.id === req.params.id;
    const isFollowing = req.user ? followers.some(f => f.id === req.user.id) : false;
    
    // Check both new flags and old preferences
    const isPrivateAccount = user.is_private || 
                            (user.privacy_settings?.profile_visibility === 'private') || 
                            (user.preferences?.privacy?.profileVisibility === 'private');

    if (isPrivateAccount && !isOwnProfile && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    if (user.preferences?.privacy?.profileVisibility === 'friends' && !isOwnProfile && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: 'This profile is only visible to friends'
      });
    }

    // Hide sensitive information based on privacy settings
    const userProfile = { ...user };
    if (!isOwnProfile) {
      if (!user.preferences?.privacy?.showEmail) {
        delete userProfile.email;
      }
      if (!user.preferences?.privacy?.showPhone) {
        delete userProfile.phone;
      }
    }

    // Add relationship status
    userProfile.isFollowing = req.user ? followers.some(f => f.id === req.user.id) : false;
    userProfile.isFollowedBy = req.user ? following.some(f => f.id === req.user.id) : false;
    userProfile.isOwnProfile = isOwnProfile;
    userProfile.followerCount = followers.length;
    userProfile.followingCount = following.length;

    res.json({
      success: true,
      data: { user: userProfile }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', optionalAuth, [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const { q, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search filter
    const searchFilter = {
      isActive: true,
      'preferences.privacy.profileVisibility': { $in: ['public'] },
      $or: [
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') }
      ]
    };

    const [users, total] = await Promise.all([
      SupabaseUser.search(q, {
        excludeUserId: req.user?.id,
        includeFollowing: !!req.user,
        currentUserId: req.user?.id
      }, parseInt(limit), skip),
      SupabaseUser.getSearchCount(q, {
        excludeUserId: req.user?.id,
        includeFollowing: !!req.user,
        currentUserId: req.user?.id
      })
    ]);

    // Add relationship status for each user
    const usersWithRelationship = await Promise.all(
      users.map(async (user) => {
        const [isFollowing, isFollowedBy] = req.user ? await Promise.all([
          SupabaseUser.isFollowing(req.user.id, user.id),
          SupabaseUser.isFollowing(user.id, req.user.id)
        ]) : [false, false];
        
        return {
          ...user,
          isFollowing,
          isFollowedBy
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithRelationship,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   GET /api/users/suggestions
// @desc    Get user suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await SupabaseUser.getSuggestions(req.user.id, 10);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggestions'
    });
  }
});

// @route   POST /api/users/follow/:id
// @desc    Follow/unfollow a user
// @access  Private
router.post('/follow/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await SupabaseUser.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow inactive user'
      });
    }

    // Check if already following
    const isFollowing = await SupabaseUser.isFollowing(req.user.id, req.params.id);
    
    if (isFollowing) {
      // Unfollow
      await SupabaseUser.unfollow(req.user.id, req.params.id);
    } else {
      // Follow
      await SupabaseUser.follow(req.user.id, req.params.id);
    }

    const updatedFollowerCount = await SupabaseUser.getFollowerCount(req.params.id);

    res.json({
      success: true,
      message: isFollowing ? 'User unfollowed successfully' : 'User followed successfully',
      data: {
        isFollowing: !isFollowing,
        followerCount: updatedFollowerCount
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
});

// @route   GET /api/users/requests
// @desc    Get pending follow requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await SupabaseUser.getFollowRequests(req.user.id);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get follow requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow requests'
    });
  }
});

// @route   POST /api/users/requests/:id/accept
// @desc    Accept follow request
// @access  Private
router.post('/requests/:id/accept', auth, async (req, res) => {
  try {
    const followerId = req.params.id;
    await SupabaseUser.acceptFollowRequest(req.user.id, followerId);

    res.json({
      success: true,
      message: 'Follow request accepted'
    });
  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting follow request'
    });
  }
});

// @route   POST /api/users/requests/:id/reject
// @desc    Reject follow request
// @access  Private
router.post('/requests/:id/reject', auth, async (req, res) => {
  try {
    const followerId = req.params.id;
    await SupabaseUser.rejectFollowRequest(req.user.id, followerId);

    res.json({
      success: true,
      message: 'Follow request rejected'
    });
  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting follow request'
    });
  }
});

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Public
router.get('/:id/followers', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await SupabaseUser.findById(req.params.id);
    const followers = await SupabaseUser.getFollowers(req.params.id, parseInt(limit), skip);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy
    const isOwnProfile = req.user && req.user.id === req.params.id;
    const isFollowing = req.user ? await SupabaseUser.isFollowing(req.user.id, req.params.id) : false;
    
    const isPrivateAccount = user.is_private || 
                            (user.privacy_settings?.profile_visibility === 'private') || 
                            (user.preferences?.privacy?.profileVisibility === 'private');

    if (isPrivateAccount && !isOwnProfile && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    const totalFollowers = await SupabaseUser.getFollowerCount(req.params.id);

    res.json({
      success: true,
      data: {
        followers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFollowers / parseInt(limit)),
          totalItems: totalFollowers,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get users that this user is following
// @access  Public
router.get('/:id/following', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await SupabaseUser.findById(req.params.id);
    const following = await SupabaseUser.getFollowing(req.params.id, parseInt(limit), skip);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy
    const isOwnProfile = req.user && req.user.id === req.params.id;
    const isFollowing = req.user ? await SupabaseUser.isFollowing(req.user.id, req.params.id) : false;

    const isPrivateAccount = user.is_private || 
                            (user.privacy_settings?.profile_visibility === 'private') || 
                            (user.preferences?.privacy?.profileVisibility === 'private');

    if (isPrivateAccount && !isOwnProfile && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    const totalFollowing = await SupabaseUser.getFollowingCount(req.params.id);

    res.json({
      success: true,
      data: {
        following,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFollowing / parseInt(limit)),
          totalItems: totalFollowing,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
});

// @route   GET /api/users/:id/trips
// @desc    Get user's trips
// @access  Public
router.get('/:id/trips', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('status').optional().isIn(['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await SupabaseUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build filter
    const filter = {
      $or: [
        { organizer: req.params.id },
        { 'participants.user': req.params.id, 'participants.status': 'accepted' }
      ],
      isActive: true
    };

    // Check if viewing own profile or public trips
    const isOwnProfile = req.user && req.user.id === req.params.id;
    if (!isOwnProfile) {
      filter.visibility = 'public';
    }

    if (status) {
      filter.status = status;
    }

    const [trips, total] = await Promise.all([
      SupabaseTrip.findByUser(req.params.id, {
        status,
        isOwnProfile,
        limit: parseInt(limit),
        skip
      }),
      SupabaseTrip.countByUser(req.params.id, {
        status,
        isOwnProfile
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
          isLiked
        };
      })
    );

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
    console.error('Get user trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user trips'
    });
  }
});

// @route   PUT /api/users/profile/privacy
// @desc    Update user privacy settings
// @access  Private
router.put('/profile/privacy', auth, [
  body('isPrivate').optional().isBoolean(),
  body('showLocation').optional().isBoolean(),
  body('showTravelStats').optional().isBoolean(),
  body('allowTagging').optional().isBoolean(),
  body('profileVisibility').optional().isIn(['public', 'friends', 'private'])
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

    const updatedUser = await SupabaseUser.updatePrivacySettings(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update privacy settings'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('travelStyle').optional().isIn(['budget', 'mid-range', 'luxury', 'backpacking', 'family']),
  body('interests').optional().isArray(),
  body('interests.*').optional().isIn(['adventure', 'culture', 'food', 'nature', 'history', 'nightlife', 'shopping', 'relaxation']),
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean(),
  body('notifications.tripUpdates').optional().isBoolean(),
  body('notifications.socialActivity').optional().isBoolean(),
  body('privacy.profileVisibility').optional().isIn(['public', 'friends', 'private']),
  body('privacy.showEmail').optional().isBoolean(),
  body('privacy.showPhone').optional().isBoolean()
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

    const user = await SupabaseUser.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    Object.keys(req.body).forEach(key => {
      if (key in user.preferences) {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          user.preferences[key] = { ...user.preferences[key], ...req.body[key] };
        } else {
          user.preferences[key] = req.body[key];
        }
      }
    });

    await SupabaseUser.updatePreferences(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
});

// @route   POST /api/users/block/:id
// @desc    Block/unblock a user
// @route   POST /api/users/block/:id
// @desc    Block/unblock a user
// @access  Private
router.post('/block/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    const targetUser = await SupabaseUser.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isBlocked = await SupabaseUser.isBlocked(req.user.id, req.params.id);
    
    if (isBlocked) {
      // Unblock
      await SupabaseUser.unblock(req.user.id, req.params.id);
    } else {
      // Block and remove from following/followers
      await SupabaseUser.block(req.user.id, req.params.id);
    }

    res.json({
      success: true,
      message: isBlocked ? 'User unblocked successfully' : 'User blocked successfully',
      data: { isBlocked: !isBlocked }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while blocking user'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
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
    const updateData = {};

    // Map frontend fields to database fields
    if (req.body.name) {
      const [firstName, ...lastNameParts] = req.body.name.split(' ');
      updateData.first_name = firstName;
      updateData.last_name = lastNameParts.join(' ');
    }
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.bio) updateData.bio = req.body.bio;
    if (req.body.location) updateData.location = req.body.location;
    if (req.body.avatar) updateData.avatar_url = req.body.avatar;

    // Update user profile
    const updatedUser = await SupabaseUser.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

export default router;