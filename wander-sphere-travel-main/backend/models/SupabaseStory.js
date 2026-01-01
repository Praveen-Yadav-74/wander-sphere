import supabase from '../config/supabase.js';

class SupabaseStory {
  // Create a new story
  static async create(storyData) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create story: ${error.message}`);
    }
  }

  // Get active stories for all users (or specific users if needed)
  static async getActiveStories() {
    try {
      const { data, error } = await supabase
        .from('active_stories')
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get active stories: ${error.message}`);
    }
  }

  // Get active stories for a specific user
  static async getActiveStoriesByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('active_stories')
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get user active stories: ${error.message}`);
    }
  }

  // Delete a story
  static async delete(storyId, userId) {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Failed to delete story: ${error.message}`);
    }
  }

  // Increment view count for a story
  static async incrementViews(storyId) {
    try {
      // First get the current story
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('views_count')
        .eq('id', storyId)
        .single();

      if (fetchError) throw fetchError;

      // Increment the view count
      const newViewCount = (story.views_count || 0) + 1;

      const { data, error } = await supabase
        .from('stories')
        .update({ views_count: newViewCount })
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to increment story views: ${error.message}`);
    }
  }

  // Get story by ID
  static async findById(storyId) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to find story: ${error.message}`);
    }
  }
}

export default SupabaseStory;
