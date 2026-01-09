/**
 * Follows Routes
 * Handles follow/unfollow operations and social network features
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { auth as supabaseAuth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// =============================================
// @route   POST /api/follows/:userId
// @desc    Follow a user
// @access  Private
// =============================================
router.post('/:userId', supabaseAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    // Validate input
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Prevent self-follow
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, is_private')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user',
      });
    }

    // Create follow relationship
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      })
      .select()
      .single();

    if (followError) {
      throw new Error(`Failed to follow user: ${followError.message}`);
    }

    // Get updated counts
    const { data: followerCount } = await supabase
      .rpc('get_follower_count', { user_id: targetUserId });

    res.status(201).json({
      success: true,
      data: {
        follow,
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          is_private: targetUser.is_private,
        },
        followerCount: followerCount || 0,
      },
      message: `Now following ${targetUser.username}`,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message,
    });
  }
});

// =============================================
// @route   DELETE /api/follows/:userId
// @desc    Unfollow a user
// @access  Private
// =============================================
router.delete('/:userId', supabaseAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    // Validate input
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (unfollowError) {
      throw new Error(`Failed to unfollow user: ${unfollowError.message}`);
    }

    // Get updated counts
    const { data: followerCount } = await supabase
      .rpc('get_follower_count', { user_id: targetUserId });

    res.json({
      success: true,
      data: {
        followerCount: followerCount || 0,
      },
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user',
      error: error.message,
    });
  }
});

// =============================================
// @route   GET /api/follows/:userId/status
// @desc    Check if current user follows target user
// @access  Private
// =============================================
router.get('/:userId/status', supabaseAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const { data: isFollowing } = await supabase
      .rpc('is_following', {
        follower: currentUserId,
        following: targetUserId,
      });

    res.json({
      success: true,
      data: {
        isFollowing: isFollowing || false,
      },
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status',
      error: error.message,
    });
  }
});

// =============================================
// @route   GET /api/follows/followers/:userId
// @desc    Get followers for a user
// @access  Private
// =============================================
router.get('/followers/:userId', supabaseAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const { data: followers, error } = await supabase
      .rpc('get_followers', { user_id: userId });

    if (error) {
      throw new Error(`Failed to get followers: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        followers: followers || [],
        count: followers?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get followers',
      error: error.message,
    });
  }
});

// =============================================
// @route   GET /api/follows/following/:userId
// @desc    Get users being followed by a user
// @access  Private
// =============================================
router.get('/following/:userId', supabaseAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const { data: following, error } = await supabase
      .rpc('get_following', { user_id: userId });

    if (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        following: following || [],
        count: following?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get following',
      error: error.message,
    });
  }
});

// =============================================
// @route   GET /api/follows/suggested
// @desc    Get suggested users to follow
// @access  Private
// =============================================
router.get('/suggested', supabaseAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const { data: suggestedUsers, error } = await supabase
      .rpc('get_suggested_users', {
        for_user_id: currentUserId,
        limit_count: limit,
      });

    if (error) {
      throw new Error(`Failed to get suggested users: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        users: suggestedUsers || [],
        count: suggestedUsers?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting suggested users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggested users',
      error: error.message,
    });
  }
});

// =============================================
// @route   GET /api/follows/stats/:userId
// @desc    Get follow statistics for a user
// @access  Private
// =============================================
router.get('/stats/:userId', supabaseAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    // Get follower count
    const { data: followerCount } = await supabase
      .rpc('get_follower_count', { user_id: userId });

    // Get following count
    const { data: followingCount } = await supabase
      .rpc('get_following_count', { user_id: userId });

    // Check if current user follows this user
    const { data: isFollowing } = await supabase
      .rpc('is_following', {
        follower: currentUserId,
        following: userId,
      });

    // Check if this user follows current user
    const { data: followsBack } = await supabase
      .rpc('is_following', {
        follower: userId,
        following: currentUserId,
      });

    res.json({
      success: true,
      data: {
        userId,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        isFollowing: isFollowing || false,
        followsBack: followsBack || false,
      },
    });
  } catch (error) {
    console.error('Error getting follow stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get follow stats',
      error: error.message,
    });
  }
});

export default router;
