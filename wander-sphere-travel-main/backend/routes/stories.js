import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { auth as supabaseAuth } from '../middleware/supabaseAuth.js';
import SupabaseStory from '../models/SupabaseStory.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to validate file types
const isValidMediaType = (mimetype) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  return allowedImageTypes.includes(mimetype) || allowedVideoTypes.includes(mimetype);
};

// File filter function
const fileFilter = (req, file, cb) => {
  if (isValidMediaType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Memory storage for file uploads
const memoryStorage = multer.memoryStorage();

// Multer configuration for story media
const uploadStoryMedia = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter
});

// @route   GET /api/stories
// @desc    Get stories feed
// @access  Private
router.get('/', supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active stories from database
    const storiesData = await SupabaseStory.getActiveStories();
    
    const allStories = storiesData.map(story => ({
      id: story.id,
      userId: story.user_id,
      media: story.media_url,
      mediaType: story.media_type,
      caption: story.caption,
      createdAt: story.created_at,
      expiresAt: story.expires_at,
      user: {
        id: story.user.id,
        firstName: story.user.first_name || '',
        lastName: story.user.last_name || '',
        username: story.user.username,
        avatar: story.user.avatar_url
      },
      viewCount: story.views_count || 0,
      isViewed: false, // TODO: Implement view tracking if needed
      isOwner: story.user_id === userId,
      isExpired: false
    }));
    
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
  // Reuse the logic from GET /
  try {
    const userId = req.user.id;
    const storiesData = await SupabaseStory.getActiveStories();
    
    const allStories = storiesData.map(story => ({
      id: story.id,
      userId: story.user_id,
      media: story.media_url,
      mediaType: story.media_type,
      caption: story.caption,
      createdAt: story.created_at,
      expiresAt: story.expires_at,
      user: {
        id: story.user.id,
        firstName: story.user.first_name || '',
        lastName: story.user.last_name || '',
        username: story.user.username,
        avatar: story.user.avatar_url
      },
      viewCount: story.views_count || 0,
      isViewed: false,
      isOwner: story.user_id === userId,
      isExpired: false
    }));
    
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
  (req, res, next) => {
    uploadStoryMedia.single('media')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  }
], async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    const { caption } = req.body; // Removed mediaUrl from destructuring as we access req.body.mediaUrl directly below
    
    let mediaUrl = '';
    let mediaType = 'image';
    
    if (file) {
      // Convert buffer to base64
      // Note: In production, upload to Supabase Storage and get URL
      const b64 = Buffer.from(file.buffer).toString('base64');
      mediaUrl = `data:${file.mimetype};base64,${b64}`;
      
      if (file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
    } else if (req.body.mediaUrl) { // CORRECTED: Get mediaUrl from req.body directly
      mediaUrl = req.body.mediaUrl;
      // Simple check for video extension
      if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
        mediaType = 'video';
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No media provided'
      });
    }

    const storyData = {
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption || '',
      // expires_at defaults to 24h from now in DB
    };

    const newStory = await SupabaseStory.create(storyData);
    
    // Return formatted story
    res.status(201).json({
      success: true,
      data: {
        story: {
          id: newStory.id,
          userId: newStory.user_id,
          media: newStory.media_url,
          mediaType: newStory.media_type,
          caption: newStory.caption,
          createdAt: newStory.created_at,
          expiresAt: newStory.expires_at,
          viewCount: 0,
          isViewed: false,
          isOwner: true,
          isExpired: false
        }
      }
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

// @route   DELETE /api/stories/:id
// @desc    Delete a story
// @access  Private
router.delete('/:id', supabaseAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;
    
    await SupabaseStory.delete(storyId, userId);
    
    res.json({
      success: true,
      data: {}
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

// @route   POST /api/stories/:id/view
// @desc    Mark story as viewed
// @access  Private
router.post('/:id/view', supabaseAuth, async (req, res) => {
  try {
    const storyId = req.params.id;
    
    const updatedStory = await SupabaseStory.incrementViews(storyId);
    
    res.json({
      success: true,
      data: {
        viewCount: updatedStory.views_count
      }
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

export default router;
