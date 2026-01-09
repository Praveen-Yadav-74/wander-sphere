/**
 * Media Upload - Usage Examples
 * 
 * This file demonstrates various ways to use the Bunny.net media upload service
 */

import { uploadImage, uploadToBunny, compressImage, deleteFromBunny } from '@/services/mediaUpload';

// ====================================
// EXAMPLE 1: Simple Image Upload
// ====================================

export const simpleImageUpload = async (file: File) => {
  try {
    const result = await uploadImage(file);
    
    if (result.success) {
      console.log('Image uploaded successfully!');
      console.log('Public URL:', result.url);
      return result.url;
    } else {
      console.error('Upload failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// ====================================
// EXAMPLE 2: Upload with Custom Options
// ====================================

export const customImageUpload = async (file: File) => {
  const result = await uploadImage(file, {
    // Organize files in specific folder
    folder: 'profile-pictures',
    
    // Custom compression settings
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    
    // Custom filename (optional)
    customFileName: `user-${Date.now()}.jpg`,
    
    // Track upload progress
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
      // Update UI progress bar here
    },
  });

  return result;
};

// ====================================
// EXAMPLE 3: Upload with Progress Bar
// ====================================

export const uploadWithProgress = async (
  file: File,
  setProgress: (progress: number) => void,
  setError: (error: string) => void
) => {
  try {
    setProgress(0);
    
    const result = await uploadImage(file, {
      folder: 'trip-photos',
      onProgress: (progress) => {
        setProgress(progress);
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    setError(errorMessage);
    throw error;
  }
};

// ====================================
// EXAMPLE 4: Multiple Images Upload
// ====================================

export const uploadMultipleImages = async (files: File[]) => {
  const uploadPromises = files.map(file => 
    uploadImage(file, {
      folder: 'gallery',
      maxWidth: 1920,
      quality: 0.8,
    })
  );

  const results = await Promise.all(uploadPromises);
  
  // Filter successful uploads
  const successfulUploads = results
    .filter(result => result.success && result.url)
    .map(result => result.url!);

  // Get failed uploads
  const failedUploads = results
    .filter(result => !result.success)
    .map(result => result.error);

  return {
    successful: successfulUploads,
    failed: failedUploads,
  };
};

// ====================================
// EXAMPLE 5: Avatar Upload (Small Size)
// ====================================

export const uploadAvatar = async (file: File) => {
  const result = await uploadImage(file, {
    folder: 'avatars',
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.9,
  });

  if (!result.success) {
    throw new Error(result.error || 'Avatar upload failed');
  }

  return result.url;
};

// ====================================
// EXAMPLE 6: Compress Only (No Upload)
// ====================================

export const compressImageOnly = async (file: File) => {
  try {
    const compressedBlob = await compressImage(file, {
      maxWidth: 1920,
      quality: 0.8,
    });

    console.log('Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compressed size:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');
    
    return compressedBlob;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};

// ====================================
// EXAMPLE 7: Upload Raw File (No Compression)
// ====================================

export const uploadRawFile = async (file: File | Blob) => {
  const result = await uploadToBunny(file, {
    folder: 'documents',
    onProgress: (progress) => {
      console.log(`Upload: ${progress}%`);
    },
  });

  return result;
};

// ====================================
// EXAMPLE 8: Delete Uploaded File
// ====================================

export const deleteUploadedImage = async (imageUrl: string) => {
  try {
    const success = await deleteFromBunny(imageUrl);
    
    if (success) {
      console.log('File deleted successfully');
      return true;
    } else {
      console.error('Failed to delete file');
      return false;
    }
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// ====================================
// EXAMPLE 9: React Component Hook
// ====================================

import { useState } from 'react';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const upload = async (file: File, folder: string = 'uploads') => {
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const result = await uploadImage(file, {
        folder,
        onProgress: setProgress,
      });

      if (result.success && result.url) {
        setUploadedUrl(result.url);
        return result.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError('');
    setUploadedUrl('');
  };

  return {
    upload,
    uploading,
    progress,
    error,
    uploadedUrl,
    reset,
  };
};

// ====================================
// EXAMPLE 10: Integration with Supabase
// ====================================

import { storyService } from '@/services/supabaseService';
import type { InsertStory } from '@/types/database';

export const createStoryWithImage = async (
  imageFile: File,
  storyData: Omit<InsertStory, 'featured_image' | 'images'>
) => {
  try {
    // Step 1: Upload image to Bunny.net
    console.log('Uploading image to Bunny.net...');
    const uploadResult = await uploadImage(imageFile, {
      folder: 'stories',
      maxWidth: 1920,
      quality: 0.8,
    });

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || 'Image upload failed');
    }

    console.log('Image uploaded:', uploadResult.url);

    // Step 2: Create story in Supabase with the image URL
    console.log('Creating story in database...');
    const completeStoryData: InsertStory = {
      ...storyData,
      featured_image: uploadResult.url,
      images: [uploadResult.url],
    };

    const newStory = await storyService.createStory(completeStoryData);
    
    console.log('Story created successfully:', newStory.id);
    return newStory;
  } catch (error) {
    console.error('Failed to create story with image:', error);
    throw error;
  }
};

// ====================================
// EXAMPLE 11: Batch Upload with Error Handling
// ====================================

export const batchUploadWithRetry = async (
  files: File[],
  maxRetries: number = 3
) => {
  const results = [];

  for (const file of files) {
    let retries = 0;
    let success = false;
    let result;

    while (retries < maxRetries && !success) {
      try {
        result = await uploadImage(file, {
          folder: 'batch-uploads',
        });

        if (result.success) {
          success = true;
        } else {
          retries++;
          console.log(`Retry ${retries} for ${file.name}`);
        }
      } catch (error) {
        retries++;
        console.error(`Error uploading ${file.name}, retry ${retries}`, error);
      }
    }

    results.push({
      fileName: file.name,
      success,
      url: result?.url,
      error: result?.error,
    });
  }

  return results;
};

// ====================================
// EXAMPLE 12: Image Upload with Validation
// ====================================

import { validateImageFile } from '@/services/mediaUpload';

export const uploadWithValidation = async (file: File) => {
  // Validate before uploading
  const validation = validateImageFile(file);
  
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // Proceed with upload
  const result = await uploadImage(file, {
    folder: 'validated-uploads',
  });

  return result;
};
