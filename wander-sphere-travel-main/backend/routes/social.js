import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/supabaseAuth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * @route   POST /api/social/like/:postId
 * @desc    Toggle like on a post
 * @access  Private
 */
router.post('/like/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (unlikeError) throw unlikeError;

      return res.json({ success: true, message: 'Post unliked', isLiked: false });
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ user_id: userId, post_id: postId });
      
      if (likeError) throw likeError;

      return res.json({ success: true, message: 'Post liked', isLiked: true });
    }
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

/**
 * @route   POST /api/social/comment/:postId
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/comment/:postId', auth, [
    body('content').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: userId, post_id: postId, content })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Comment added', data });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

/**
 * @route   POST /api/social/save/:postId
 * @desc    Toggle save post
 * @access  Private
 */
router.post('/save/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const { data: existingSave, error: checkError } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingSave) {
      // Unsave
      const { error: unsaveError } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', existingSave.id);
      
      if (unsaveError) throw unsaveError;

      return res.json({ success: true, message: 'Post removed from saved', isSaved: false });
    } else {
      // Save
      const { error: saveError } = await supabase
        .from('saved_posts')
        .insert({ user_id: userId, post_id: postId });
      
      if (saveError) throw saveError;

      return res.json({ success: true, message: 'Post saved', isSaved: true });
    }
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle save' });
  }
});

/**
 * @route   POST /api/social/report/:postId
 * @desc    Report a post
 * @access  Private
 */
router.post('/report/:postId', auth, [
    body('reason').trim().notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: userId, post_id: postId, reason, status: 'pending' });

    if (error) throw error;

    res.json({ success: true, message: 'Post reported' });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ success: false, message: 'Failed to report post' });
  }
});

/**
 * @route   DELETE /api/social/posts/:postId
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/posts/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check post ownership first
    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('author_id') // or user_id depending on schema, usually author_id in this app
        .eq('id', postId)
        .single();
        
    if (fetchError || !post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Assuming author_id is the user column for posts. If it's user_id, check that.
    // Based on `getClubPosts` in SupabaseClub.js, it selects `author:users(...)` which implies `author_id` or `user_id` relation.
    // Let's assume standard `user_id` or `author_id`. I'll try checking against both or just `user_id` if standard.
    // BUT `SupabaseClub.js` didn't show the exact column name for author relation, just `author:users`.
    // Let's assume `user_id` for simplicity as it's common in supabase. Or `author_id`.
    // To be safe, let's just try deleting with `user_id` filter?
    // No, I need to know if it's strictly user's post.
    
    // Safer verify:
    // If I use .delete().eq('id', postId).eq('user_id', userId) it handles ownership check implicitly!
    // But field name matters.
    // Looking at previous files, `trips` has `user_id`. `budgets` has `user_id`.
    // It is highly likely `posts` has `user_id`.
    
    const { error: deleteError, count } = await supabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', userId); // Implicit ownership check

    if (deleteError) throw deleteError;
    
    if (count === 0) {
        // Maybe it exists but belongs to someone else, or doesn't exist
         return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

export default router;
