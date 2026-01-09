import supabase from '../config/supabase.js';

class SupabaseTripRequest {
  // Create a request (Add participant with status 'pending')
  static async create({ trip_id, user_id, message }) {
    try {
      // Check if already exists
      const existing = await this.findByTripAndUser(trip_id, user_id);
      if (existing) {
        throw new Error('You have already requested to join this trip');
      }

      const { data, error } = await supabase
        .from('trip_participants')
        .insert({ 
          trip_id, 
          user_id, 
          status: 'pending', 
          role: 'participant',
          // message column might not exist in trip_participants? 
          // If user wants message, we might need to store it elsewhere or check schema.
          // Schema check showed: id, trip_id, user_id, joined_at, role, status. NO MESSAGE.
          // So we ignore message for now or store in notes? schema didn't show notes for participants.
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create trip request: ${error.message}`);
    }
  }

  // Helper to check existing
  static async findByTripAndUser(trip_id, user_id) {
    const { data } = await supabase
      .from('trip_participants')
      .select('id')
      .eq('trip_id', trip_id)
      .eq('user_id', user_id)
      .single();
    return data;
  }

  // Get requests for a trip (for host) - Filter by status 'pending'
  static async getByTripId(trip_id) {
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          *,
          user:users (
            id, first_name, last_name, avatar_url, username
          )
        `)
        .eq('trip_id', trip_id)
        .eq('status', 'pending') // Only pending requests
        .order('joined_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get trip requests: ${error.message}`);
    }
  }

  // Get requests by a user - "My Requests"
  static async getByUserId(user_id) {
    if (!user_id) return [];

    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          *,
          trip:trips (
            id, title, destination, start_date, end_date, images,
            organizer:users (
              id, first_name, last_name, avatar_url
            )
          )
        `)
        .eq('user_id', user_id)
        // We probably want to see pending requests here? Or all?
        // Usually "Requests" tab shows pending. 'accepted' shows in "Upcoming Trips".
        // Let's return pending requests.
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });
        
      if (error) {
        console.error('Supabase join error (getByUserId):', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user requests:', error);
      return [];
    }
  }

  // Find request by ID (participant ID)
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to find request: ${error.message}`);
    }
  }

  // Update status (approve/reject)
  // If rejected, usually we delete the row or set status 'rejected'.
  static async updateStatus(id, status) {
    try {
      if (status === 'rejected') {
         // Option: Delete row or set status. 
         // If we delete, history is lost. If we set 'rejected', it persists.
         // Let's set status 'rejected'.
      }

      const { data, error } = await supabase
        .from('trip_participants')
        .update({ status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update request status: ${error.message}`);
    }
  }
}

export default SupabaseTripRequest;
