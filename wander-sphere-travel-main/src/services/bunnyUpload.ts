/**
 * Bunny.net Upload Service - Perfect Structure
 * 
 * This service handles media uploads to Bunny.net with:
 * - Dynamic folder organization (stories, posts/images, posts/videos)
 * - Dual return values (public URL + storage path for deletion)
 * - Image compression for bandwidth optimization
 * - Type-safe TypeScript implementation
 */

import axios from 'axios';
import Compressor from 'compressorjs';

// =============================================
// TYPES & INTERFACES
// =============================================

export type MediaType = 'story' | 'post_image' | 'post_video' | 'avatar';

export interface BunnyUploadConfig {
  storageName: string;
  accessKey: string;
  hostname: string;
  pullZoneUrl: string;
}

export interface BunnyUploadResult {
  success: boolean;
  publicUrl?: string;      // For displaying the media
  storagePath?: string;    // For deleting the file later (e.g., "stories/12345_abc.jpg")
  error?: string;
}

export interface UploadOptions {
  compress?: boolean;        // Default: true for images
  quality?: number;          // Default: 0.8
  maxWidth?: number;         // Default: 1920
  onProgress?: (progress: number) => void;
}

// =============================================
// CONFIGURATION
// =============================================

/**
 * Get Bunny.net configuration from environment variables
 */
const getBunnyConfig = (): BunnyUploadConfig => {
  // CRITICAL FIX: Force correct CDN URL to prevent "-media" errors
  const CDN_URL = "https://nomad-app.b-cdn.net";

  const config: BunnyUploadConfig = {
    storageName: import.meta.env.VITE_BUNNY_STORAGE_NAME || 'nomad-app',
    accessKey: import.meta.env.VITE_BUNNY_API_KEY || '',
    hostname: import.meta.env.VITE_BUNNY_HOSTNAME || 'storage.bunnycdn.com',
    pullZoneUrl: CDN_URL, // FORCED override of env var
  };

  // Validate configuration
  if (!config.accessKey) {
    console.warn('Bunny.net Access Key is missing in .env');
  }

  return config;
};

/**
 * Get the folder path based on media type
 */
const getFolderPath = (type: MediaType): string => {
  switch (type) {
    case 'story':
      return 'stories';
    case 'post_image':
      return 'posts/images';
    case 'post_video':
      return 'posts/videos';
    case 'avatar':
      return 'avatars';
    default:
      throw new Error(`Invalid media type: ${type}`);
  }
};

/**
 * Generate a unique filename with timestamp and random string
 */
const generateUniqueFileName = (originalFileName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFileName.split('.').pop() || 'jpg';
  return `${timestamp}_${randomString}.${extension}`;
};

// =============================================
// COMPRESSION UTILITIES
// =============================================

/**
 * Compress an image file to reduce bandwidth costs
 * Only used for images (not videos)
 */
