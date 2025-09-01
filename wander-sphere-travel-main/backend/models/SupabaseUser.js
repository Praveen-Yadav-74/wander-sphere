import supabase from '../config/supabase.js';

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
            avatar
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
            avatar
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      return data.map(item => item.following);
    } catch (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }
  }

  // Follow a user
  static async followUser(followerId, followingId) {
    try {
      // Check if already following
      const { data: existing } = await supabase
        .from('user_relationships')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existing) {
        throw new Error('Already following this user');
      }

      const { data, error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to follow user: ${error.message}`);
    }
  }

  // Unfollow a user
  static async unfollowUser(followerId, followingId) {
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
            avatar
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
        .select('id, first_name, last_name, username, email, avatar, bio, location')
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