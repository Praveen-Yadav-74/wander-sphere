/**
 * CreatePost Component
 * 
 * Handles post creation with:
 * - Image upload to Bunny.net (posts/images folder)
 * - Database insertion to Supabase posts table
 * - Type-safe implementation
 */

import React, { useState } from 'react';
import { uploadToBunny, validateFile } from '@/services/bunnyUpload';
import { supabase } from '@/config/supabase';

interface CreatePostProps {
  tripId?: string; // Optional: If creating a story for a specific trip
  onSuccess?: (storyId: string) => void;
  onCancel?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  tripId,
  onSuccess,
  onCancel,
}) => {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Upload state
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

    // Reset states
    setError('');
    setSuccessMessage('');

    // Validate file
    const validation = validateFile(file, 'post_image');
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
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Reset messages
    setError('');
    setSuccessMessage('');

    // Validation
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!content.trim()) {
      setError('Please enter content');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting post creation workflow...');

      // Step 1: Upload image to Bunny.net (posts/images folder)
      console.log('Step 1: Uploading to Bunny.net posts/images folder...');
      const uploadResult = await uploadToBunny(selectedFile, 'post_image', {
        compress: true,
        maxWidth: 1920,
        quality: 0.8,
        onProgress: (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
      });

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('Image uploaded successfully:', {
        publicUrl: uploadResult.publicUrl,
        storagePath: uploadResult.storagePath,
      });
      setUploadProgress(100);

      // Step 2: Insert into Supabase posts table
      console.log('Step 2: Inserting post into database...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to create a post');
      }
      
      // Insert into posts table (assuming it exists)
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          media_url: uploadResult.publicUrl,
          tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          is_public: isPublic,
          status: 'published',
          trip_id: tripId || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      console.log('Post created successfully:', newPost.id);
      setSuccessMessage('Post created successfully!');

      // Clear form
      setTimeout(() => {
        setTitle('');
        setContent('');
        setTags('');
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadProgress(0);
        
        // Callback
        if (onSuccess) {
          onSuccess(newPost.id);
        }
      }, 1500);

    } catch (err) {
      console.error('Post creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Post</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image *
          </label>
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload image
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP, GIF (Max 50MB)
                </span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            disabled={isUploading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            maxLength={200}
          />
        </div>

        {/* Content Textarea */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your story..."
            disabled={isUploading}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Tags Input */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="travel, adventure, photography"
            disabled={isUploading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isUploading}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
            Make this post public
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Creating Post...' : 'Create Post'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