const compressImage = (
  file: File,
  options: { maxWidth?: number; quality?: number } = {}
): Promise<Blob> => {
  const { maxWidth = 1920, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    new Compressor(file, {
      quality,
      maxWidth,
      maxHeight: maxWidth,
      mimeType: 'image/jpeg',
      convertSize: 5000000, // Convert to JPEG if file > 5MB
      success: (result) => {
        console.log('Image compressed:', {
          originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(result.size / 1024 / 1024).toFixed(2)}MB`,
          reduction: `${((1 - result.size / file.size) * 100).toFixed(1)}%`,
        });
        resolve(result);
      },
      error: (error) => {
        console.error('Image compression failed:', error);
        reject(error);
      },
    });
  });
};

// =============================================
// CORE UPLOAD FUNCTION
// =============================================

/**
 * Upload media to Bunny.net with proper folder organization
 * 
 * @param file - The file to upload
 * @param type - Media type: 'story', 'post_image', or 'post_video'
 * @param options - Upload options (compression, progress callback, etc.)
 * @returns Promise<BunnyUploadResult> with publicUrl and storagePath
 */
export const uploadToBunny = async (
  file: File,
  type: MediaType,
  options: UploadOptions = {}
): Promise<BunnyUploadResult> => {
  try {
    const config = getBunnyConfig();
    const {
      compress = true,
      quality = 0.8,
      maxWidth = 1920,
      onProgress,
    } = options;

    // Get folder path based on type
    const folderPath = getFolderPath(type);

    // Generate unique filename
    const fileName = generateUniqueFileName(file.name);

    // Storage path (relative to storage zone root)
    const storagePath = `${folderPath}/${fileName}`;

    // Determine if we should compress
    const isImage = file.type.startsWith('image/');
    const shouldCompress = compress && isImage;

    let fileToUpload: File | Blob = file;

    // Compress image if needed
    if (shouldCompress) {
      try {
        console.log(`Compressing ${type} image before upload...`);
        fileToUpload = await compressImage(file, { maxWidth, quality });
      } catch (compressionError) {
        console.warn('Compression failed, uploading original file:', compressionError);
        fileToUpload = file;
      }
    }

    // Construct upload URL
    // Format: https://{hostname}/{storageName}/{storagePath}
    const uploadUrl = `https://${config.hostname}/${config.storageName}/${storagePath}`;

    console.log('Uploading to Bunny.net:', {
      type,
      uploadUrl,
      storagePath,
      fileSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`,
      compressed: shouldCompress,
    });

    // Upload using PUT request
    const response = await axios.put(uploadUrl, fileToUpload, {
      headers: {
        'AccessKey': config.accessKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    // Check response
    if (response.status === 201 || response.status === 200) {
      // Construct public URL - using the FORCED config.pullZoneUrl
      const publicUrl = `${config.pullZoneUrl}/${storagePath}`;

      console.log('Upload successful:', {
        publicUrl,
        storagePath,
        status: response.status,
      });

      return {
        success: true,
        publicUrl,
        storagePath,
      };
    } else {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Bunny.net upload failed:', error);

    let errorMessage = 'Upload failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      
      // Provide helpful error messages
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please check your Bunny.net access key.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Storage zone not found. Please check your configuration.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// =============================================
// DELETE FUNCTION
// =============================================

export const deleteFromBunny = async (storagePath: string): Promise<boolean> => {
  try {
    const config = getBunnyConfig();

    // Construct delete URL
    const deleteUrl = `https://${config.hostname}/${config.storageName}/${storagePath}`;

    console.log('Deleting from Bunny.net:', {
      storagePath,
      deleteUrl,
    });

    const response = await axios.delete(deleteUrl, {
      headers: {
        'AccessKey': config.accessKey,
      },
    });

    const success = response.status === 200 || response.status === 204;
    
    if (success) {
      console.log('File deleted successfully:', storagePath);
    }

    return success;
  } catch (error) {
    console.error('Bunny.net deletion failed:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('File not found in Bunny.net storage (may already be deleted):', storagePath);
      return true; // Consider it successful if file doesn't exist
    }
    
    return false;
  }
};

// =============================================
// VALIDATION UTILITIES
// =============================================

export const validateFile = (
  file: File,
  type: MediaType
): { valid: boolean; error?: string } => {
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 100MB limit',
    };
  }

  // Check file type based on media type
  if (type === 'story' || type === 'post_image' || type === 'avatar') {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid image type. Supported: JPEG, PNG, WebP, GIF',
      };
    }
  } else if (type === 'post_video') {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validVideoTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid video type. Supported: MP4, WebM, QuickTime',
      };
    }
  }

  return { valid: true };
};

export const getMediaTypeFromFile = (file: File): MediaType | null => {
  if (file.type.startsWith('image/')) {
    return 'post_image';
  } else if (file.type.startsWith('video/')) {
    return 'post_video';
  }
  return null;
};
