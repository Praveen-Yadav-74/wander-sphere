/**
 * CreateStory Component
 * 
 * Handles story creation with:
 * - Image upload to Bunny.net (stories folder)
 * - Automatic expiration calculation (24 hours)
 * - Storage path preservation for cleanup
 */

import React, { useState } from 'react';
import { uploadToBunny, validateFile } from '@/services/bunnyUpload';
import { supabase } from '@/config/supabase';

interface CreateStoryProps {
  onSuccess?: (storyId: string) => void;
  onCancel?: () => void;
}

export const CreateStory: React.FC<CreateStoryProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMessage('');

    // Validate file
    const validation = validateFile(file, 'story');
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadProgress(0);
  };

  /**
   * Calculate expiration timestamp (Current Time + 24 hours)
   */
  const calculateExpiresAt = (): string => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    return expiresAt.toISOString();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setError('');
    setSuccessMessage('');

    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Creating story...');

      // Step 1: Upload to Bunny.net (stories folder)
      console.log('Step 1: Uploading to Bunny.net stories folder...');
      const uploadResult = await uploadToBunny(selectedFile, 'story', {
        compress: true,
        quality: 0.8,
        maxWidth: 1920,
        onProgress: (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
      });

      if (!uploadResult.success || !uploadResult.publicUrl || !uploadResult.storagePath) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('Upload successful:', {
        publicUrl: uploadResult.publicUrl,
        storagePath: uploadResult.storagePath,
      });

      setUploadProgress(100);

      // Step 2: Insert into Supabase stories table
      console.log('Step 2: Inserting story into database...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to create a story');
      }

      // Calculate expires_at (24 hours from now)
      const expiresAt = calculateExpiresAt();

      // Insert story with storage_path for cleanup
      const { data: newStory, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: caption || 'My Story',
          content: caption || '',
          media_url: uploadResult.publicUrl,
          storage_path: uploadResult.storagePath, // CRITICAL: Save for deletion
          media_type: 'image',
          caption: caption || '',
          expires_at: expiresAt,
          is_public: true,
          status: 'published',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('Story created successfully:', newStory.id);
      console.log('Expires at:', expiresAt);

      setSuccessMessage('Story created successfully! Expires in 24 hours.');

      // Clear form
      setTimeout(() => {
        setCaption('');
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadProgress(0);
        
        if (onSuccess) {
          onSuccess(newStory.id);
        }
      }, 1500);

    } catch (err) {
      console.error('Story creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Story</h2>
      <p className="text-sm text-gray-600 mb-4">
        📸 Stories expire in 24 hours
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Image *
          </label>
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="story-file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">Upload Story Image</span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {isUploading && uploadProgress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            Caption (Optional)
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            disabled={isUploading}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            maxLength={200}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Creating...' : 'Create Story'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateStory;
