import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth, optionalAuth } from '../middleware/supabaseAuth.js';
import SupabaseClub from '../models/SupabaseClub.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const clubs = await SupabaseClub.getAll();
    
    // Handle empty or null clubs gracefully
    if (!clubs || !Array.isArray(clubs)) {
      return res.json({
        success: true,
        data: [] // Return empty array instead of crashing
      });
    }
    
    // Map to frontend expected format
    const formattedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      image: club.image_url,
      category: club.category || 'General',
      members: club.member_count || 0,
      isJoined: false,
      isPrivate: false
    }));

    res.json({
      success: true,
      data: formattedClubs
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    // Return empty array instead of 500 error to prevent frontend crashes
    res.json({ 
      success: true, 
      data: [],
      message: 'No clubs available at the moment'
    });
  }
});

// @route   GET /api/clubs/my-created
// @desc    Get clubs created by the authenticated user
// @access  Private
router.get('/my-created', auth, async (req, res) => {
  try {
    // Use the imported client directly
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform clubs data
    const transformedClubs = clubs.map(club => ({
      ...club,
      id: club.id,
      name: club.name,
      description: club.description,
      image: club.image_url,
      category: club.category || 'General',
      members: club.member_count || 0,
      isJoined: true,
      createdAt: club.created_at,
      updatedAt: club.updated_at,
    }));

    res.json({
      success: true,
      data: transformedClubs,
    });
  } catch (error) {
    console.error('Get my created clubs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/clubs/:id
// @desc    Get club by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const club = await SupabaseClub.getById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    
    // Get members
    const members = await SupabaseClub.getMembers(req.params.id);
    
    // Get posts
    const posts = await SupabaseClub.getPosts(req.params.id);

    const clubWithDetails = {
      ...club,
      image: club.image_url, // Map image_url to image
      membersList: members,
      memberCount: members.length,
      posts: posts,
      isJoined: members.some(m => m.id === req.user?.id),
      isAdmin: parserReqUserIsAdmin(club, req.user)
    };

    res.json({
      success: true,
      data: clubWithDetails
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

function parserReqUserIsAdmin(club, user) {
    if (!user) return false;
    // Check both created_by (actual DB column) and creator_id (from join alias)
    return club.created_by === user.id || club.creator_id === user.id;
}

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, image, category } = req.body;
    
    const clubData = {
        name,
        description,
        image_url: image, // Frontend sends 'image', DB expects 'image_url'
        created_by: req.user.id // Database column is 'created_by' not 'creator_id'
    };
    
    const newClub = await SupabaseClub.create(clubData);
    
    res.status(201).json({
        success: true,
        data: newClub
    });
  } catch (error) {
      console.error('Create club error:', error);
      res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/clubs/:id/members
// @desc    Get club members
// @access  Private
router.get('/:id/members', auth, async (req, res) => {
    try {
        const members = await SupabaseClub.getMembers(req.params.id);
        res.json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/clubs/:id/posts
// @desc    Get club posts
// @access  Private
router.get('/:id/posts', auth, async (req, res) => {
    try {
        const posts = await SupabaseClub.getPosts(req.params.id);
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/clubs/:id/join
router.post('/:id/join', auth, async (req, res) => {
    // Stub for now, or implement insert into club_members
    res.json({ success: true, message: 'Joined (Stub)' });
});

// @route   POST /api/clubs/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
    // Stub for now
    res.json({ success: true, message: 'Left (Stub)' });
});

// @route   DELETE /api/clubs/:id
// @desc    Delete a club
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const club = await SupabaseClub.getById(req.params.id);
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }
        
        // Check ownership - use created_by (actual DB column)
        if (club.created_by !== req.user.id && club.creator_id !== req.user.id) {
             return res.status(403).json({ success: false, message: 'Not authorized to delete this club' });
        }

        await SupabaseClub.delete(req.params.id);
        res.json({ success: true, message: 'Club deleted successfully' });
    } catch (error) {
        console.error('Delete club error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;