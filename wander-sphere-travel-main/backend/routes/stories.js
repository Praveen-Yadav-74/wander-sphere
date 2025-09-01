import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth as supabaseAuth, optionalAuth } from '../middleware/supabaseAuth.js';
import SupabaseUser from '../models/SupabaseUser.js';

const router = express.Router();

// In-memory story store (in production, use database)
const stories = new Map();

// Helper function to create story
const createStory = (userId, media, mediaType, duration = null) => {
  const story = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    media,
    mediaType,
    duration,
    views: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  if (!stories.has(userId)) {
    stories.set(userId, []);
  }
  
  const userStories = stories.get(userId);
  userStories.push(story);
  
  return story;
};

// Helper function to get user stories
const getUserStories = (userId) => {
  const userStories = stories.get(userId) || [];
  const now = new Date();
  
  // Filter out expired stories
  const activeStories = userStories.filter(story => new Date(story.expiresAt) > now);
  stories.set(userId, activeStories);
  
  return activeStories;
};

// @route   GET /api/stories
// @desc    Get stories feed
// @access  Private
router.get('/', supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active stories from all users
    const allStories = [];
    const now = new Date();
    
    for (const [storyUserId, userStories] of stories.entries()) {
      const activeStories = userStories.filter(story => new Date(story.expiresAt) > now);
      
      for (const story of activeStories) {
        try {
          const user = await SupabaseUser.findById(storyUserId);
          if (user) {
            allStories.push({
              ...story,
              user: {
                id: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || user.email,
                avatar: user.avatar
              },
              viewCount: story.views.length,
              isViewed: story.views.includes(userId),
              isOwner: story.userId === userId,
              isExpired: new Date(story.expiresAt) <= now
            });
          }
        } catch (error) {
          console.error('Error fetching user for story:', error);
        }
      }
    }
    
    // Sort by creation date (newest first)
    allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: {
        stories: allStories,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
      error: error.message
    });
  }
});

// @route   GET /api/stories/feed
// @desc    Get stories feed (same as above for compatibility)
// @access  Private
router.get('/feed', supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active stories from all users
    const allStories = [];
    const now = new Date();
    
    for (const [storyUserId, userStories] of stories.entries()) {
      const activeStories = userStories.filter(story => new Date(story.expiresAt) > now);
      
      for (const story of activeStories) {
        try {
          const user = await SupabaseUser.findById(storyUserId);
          if (user) {
            allStories.push({
              ...story,
              user: {
                id: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || user.email,
                avatar: user.avatar
              },
              viewCount: story.views.length,
              isViewed: story.views.includes(userId),
              isOwner: story.userId === userId,
              isExpired: new Date(story.expiresAt) <= now
            });
          }
        } catch (error) {
          console.error('Error fetching user for story:', error);
        }
      }
    }
    
    // Sort by creation date (newest first)
    allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: {
        stories: allStories,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching stories feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories feed',
      error: error.message
    });
  }
});

// @route   POST /api/stories
// @desc    Create a new story
// @access  Private
router.post('/', [
  supabaseAuth,
  body('mediaType').isIn(['image', 'video']).withMessage('Media type must be image or video'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number')
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
    const { media, mediaType, duration } = req.body;

    if (!media) {
      return res.status(400).json({
        success: false,
        message: 'Media is required'
      });
    }

    const story = createStory(userId, media, mediaType, duration);
    
    // Get user info
    const user = await SupabaseUser.findById(userId);
    
    const storyWithUser = {
      ...story,
      user: {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || user.email,
        avatar: user.avatar
      },
      viewCount: 0,
      isViewed: false,
      isOwner: true,
      isExpired: false
    };

    res.status(201).json({
      success: true,
      data: {
        story: storyWithUser
      },
      message: 'Story created successfully'
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: error.message
    });
  }
});

// @route   GET /api/stories/:id
// @desc    Get story by ID
// @access  Private
router.get('/:id', supabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find story across all users
    let foundStory = null;
    let storyUserId = null;
    
    for (const [userId, userStories] of stories.entries()) {
      const story = userStories.find(s => s.id === id);
      if (story) {
        foundStory = story;
        storyUserId = userId;
        break;
      }
    }
    
    if (!foundStory) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Check if story is expired
    if (new Date(foundStory.expiresAt) <= new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Story has expired'
      });
    }
    
    // Get user info
    const user = await SupabaseUser.findById(storyUserId);
    
    const storyWithUser = {
      ...foundStory,
      user: {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || user.email,
        avatar: user.avatar
      },
      viewCount: foundStory.views.length,
      isViewed: foundStory.views.includes(userId),
      isOwner: foundStory.userId === userId,
      isExpired: new Date(foundStory.expiresAt) <= new Date()
    };

    res.json({
      success: true,
      data: {
        story: storyWithUser
      }
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story',
      error: error.message
    });
  }
});

// @route   POST /api/stories/:id/view
// @desc    Mark story as viewed
// @access  Private
router.post('/:id/view', supabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find story across all users
    let foundStory = null;
    let storyUserId = null;
    
    for (const [userId, userStories] of stories.entries()) {
      const story = userStories.find(s => s.id === id);
      if (story) {
        foundStory = story;
        storyUserId = userId;
        break;
      }
    }
    
    if (!foundStory) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Add view if not already viewed
    if (!foundStory.views.includes(userId)) {
      foundStory.views.push(userId);
    }

    res.json({
      success: true,
      data: {
        viewCount: foundStory.views.length
      },
      message: 'Story viewed successfully'
    });
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view story',
      error: error.message
    });
  }
});

// @route   DELETE /api/stories/:id
// @desc    Delete story
// @access  Private
router.delete('/:id', supabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const userStories = stories.get(userId) || [];
    const storyIndex = userStories.findIndex(story => story.id === id);
    
    if (storyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or you do not have permission to delete it'
      });
    }
    
    userStories.splice(storyIndex, 1);
    stories.set(userId, userStories);

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
      error: error.message
    });
  }
});

export default router;