import supabase from '../config/supabase.js';
import SupabaseNotification from './SupabaseNotification.js';

class SupabaseUser {
  // Create a new user (used internally, registration handled by auth service)
  static async create(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Update user
  static async findByIdAndUpdate(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user (soft delete)
  static async findByIdAndDelete(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Update user privacy settings
  static async updatePrivacySettings(userId, settings) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const currentPreferences = user.preferences || {
        travelStyle: 'mid-range',
        interests: [],
        notifications: {
          email: true,
          push: true,
          tripUpdates: true,
          socialActivity: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true,
          showTravelStats: true,
          allowTagging: true
        }
      };

      // Extract is_private (default to current value or false)
      const isPrivate = settings.isPrivate !== undefined ? settings.isPrivate : (user.is_private || false);
      
      // Update privacy preferences
      // Map flat settings to nested privacy object if needed, or merge
      const privacyUpdates = {};
      if (settings.profileVisibility) privacyUpdates.profileVisibility = settings.profileVisibility;
      // If isPrivate is true, force profileVisibility to 'private' (or handle logic here)
      if (isPrivate) {
        privacyUpdates.profileVisibility = 'private';
      } else if (settings.isPrivate === false && currentPreferences.privacy.profileVisibility === 'private') {
        // If switching from private to public, set visibility to public? Or let user decide?
        // For now, let's default to 'public' if switching off private, unless specified
        privacyUpdates.profileVisibility = 'public';
      }

      if (settings.showLocation !== undefined) privacyUpdates.showLocation = settings.showLocation;
      if (settings.showTravelStats !== undefined) privacyUpdates.showTravelStats = settings.showTravelStats;
      if (settings.allowTagging !== undefined) privacyUpdates.allowTagging = settings.allowTagging;
      if (settings.showEmail !== undefined) privacyUpdates.showEmail = settings.showEmail;
      if (settings.showPhone !== undefined) privacyUpdates.showPhone = settings.showPhone;

      const updatedPreferences = {
        ...currentPreferences,
        privacy: {
          ...currentPreferences.privacy,
          ...privacyUpdates
        }
      };

      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_private: isPrivate,
          preferences: updatedPreferences 
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update privacy settings: ${error.message}`);
    }
  }

  // Get user followers
  static async getFollowers(userId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .select(`
          follower_id,
          follower:users!user_relationships_follower_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('following_id', userId);

      if (error) throw error;
      return data.map(item => item.follower);
    } catch (error) {
      throw new Error(`Failed to get followers: ${error.message}`);
    }
  }

  // Get users that this user is following
  static async getFollowing(userId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .select(`
          following_id,
          following:users!user_relationships_following_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      return data.map(item => item.following);
    } catch (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }
  }

  // Check if user is following another user
  static async isFollowing(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .select('status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data && data.status === 'accepted';
    } catch (error) {
      // If error is PGRST116 (no rows), return false
      return false;
    }
  }

  // Check if follow request is pending
  static async isFollowPending(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .select('status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data && data.status === 'pending';
    } catch (error) {
      return false;
    }
  }

  // Follow a user
  static async follow(followerId, followingId) {
    try {
      // Check if already following or pending
      const { data: existing } = await supabase
        .from('user_relationships')
        .select('id, status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Already following this user');
        } else if (existing.status === 'pending') {
          throw new Error('Follow request already sent');
        } else if (existing.status === 'blocked') {
          throw new Error('Cannot follow this user');
        }
      }

      // Check target user privacy
      const targetUser = await this.findById(followingId);
      if (!targetUser) throw new Error('User not found');

      // Check privacy settings (is_private or privacy_settings.profile_visibility)
      const isPrivate = targetUser.is_private || 
                        targetUser.privacy_settings?.profile_visibility === 'private' ||
                        targetUser.preferences?.privacy?.profileVisibility === 'private';

      const status = isPrivate ? 'pending' : 'accepted';

      const { data, error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: followerId,
          following_id: followingId,
          status: status
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification
      const follower = await this.findById(followerId);
      const followerName = `${follower.first_name} ${follower.last_name}`;

      if (status === 'pending') {
        await SupabaseNotification.sendFollowRequestNotification(followingId, followerName, followerId);
      } else {
        await SupabaseNotification.sendFollowNotification(followingId, followerName, followerId);
      }

      return { ...data, isPending: status === 'pending' };
    } catch (error) {
      throw new Error(`Failed to follow user: ${error.message}`);
    }
  }

  // Get pending follow requests
  static async getFollowRequests(userId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .select(`
          created_at,
          follower:users!user_relationships_follower_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('following_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return data.map(item => ({
        ...item.follower,
        requestedAt: item.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to get follow requests: ${error.message}`);
    }
  }

  // Accept follow request
  static async acceptFollowRequest(userId, followerId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('following_id', userId) // current user is the one being followed
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No pending follow request found');

      // Send notification to the follower
      const user = await this.findById(userId);
      const userName = `${user.first_name} ${user.last_name}`;
      await SupabaseNotification.sendFollowAcceptedNotification(followerId, userName, userId);

      return data;
    } catch (error) {
      throw new Error(`Failed to accept follow request: ${error.message}`);
    }
  }

  // Reject/Cancel follow request
  static async rejectFollowRequest(userId, followerId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to reject follow request: ${error.message}`);
    }
  }

  // Unfollow a user
  static async unfollow(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }
  }

  // Block a user
  static async blockUser(blockerId, blockedId) {
    try {
      // Check if already blocked
      const { data: existing } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .single();

      if (existing) {
        throw new Error('User is already blocked');
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  // Unblock a user
  static async unblockUser(blockerId, blockedId) {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
  }

  // Get blocked users
  static async getBlockedUsers(userId) {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          blocked:users!blocked_users_blocked_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('blocker_id', userId);

      if (error) throw error;
      return data.map(item => item.blocked);
    } catch (error) {
      throw new Error(`Failed to get blocked users: ${error.message}`);
    }
  }

  // Update user stats
  static async updateStats(userId, statsUpdate) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const currentStats = user.stats || {
        tripsCompleted: 0,
        countriesVisited: 0,
        totalDistance: 0,
        totalSpent: 0
      };

      const updatedStats = { ...currentStats, ...statsUpdate };

      const { data, error } = await supabase
        .from('users')
        .update({ stats: updatedStats })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update user stats: ${error.message}`);
    }
  }

  // Update user preferences
  static async updatePreferences(userId, preferencesUpdate) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const currentPreferences = user.preferences || {
        travelStyle: 'mid-range',
        interests: [],
        notifications: {
          email: true,
          push: true,
          tripUpdates: true,
          socialActivity: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      };

      const updatedPreferences = { ...currentPreferences, ...preferencesUpdate };

      const { data, error } = await supabase
        .from('users')
        .update({ preferences: updatedPreferences })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  // Search users
  static async search(query, limit = 10, offset = 0) {
    try {
      // Sanitize the search query to prevent SQL injection
      const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, email, avatar_url, bio, location')
        .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,username.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
        .eq('is_active', true)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Get user count
  static async count() {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }
}

export default SupabaseUser;