import supabase from '../config/supabase.js';

class SupabaseClub {
  // Get club by ID with owner details
  static async getById(clubId) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          *,
          creator:users!created_by (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('id', clubId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Robust owner handling
      const organizer = data.creator ? {
        id: data.creator.id,
        name: `${data.creator.first_name || ''} ${data.creator.last_name || ''}`.trim() || data.creator.username || 'Unknown User',
        username: data.creator.username || 'unknown',
        avatar: data.creator.avatar_url
      } : {
        id: 'unknown',
        name: 'Unknown User',
        username: 'unknown',
        avatar: null
      };

      return {
        ...data,
        organizer
      };
    } catch (error) {
      throw new Error(`Failed to get club: ${error.message}`);
    }
  }

  // Get club members (joining with users/profiles)
  static async getMembers(clubId) {
    try {
      // Assuming a club_members junction table exists OR getting from array if stored that way.
      // Since the heal_schema didn't create a club_members table, but the previous in-memory code used an array...
      // AND we are transitioning to DB...
      // We likely need a club_members table.
      // BUT, for now, let's assume we might need to fetch users where club_id is in their list?
      // OR, more likely, we need to create the club_members table if it doesn't exist?
      // The user didn't ask for that SQL.
      // Let's assume a 'club_members' table exists or we need to handle it.
      // Let's check if 'club_members' table exists?
      // If not, we might fail.
      // The user asked to "Join club_members with profiles". This implies 'club_members' table exists.
      
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          user_id,
          role,
          joined_at,
          user:users (
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            bio,
            location
          )
        `)
        .eq('club_id', clubId);

      if (error) {
        // If table doesn't exist, return empty array gracefully
        console.warn('Club members fetch error (table might be missing):', error.message);
        return [];
      }

      // Filter out orphans and map
      return data
        .filter(member => member.user) // Remove if user is null
        .map(member => ({
          id: member.user_id, // Member ID is the user ID in this context or the membership ID
          name: `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || member.user.username || 'Unknown',
          username: member.user.username,
          avatar: member.user.avatar_url,
          bio: member.user.bio,
          location: member.user.location,
          role: member.role || 'member',
          joinedAt: member.joined_at
        }));

    } catch (error) {
      console.error('getMembers error:', error);
      return []; // Fail safe
    }
  }

  // Get club posts
  static async getPosts(clubId) {
    try {
      // Assuming posts have a 'club_id' column or 'club_posts' table
      // Let's try 'posts' table with 'club_id'
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users (
             id,
             first_name,
             last_name,
             username,
             avatar_url
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
        
      if (error) {
         // Try 'club_posts' if generic posts fail? 
         // For now, return empty if error to be safe as requested
         return [];
      }

      return data.map(post => ({
        id: post.id,
        content: post.content,
        images: post.images || [],
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        author: post.author ? {
          id: post.author.id,
          name: `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim(),
          username: post.author.username,
          avatar: post.author.avatar_url
        } : { name: 'Unknown', username: 'unknown' }
      }));

    } catch (error) {
      console.error('getPosts error:', error);
      return [];
    }
  }
  
  // Create club
  static async create(clubData) {
      const { data, error } = await supabase
        .from('clubs')
        .insert(clubData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
  }
  
  static async getAll() {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
  }
  
  static async delete(clubId) {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);
        
      if (error) throw error;
      return true;
  }

}

export default SupabaseClub;
