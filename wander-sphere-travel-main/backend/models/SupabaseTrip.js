const supabase = require('../config/supabase');

class SupabaseTrip {
  // Create a new trip
  static async create(tripData) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;
      
      // Add organizer as participant
      await this.addParticipant(data.id, tripData.organizer_id, 'organizer', 'accepted');
      
      return data;
    } catch (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }
  }

  // Find trip by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          organizer:users!trips_organizer_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar
          ),
          participants:trip_participants(
            id,
            status,
            role,
            joined_at,
            user:users(
              id,
              first_name,
              last_name,
              email,
              avatar
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to find trip: ${error.message}`);
    }
  }

  // Find trips with filters
  static async find(filters = {}, limit = 10, offset = 0) {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          organizer:users!trips_organizer_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters.organizer_id) {
        query = query.eq('organizer_id', filters.organizer_id);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }
      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters.country) {
        query = query.eq('destination->>country', filters.country);
      }
      if (filters.city) {
        query = query.eq('destination->>city', filters.city);
      }

      // Apply sorting
      if (filters.sort) {
        const [field, direction] = filters.sort.split(':');
        query = query.order(field, { ascending: direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to find trips: ${error.message}`);
    }
  }

  // Update trip
  static async findByIdAndUpdate(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update trip: ${error.message}`);
    }
  }

  // Delete trip (soft delete)
  static async findByIdAndDelete(id) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to delete trip: ${error.message}`);
    }
  }

  // Add participant to trip
  static async addParticipant(tripId, userId, role = 'participant', status = 'pending') {
    try {
      // Check if user is already a participant
      const { data: existing } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('User is already a participant');
      }

      const { data, error } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: tripId,
          user_id: userId,
          role,
          status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add participant: ${error.message}`);
    }
  }

  // Remove participant from trip
  static async removeParticipant(tripId, userId) {
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to remove participant: ${error.message}`);
    }
  }

  // Update participant status
  static async updateParticipantStatus(tripId, userId, status) {
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .update({ status })
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update participant status: ${error.message}`);
    }
  }

  // Get trip participants
  static async getParticipants(tripId) {
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            email,
            avatar
          )
        `)
        .eq('trip_id', tripId);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get participants: ${error.message}`);
    }
  }

  // Add like to trip
  static async addLike(tripId, userId) {
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('trip_likes')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('Trip already liked');
      }

      const { data, error } = await supabase
        .from('trip_likes')
        .insert({
          trip_id: tripId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add like: ${error.message}`);
    }
  }

  // Remove like from trip
  static async removeLike(tripId, userId) {
    try {
      const { data, error } = await supabase
        .from('trip_likes')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to remove like: ${error.message}`);
    }
  }

  // Get trip likes count
  static async getLikesCount(tripId) {
    try {
      const { count, error } = await supabase
        .from('trip_likes')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Failed to get likes count: ${error.message}`);
    }
  }

  // Add comment to trip
  static async addComment(tripId, userId, content) {
    try {
      const { data, error } = await supabase
        .from('trip_comments')
        .insert({
          trip_id: tripId,
          user_id: userId,
          content
        })
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  // Get trip comments
  static async getComments(tripId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('trip_comments')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get comments: ${error.message}`);
    }
  }

  // Increment trip views
  static async incrementViews(tripId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_trip_views', { trip_id: tripId });

      if (error) throw error;
      return data;
    } catch (error) {
      // If RPC doesn't exist, fallback to manual increment
      try {
        const trip = await this.findById(tripId);
        if (trip) {
          await this.findByIdAndUpdate(tripId, { views: (trip.views || 0) + 1 });
        }
      } catch (fallbackError) {
        console.error('Failed to increment views:', fallbackError.message);
      }
    }
  }

  // Search trips
  static async search(query, filters = {}, limit = 10, offset = 0) {
    try {
      let searchQuery = supabase
        .from('trips')
        .select(`
          *,
          organizer:users!trips_organizer_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .eq('visibility', 'public');

      // Text search
      if (query) {
        searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          searchQuery = searchQuery.eq(key, filters[key]);
        }
      });

      searchQuery = searchQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await searchQuery;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to search trips: ${error.message}`);
    }
  }

  // Get trips count
  static async count(filters = {}) {
    try {
      let query = supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Apply filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.eq(key, filters[key]);
        }
      });

      const { count, error } = await query;

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Failed to count trips: ${error.message}`);
    }
  }

  // Get featured trips
  static async getFeatured(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          organizer:users!trips_organizer_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .eq('featured', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get featured trips: ${error.message}`);
    }
  }

  // Get trips by user
  static async getByUser(userId, includePrivate = false) {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          organizer:users!trips_organizer_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq('organizer_id', userId)
        .eq('is_active', true);

      if (!includePrivate) {
        query = query.neq('visibility', 'private');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get user trips: ${error.message}`);
    }
  }
}

module.exports = SupabaseTrip;