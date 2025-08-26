import express from 'express';
import multer from 'multer';
import supabase from '../config/supabase.js';
import { auth } from '../middleware/supabaseAuth.js';
import SupabaseUser from '../models/SupabaseUser.js';
import SupabaseTrip from '../models/SupabaseTrip.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to validate file types
const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

// File filter function
const fileFilter = (req, file, cb) => {
  if (isValidImageType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Memory storage for file uploads
const memoryStorage = multer.memoryStorage();

// Multer configurations
const uploadAvatar = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

const uploadTripImages = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter
});

const uploadTemp = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});



// @route   POST /api/media/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, (req, res) => {
  uploadAvatar.single('avatar')(req, res, async (err) => {
    try {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 5MB'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `avatars/${req.user.id}/${uuidv4()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to storage'
        });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Update user avatar in database
      const user = await SupabaseUser.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user with new avatar URL
      await SupabaseUser.updateById(req.user.id, { avatar: publicUrl });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: publicUrl,
          storage_path: fileName
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading avatar'
      });
    }
  });
});

// @route   POST /api/media/trip-images
// @desc    Upload trip images
// @access  Private
router.post('/trip-images', auth, (req, res) => {
  uploadTripImages.array('images', 10)(req, res, async (err) => {
    try {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 10MB per file'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Too many files. Maximum 10 files allowed'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading files'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Upload all images to Supabase Storage
      const uploadPromises = req.files.map(async (file, index) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `trips/${req.user.id}/${uuidv4()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        return {
          path: fileName,
          publicUrl,
          originalName: file.originalname
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Generate response data
      const uploadedImages = uploadResults.map((result, index) => ({
        filename: result.path.split('/').pop(),
        originalName: result.originalName,
        url: result.publicUrl,
        size: req.files[index].size,
        storage_path: result.path
      }));

      res.json({
        success: true,
        message: `${req.files.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages
        }
      });
    } catch (error) {
      console.error('Upload trip images error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading images'
      });
    }
  });
});

// @route   POST /api/media/temp
// @desc    Upload temporary file
// @access  Private
router.post('/temp', auth, (req, res) => {
  uploadTemp.single('file')(req, res, async (err) => {
    try {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 10MB'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `temp/${uuidv4()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to storage'
        });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: fileName.split('/').pop(),
          originalName: req.file.originalname,
          url: publicUrl,
          size: req.file.size,
          storage_path: fileName
        }
      });
    } catch (error) {
      console.error('Upload temp file error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading file'
      });
    }
  });
});

// @route   GET /api/media/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Media service is running',
    storage: {
      provider: 'supabase',
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  });
});

// @route   DELETE /api/media/trip-image/:storage_path
// @desc    Delete trip image from Supabase Storage
// @access  Private
router.delete('/trip-image/*', auth, async (req, res) => {
  try {
    const storagePath = req.params[0]; // Get the full path after /trip-image/

    // Check if user owns any trip that uses this image
    const trip = await SupabaseTrip.findByOrganizerAndStoragePath(req.user.id, storagePath);

    if (!trip) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this image or image not found'
      });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([storagePath]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file from storage'
      });
    }

    // Remove image from trip
    await SupabaseTrip.removeImageByStoragePath(trip.id, storagePath);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image'
    });
  }
});

// @route   DELETE /api/media/temp/:storage_path
// @desc    Delete temporary file from Supabase Storage
// @access  Private
router.delete('/temp/*', auth, async (req, res) => {
  try {
    const storagePath = `temp/${req.params[0]}`; // Get the filename and prepend temp/

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([storagePath]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return res.status(404).json({
        success: false,
        message: 'File not found or failed to delete'
      });
    }

    res.json({
      success: true,
      message: 'Temporary file deleted successfully'
    });
  } catch (error) {
    console.error('Delete temp file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
});

// @route   POST /api/media/cleanup-temp
// @desc    Cleanup old temporary files from Supabase Storage
// @access  Private (Admin only)
router.post('/cleanup-temp', auth, async (req, res) => {
  try {
    // Only allow admin users (you can implement role-based auth)
    // For now, any authenticated user can trigger cleanup
    
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffDate = new Date(Date.now() - maxAge);
    
    // List files in temp folder
    const { data: files, error: listError } = await supabase.storage
      .from('media')
      .list('temp', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      console.error('Error listing temp files:', listError);
      return res.status(500).json({
        success: false,
        message: 'Failed to list temporary files'
      });
    }
    
    // Filter files older than 24 hours
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at);
      return fileDate < cutoffDate;
    });
    
    if (oldFiles.length === 0) {
      return res.json({
        success: true,
        message: 'No old temporary files found to cleanup.'
      });
    }
    
    // Delete old files
    const filePaths = oldFiles.map(file => `temp/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove(filePaths);
    
    if (deleteError) {
      console.error('Error deleting temp files:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete some temporary files'
      });
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${oldFiles.length} old temporary files deleted.`
    });
  } catch (error) {
    console.error('Cleanup temp files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up temporary files'
    });
  }
});

// @route   GET /api/media/info/:type/*
// @desc    Get file information from Supabase Storage
// @access  Public
router.get('/info/:type/*', async (req, res) => {
  try {
    const { type } = req.params;
    const fileName = req.params[0]; // Get the filename after /info/:type/
    
    if (!['avatars', 'trips', 'temp'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }
    
    const storagePath = `${type}/${fileName}`;
    
    // Get file info from Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from('media')
      .list(type, {
        search: fileName
      });
    
    if (listError || !files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const fileInfo = files.find(file => file.name === fileName);
    
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(storagePath);
    
    res.json({
      success: true,
      data: {
        storage_path: storagePath,
        type,
        size: fileInfo.metadata?.size || 0,
        created: fileInfo.created_at,
        updated: fileInfo.updated_at,
        url: publicUrl,
        name: fileInfo.name
      }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting file information'
    });
  }
});

export default router;