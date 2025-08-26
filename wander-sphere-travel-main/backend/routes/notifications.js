import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth as supabaseAuth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// In-memory notification store (in production, use Redis or database)
const notifications = new Map();

// Helper function to create notification
const createNotification = (userId, type, title, message, data = {}) => {
  const notification = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  
  const userNotifications = notifications.get(userId);
  userNotifications.unshift(notification);
  
  // Keep only last 100 notifications per user
  if (userNotifications.length > 100) {
    userNotifications.splice(100);
  }
  
  return notification;
};

// Helper function to send notification to user
const sendNotification = (userId, type, title, message, data = {}) => {
  const notification = createNotification(userId, type, title, message, data);
  
  // In production, you would emit this via WebSocket/Socket.IO
  // io.to(userId).emit('notification', notification);
  
  return notification;
};

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', supabaseAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['like', 'comment', 'follow', 'trip_update', 'trip_invite', 'system']),
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
    
    let userNotifications = notifications.get(req.user.id) || [];
    
    // Filter by type
    if (type) {
      userNotifications = userNotifications.filter(n => n.type === type);
    }
    
    // Filter by read status
    if (read !== undefined) {
      const isRead = read === 'true';
      userNotifications = userNotifications.filter(n => n.read === isRead);
    }
    
    // Pagination
    const total = userNotifications.length;
    const paginatedNotifications = userNotifications.slice(skip, skip + parseInt(limit));
    
    // Count unread notifications
    const unreadCount = (notifications.get(req.user.id) || []).filter(n => !n.read).length;

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
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
    const userNotifications = notifications.get(req.user.id) || [];
    const unreadCount = userNotifications.filter(n => !n.read).length;

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
    const userNotifications = notifications.get(req.user.id) || [];
    const notification = userNotifications.find(n => n.id === req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    notification.updatedAt = new Date();

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
    const userNotifications = notifications.get(req.user.id) || [];
    
    userNotifications.forEach(notification => {
      notification.read = true;
      notification.updatedAt = new Date();
    });

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
    const userNotifications = notifications.get(req.user.id) || [];
    const notificationIndex = userNotifications.findIndex(n => n.id === req.params.id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    userNotifications.splice(notificationIndex, 1);

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

// @route   DELETE /api/notifications
// @desc    Delete all notifications
// @access  Private
router.delete('/', supabaseAuth, async (req, res) => {
  try {
    notifications.set(req.user.id, []);

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting all notifications'
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Create test notification (development only)
// @access  Private
router.post('/test', supabaseAuth, [
  body('type').isIn(['like', 'comment', 'follow', 'trip_update', 'trip_invite', 'system']),
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
    
    const notification = sendNotification(req.user.id, type, title, message, data);

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

// Notification helper functions for other routes to use
const notificationHelpers = {
  sendNotification,
  createNotification,
  
  // Send like notification
  sendLikeNotification: (userId, likerName, tripTitle, tripId) => {
    return sendNotification(
      userId,
      'like',
      'New Like',
      `${likerName} liked your trip "${tripTitle}"`,
      { tripId, likerName }
    );
  },
  
  // Send comment notification
  sendCommentNotification: (userId, commenterName, tripTitle, tripId, commentId) => {
    return sendNotification(
      userId,
      'comment',
      'New Comment',
      `${commenterName} commented on your trip "${tripTitle}"`,
      { tripId, commentId, commenterName }
    );
  },
  
  // Send follow notification
  sendFollowNotification: (userId, followerName, followerId) => {
    return sendNotification(
      userId,
      'follow',
      'New Follower',
      `${followerName} started following you`,
      { followerId, followerName }
    );
  },
  
  // Send trip update notification
  sendTripUpdateNotification: (userId, tripTitle, tripId, updateType) => {
    const messages = {
      'status_change': `Trip "${tripTitle}" status has been updated`,
      'itinerary_change': `Itinerary for "${tripTitle}" has been updated`,
      'participant_joined': `Someone joined your trip "${tripTitle}"`,
      'participant_left': `Someone left your trip "${tripTitle}"`,
      'date_change': `Dates for "${tripTitle}" have been updated`
    };
    
    return sendNotification(
      userId,
      'trip_update',
      'Trip Update',
      messages[updateType] || `Your trip "${tripTitle}" has been updated`,
      { tripId, updateType }
    );
  },
  
  // Send trip invitation notification
  sendTripInviteNotification: (userId, inviterName, tripTitle, tripId) => {
    return sendNotification(
      userId,
      'trip_invite',
      'Trip Invitation',
      `${inviterName} invited you to join "${tripTitle}"`,
      { tripId, inviterName }
    );
  },
  
  // Send system notification
  sendSystemNotification: (userId, title, message, data = {}) => {
    return sendNotification(userId, 'system', title, message, data);
  }
};

// Export router and helpers
export default router;
export {
  sendNotification,
  createNotification,
  notificationHelpers
};

// Export individual helper functions
export const {
  sendLikeNotification,
  sendCommentNotification,
  sendFollowNotification,
  sendTripUpdateNotification,
  sendTripInviteNotification,
  sendSystemNotification
} = notificationHelpers;