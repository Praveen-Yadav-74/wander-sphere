import supabase from '../config/supabase.js';

class SupabaseTripRequest {
  // Create a request
  static async create({ trip_id, user_id, message }) {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
        .insert({ trip_id, user_id, message })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create trip request: ${error.message}`);
    }
  }

  // Get requests for a trip (for host)
  static async getByTripId(trip_id) {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
        .select(`
          *,
          user:users!trip_requests_user_id_fkey (
            id, first_name, last_name, avatar_url, username
          )
        `)
        .eq('trip_id', trip_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get trip requests: ${error.message}`);
    }
  }

  // Get requests by a user (for "My Interests")
  static async getByUserId(user_id) {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
        .select(`
          *,
          trip:trips!trip_requests_trip_id_fkey (
            id, title, destination, start_date, end_date, images,
            organizer:users!trips_user_id_fkey (
              id, first_name, last_name, avatar_url
            )
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get user requests: ${error.message}`);
    }
  }

  // Find request by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
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
  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
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
