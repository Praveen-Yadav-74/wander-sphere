import supabase from '../config/supabase.js';

class SupabaseNotification {
  // Create a notification
  static async create(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Get user notifications
  static async findByUser(userId, limit = 20, offset = 0, type = null, isRead = null) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      if (isRead !== null) {
        query = query.eq('is_read', isRead);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  // Count unread notifications
  static async countUnread(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Failed to count unread notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markAsRead(id, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId) // Security check
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete notification
  static async delete(id, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // --- Helper Methods ---

  static async sendLikeNotification(userId, likerName, tripTitle, tripId) {
    return this.create({
      user_id: userId,
      type: 'like',
      title: 'New Like',
      message: `${likerName} liked your trip "${tripTitle}"`,
      data: { tripId, likerName },
      action_url: `/trips/${tripId}`
    });
  }

  static async sendCommentNotification(userId, commenterName, tripTitle, tripId, commentId) {
    return this.create({
      user_id: userId,
      type: 'comment',
      title: 'New Comment',
      message: `${commenterName} commented on your trip "${tripTitle}"`,
      data: { tripId, commentId, commenterName },
      action_url: `/trips/${tripId}#comment-${commentId}`
    });
  }

  static async sendFollowNotification(userId, followerName, followerId) {
    return this.create({
      user_id: userId,
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`,
      data: { followerId, followerName, actor_id: followerId },
      action_url: `/profile/${followerId}`
    });
  }

  static async sendFollowRequestNotification(userId, requesterName, requesterId) {
    return this.create({
      user_id: userId,
      type: 'follow_request',
      title: 'Follow Request',
      message: `${requesterName} wants to follow you`,
      data: { requesterId, requesterName, actor_id: requesterId },
      action_url: `/profile/${requesterId}`
    });
  }

  static async sendFollowAcceptedNotification(userId, followingName, followingId) {
    return this.create({
      user_id: userId,
      type: 'follow_accepted',
      title: 'Request Accepted',
      message: `${followingName} accepted your follow request`,
      data: { followingId, followingName, actor_id: followingId },
      action_url: `/profile/${followingId}`
    });
  }

  static async sendTripUpdateNotification(userId, tripTitle, tripId, updateType) {
    const messages = {
      'status_change': `Trip "${tripTitle}" status has been updated`,
      'itinerary_change': `Itinerary for "${tripTitle}" has been updated`,
      'participant_joined': `Someone joined your trip "${tripTitle}"`,
      'participant_left': `Someone left your trip "${tripTitle}"`,
      'date_change': `Dates for "${tripTitle}" have been updated`
    };

    return this.create({
      user_id: userId,
      type: 'trip_update',
      title: 'Trip Update',
      message: messages[updateType] || `Your trip "${tripTitle}" has been updated`,
      data: { tripId, updateType },
      action_url: `/trips/${tripId}`
    });
  }

  static async sendTripInviteNotification(userId, inviterName, tripTitle, tripId) {
    return this.create({
      user_id: userId,
      type: 'trip_invite',
      title: 'Trip Invitation',
      message: `${inviterName} invited you to join "${tripTitle}"`,
      data: { tripId, inviterName },
      action_url: `/trips/${tripId}`
    });
  }

  static async sendSystemNotification(userId, title, message, data = {}) {
    return this.create({
      user_id: userId,
      type: 'system',
      title,
      message,
      data
    });
  }
}

export default SupabaseNotification;
