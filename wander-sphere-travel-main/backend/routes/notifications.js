import express from 'express';
import { body, query, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';
import { auth as supabaseAuth } from '../middleware/supabaseAuth.js';
import SupabaseNotification from '../models/SupabaseNotification.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', supabaseAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['like', 'comment', 'follow', 'follow_request', 'follow_accepted', 'trip_update', 'trip_invite', 'system']),
  query('read').optional().isBoolean()
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

    const { page = 1, limit = 20, type, read } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Filter by read status
    const isRead = read !== undefined ? read === 'true' : null;

    const [notifications, total] = await Promise.all([
      SupabaseNotification.findByUser(req.user.id, parseInt(limit), skip, type, isRead),
      // We don't have a count method with filters in the model yet, but we can get unread count
      SupabaseNotification.countUnread(req.user.id)
    ]);
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: total, // Approximate or specifically unread count
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', supabaseAuth, async (req, res) => {
  try {
    const unreadCount = await SupabaseNotification.countUnread(req.user.id);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', supabaseAuth, async (req, res) => {
  try {
    const notification = await SupabaseNotification.markAsRead(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', supabaseAuth, async (req, res) => {
  try {
    await SupabaseNotification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', supabaseAuth, async (req, res) => {
  try {
    await SupabaseNotification.delete(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
});

// @route   GET /api/notifications/settings
// @desc    Get notification settings
// @access  Private
router.get('/settings', supabaseAuth, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if none exist
    const defaultSettings = {
      email_notifications: true,
      push_notifications: true,
      trip_updates: true,
      comments: true,
      likes: true,
      follows: true,
      marketing: false
    };

    res.json({
      success: true,
      data: settings || defaultSettings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings'
    });
  }
});

// @route   PUT /api/notifications/settings
// @desc    Update notification settings
// @access  Private
router.put('/settings', supabaseAuth, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: req.user.id,
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Create test notification (development only)
// @access  Private
router.post('/test', supabaseAuth, [
  body('type').isIn(['like', 'comment', 'follow', 'follow_request', 'follow_accepted', 'trip_update', 'trip_invite', 'system']),
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('message').trim().isLength({ min: 1, max: 500 }),
  body('data').optional().isObject()
], async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications not allowed in production'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, title, message, data = {} } = req.body;
    
    // Use SupabaseNotification model directly
    const notification = await SupabaseNotification.create({
        user_id: req.user.id,
        type,
        title,
        message,
        data
    });

    res.json({
      success: true,
      message: 'Test notification created',
      data: { notification }
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating test notification'
    });
  }
});

export default router;
