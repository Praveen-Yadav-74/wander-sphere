/**
 * Media Upload Service for Bunny.net CDN Integration
 * 
 * This service handles:
 * - Image compression before upload
 * - File upload to Bunny.net storage
 * - Error handling and validation
 */

import axios, { AxiosProgressEvent } from 'axios';
import Compressor from 'compressorjs';
import type {
  BunnyConfig,
  CompressionOptions,
  UploadOptions,
  UploadResult,
} from '../types/media';

/**
 * Get Bunny.net configuration from environment variables
 */
const getBunnyConfig = (): BunnyConfig => {
  const config: BunnyConfig = {
    storageName: import.meta.env.VITE_BUNNY_STORAGE_NAME || '',
    apiKey: import.meta.env.VITE_BUNNY_API_KEY || '',
    pullZoneUrl: import.meta.env.VITE_BUNNY_PULL_ZONE_URL || '',
    region: import.meta.env.VITE_BUNNY_REGION || '',
  };

  // Validate configuration
  if (!config.storageName || !config.apiKey || !config.pullZoneUrl) {
    throw new Error('Bunny.net configuration is incomplete. Please check your environment variables.');
  }

  return config;
};

/**
 * Compress an image file to reduce bandwidth costs
 * 
 * @param file - The original image file
 * @param options - Compression options (maxWidth, quality, etc.)
 * @returns Promise<Blob> - The compressed image blob
 */
export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    new Compressor(file, {
      quality,
      maxWidth,
      maxHeight,
      mimeType,
      convertSize: 5000000, // Convert to JPEG if file > 5MB
      success: (result) => {
        console.log('Image compressed successfully:', {
          originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(result.size / 1024 / 1024).toFixed(2)}MB`,
          compressionRatio: `${((1 - result.size / file.size) * 100).toFixed(2)}%`,
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

/**
 * Generate a unique filename with timestamp and random string
 * 
 * @param originalFileName - The original file name
 * @returns string - Unique filename
 */
const generateUniqueFileName = (originalFileName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFileName.split('.').pop() || 'jpg';
  return `${timestamp}_${randomString}.${extension}`;
};

/**
 * Upload a file to Bunny.net storage
 * 
 * @param file - The file or blob to upload
 * @param options - Upload options (folder, custom filename, progress callback)
 * @returns Promise<UploadResult> - Upload result with public URL
 */
export const uploadToBunny = async (
  file: File | Blob,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    const config = getBunnyConfig();
    const { folder = 'uploads', customFileName, onProgress } = options;

    // Generate filename
    const fileName = customFileName || generateUniqueFileName(
      file instanceof File ? file.name : 'upload.jpg'
    );

    // Construct the storage API endpoint
    // Format: https://{Region}.storage.bunnycdn.com/{StorageName}/{Folder}/{FileName}
    const regionPrefix = config.region ? `${config.region}.` : '';
    const uploadUrl = `https://${regionPrefix}storage.bunnycdn.com/${config.storageName}/${folder}/${fileName}`;

    console.log('Uploading to Bunny.net:', {
      url: uploadUrl,
      fileName,
      folder,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    // Upload the file using PUT request
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'AccessKey': config.apiKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    if (response.status === 201 || response.status === 200) {
      // Construct the public CDN URL
      const publicUrl = `${config.pullZoneUrl}/${folder}/${fileName}`;

      console.log('Upload successful:', {
        publicUrl,
        status: response.status,
      });

      return {
        success: true,
        url: publicUrl,
        fileName,
      };
    } else {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Upload to Bunny.net failed:', error);

    let errorMessage = 'Upload failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Complete upload workflow: Compress and upload an image
 * 
 * @param file - The original image file
 * @param options - Upload and compression options
 * @returns Promise<UploadResult> - Upload result with public URL
 */
export const uploadImage = async (
  file: File,
  options: UploadOptions & CompressionOptions = {}
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Only image files are supported',
      };
    }

    // Validate file size (max 50MB before compression)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 50MB limit',
      };
    }

    console.log('Starting image upload workflow:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
    });

    // Step 1: Compress the image
    const compressedBlob = await compressImage(file, options);

    // Step 2: Upload to Bunny.net
    const uploadResult = await uploadToBunny(compressedBlob, options);

    return uploadResult;
  } catch (error) {
    console.error('Image upload workflow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Delete a file from Bunny.net storage
 * 
 * @param fileUrl - The public URL of the file to delete
 * @returns Promise<boolean> - Whether deletion was successful
 */
export const deleteFromBunny = async (fileUrl: string): Promise<boolean> => {
  try {
    const config = getBunnyConfig();

    // Extract folder and filename from the URL
    const urlParts = fileUrl.replace(config.pullZoneUrl + '/', '').split('/');
    const fileName = urlParts.pop();
    const folder = urlParts.join('/');

    if (!fileName) {
      throw new Error('Invalid file URL');
    }

    // Construct the delete endpoint
    const regionPrefix = config.region ? `${config.region}.` : '';
    const deleteUrl = `https://${regionPrefix}storage.bunnycdn.com/${config.storageName}/${folder}/${fileName}`;

    console.log('Deleting from Bunny.net:', deleteUrl);

    const response = await axios.delete(deleteUrl, {
      headers: {
        'AccessKey': config.apiKey,
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error('Delete from Bunny.net failed:', error);
    return false;
  }
};

/**
 * Validate image file before upload
 * 
 * @param file - The file to validate
 * @returns Object with validation result
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Supported: JPEG, PNG, WebP, GIF',
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 50MB limit',
    };
  }

  return { valid: true };
};
