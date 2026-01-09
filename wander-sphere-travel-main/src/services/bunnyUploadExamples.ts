/**
 * Bunny.net Upload Service - Usage Examples
 * 
 * Practical examples for the Perfect Structure implementation
 */

import { uploadToBunny, deleteFromBunny, validateFile } from './bunnyUpload';
import { supabase } from '@/config/supabase';

// =============================================
// EXAMPLE 1: Upload Story (24-hour expiration)
// =============================================

export const uploadStoryExample = async (imageFile: File, caption: string) => {
  try {
    // Step 1: Validate file
    const validation = validateFile(imageFile, 'story');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Step 2: Upload to Bunny.net stories folder
    const uploadResult = await uploadToBunny(imageFile, 'story', {
      compress: true,
      quality: 0.8,
      maxWidth: 1920,
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Step 3: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Step 4: Calculate expires_at (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Step 5: Insert into Supabase
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        title: caption || 'My Story',
        content: caption || '',
        media_url: uploadResult.publicUrl,      // Public CDN URL
        storage_path: uploadResult.storagePath, // For cleanup (CRITICAL!)
        media_type: 'image',
        caption: caption,
        expires_at: expiresAt,
        is_public: true,
        status: 'published',
      })
      .select()
      .single();

    if (insertError) {
      // If DB insert fails, optionally delete from Bunny.net
      await deleteFromBunny(uploadResult.storagePath!);
      throw new Error(insertError.message);
    }

    console.log('Story created:', {
      id: story.id,
      publicUrl: uploadResult.publicUrl,
      expiresAt: expiresAt,
    });

    return story;
  } catch (error) {
    console.error('Story upload failed:', error);
    throw error;
  }
};

// =============================================
// EXAMPLE 2: Upload Post Image (Permanent)
// =============================================

export const uploadPostImageExample = async (
  imageFile: File,
  title: string,
  content: string,
  tags: string[]
) => {
  try {
    // Validate
    const validation = validateFile(imageFile, 'post_image');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Upload to posts/images folder
    const uploadResult = await uploadToBunny(imageFile, 'post_image', {
      compress: true,
      quality: 0.85,
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert into posts table
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: title,
        content: content,
        media_url: uploadResult.publicUrl,
        tags: tags,
        is_public: true,
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      await deleteFromBunny(uploadResult.storagePath!);
      throw new Error(error.message);
    }

    return post;
  } catch (error) {
    console.error('Post upload failed:', error);
    throw error;
  }
};

// =============================================
// EXAMPLE 3: Upload Post Video
// =============================================

export const uploadPostVideoExample = async (
  videoFile: File,
  title: string,
  content: string
) => {
  try {
    // Validate video
    const validation = validateFile(videoFile, 'post_video');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Upload to posts/videos folder (no compression for videos)
    const uploadResult = await uploadToBunny(videoFile, 'post_video', {
      compress: false, // Don't compress videos
      onProgress: (progress) => {
        console.log(`Video upload: ${progress}%`);
      },
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert into posts
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: title,
        content: content,
        media_url: uploadResult.publicUrl,
        is_public: true,
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      await deleteFromBunny(uploadResult.storagePath!);
      throw new Error(error.message);
    }

    return post;
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};

// =============================================
// EXAMPLE 4: Multiple Images Upload
// =============================================

export const uploadMultipleImagesExample = async (files: File[]) => {
  const results = [];

  for (const file of files) {
    try {
      const result = await uploadToBunny(file, 'post_image', {
        compress: true,
      });

      if (result.success) {
        results.push({
          success: true,
          publicUrl: result.publicUrl,
          storagePath: result.storagePath,
        });
      } else {
        results.push({
          success: false,
          error: result.error,
          fileName: file.name,
        });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
      });
    }
  }

  return results;
};

// =============================================
// EXAMPLE 5: Update Story with New Media
// =============================================

export const updateStoryMediaExample = async (
  storyId: string,
  newImageFile: File
) => {
  try {
    // Get existing story
    const { data: existingStory, error: fetchError } = await supabase
      .from('stories')
      .select('storage_path, user_id')
      .eq('id', storyId)
      .single();

    if (fetchError || !existingStory) {
      throw new Error('Story not found');
    }

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== existingStory.user_id) {
      throw new Error('Not authorized');
    }

    // Upload new image
    const uploadResult = await uploadToBunny(newImageFile, 'story', {
      compress: true,
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Update database
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        media_url: uploadResult.publicUrl,
        storage_path: uploadResult.storagePath,
      })
      .eq('id', storyId);

    if (updateError) {
      // Rollback: delete new upload
      await deleteFromBunny(uploadResult.storagePath!);
      throw new Error(updateError.message);
    }

    // Delete old media from Bunny.net
    if (existingStory.storage_path) {
      await deleteFromBunny(existingStory.storage_path);
    }

    return true;
  } catch (error) {
    console.error('Story update failed:', error);
    throw error;
  }
};

// =============================================
// EXAMPLE 6: Delete Story (Manual Cleanup)
// =============================================

export const deleteStoryExample = async (storyId: string) => {
  try {
    // Get story details
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('storage_path, user_id')
      .eq('id', storyId)
      .single();

    if (fetchError || !story) {
      throw new Error('Story not found');
    }

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== story.user_id) {
      throw new Error('Not authorized');
    }

    // Delete from Bunny.net
    if (story.storage_path) {
      const deleted = await deleteFromBunny(story.storage_path);
      if (!deleted) {
        console.warn('Failed to delete from Bunny.net, continuing with DB deletion');
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    console.log('Story deleted successfully');
    return true;
  } catch (error) {
    console.error('Story deletion failed:', error);
    throw error;
  }
};

// =============================================
// EXAMPLE 7: React Hook for Upload
// =============================================

import { useState } from 'react';

export const useBunnyUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const upload = async (
    file: File,
    type: 'story' | 'post_image' | 'post_video'
  ) => {
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const result = await uploadToBunny(file, type, {
        compress: type !== 'post_video',
        onProgress: setProgress,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError('');
  };

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
};

// =============================================
// EXAMPLE 8: Batch Upload with Rollback
// =============================================

export const batchUploadWithRollback = async (
  files: File[],
  type: 'post_image' | 'post_video'
) => {
  const uploadedPaths: string[] = [];
  const publicUrls: string[] = [];

  try {
    // Upload all files
    for (const file of files) {
      const result = await uploadToBunny(file, type, { compress: true });

      if (!result.success) {
        throw new Error(`Failed to upload ${file.name}: ${result.error}`);
      }

      uploadedPaths.push(result.storagePath!);
      publicUrls.push(result.publicUrl!);
    }

    // If all uploads succeed, return URLs
    return {
      success: true,
      urls: publicUrls,
      paths: uploadedPaths,
    };
  } catch (error) {
    // Rollback: Delete all uploaded files
    console.error('Batch upload failed, rolling back...');
    
    for (const path of uploadedPaths) {
      await deleteFromBunny(path);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch upload failed',
    };
  }
};

// =============================================
// EXAMPLE 9: Check Expired Stories
// =============================================

export const getExpiredStoriesExample = async () => {
  const { data, error } = await supabase
    .from('stories')
    .select('id, storage_path, expires_at')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to fetch expired stories:', error);
    return [];
  }

  return data;
};

// =============================================
// EXAMPLE 10: Manual Cleanup Trigger
// =============================================

export const triggerCleanupExample = async () => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'delete-expired-stories',
      {
        method: 'POST',
      }
    );

    if (error) {
      throw error;
    }

    console.log('Cleanup result:', data);
    return data;
  } catch (error) {
    console.error('Cleanup trigger failed:', error);
    throw error;
  }
};
