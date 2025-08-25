const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/supabaseAuth');
const SupabaseUser = require('../models/SupabaseUser');
const SupabaseTrip = require('../models/SupabaseTrip');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Memory storage for Cloudinary uploads
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

      // Update user avatar in database
      const user = await SupabaseUser.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'wandersphere/avatars',
            public_id: `avatar_${req.user.id}_${Date.now()}`,
            transformation: [
              { width: 300, height: 300, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      const avatarUrl = uploadResult.secure_url;

      // Update user with new avatar URL
      await SupabaseUser.updateById(req.user.id, { avatar: avatarUrl });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: avatarUrl,
          cloudinary_id: uploadResult.public_id
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

      // Upload all images to Cloudinary
      const uploadPromises = req.files.map((file, index) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'wandersphere/trips',
              public_id: `trip_${req.user.id}_${Date.now()}_${index}`,
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Generate response data
      const uploadedImages = uploadResults.map((result, index) => ({
        filename: result.public_id,
        originalName: req.files[index].originalname,
        url: result.secure_url,
        size: req.files[index].size,
        cloudinary_id: result.public_id
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

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'wandersphere/temp',
            public_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transformation: req.file.mimetype.startsWith('image/') ? [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' }
            ] : undefined
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: uploadResult.public_id,
          originalName: req.file.originalname,
          url: uploadResult.secure_url,
          size: req.file.size,
          cloudinary_id: uploadResult.public_id
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
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    }
  });
});

// @route   DELETE /api/media/trip-image/:cloudinary_id
// @desc    Delete trip image from Cloudinary
// @access  Private
router.delete('/trip-image/:cloudinary_id', auth, async (req, res) => {
  try {
    const cloudinaryId = req.params.cloudinary_id;

    // Check if user owns any trip that uses this image
    const trip = await SupabaseTrip.findByOrganizerAndCloudinaryId(req.user.id, cloudinaryId);

    if (!trip) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this image or image not found'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(cloudinaryId);

    // Remove image from trip
    await SupabaseTrip.removeImageByCloudinaryId(trip.id, cloudinaryId);

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

// @route   DELETE /api/media/temp/:cloudinary_id
// @desc    Delete temporary file from Cloudinary
// @access  Private
router.delete('/temp/:cloudinary_id', auth, async (req, res) => {
  try {
    const cloudinaryId = req.params.cloudinary_id;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(cloudinaryId);

    if (result.result === 'not found') {
      return res.status(404).json({
        success: false,
        message: 'File not found'
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
// @desc    Cleanup old temporary files from Cloudinary
// @access  Private (Admin only)
router.post('/cleanup-temp', auth, async (req, res) => {
  try {
    // Only allow admin users (you can implement role-based auth)
    // For now, any authenticated user can trigger cleanup
    
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffDate = new Date(Date.now() - maxAge);
    
    // Get list of resources in temp folder older than 24 hours
    const result = await cloudinary.search
      .expression('folder:wandersphere/temp AND created_at<' + cutoffDate.toISOString())
      .sort_by([['created_at', 'desc']])
      .max_results(500)
      .execute();
    
    if (result.resources.length === 0) {
      return res.json({
        success: true,
        message: 'No old temporary files found to cleanup.'
      });
    }
    
    // Delete old files
    const publicIds = result.resources.map(resource => resource.public_id);
    const deleteResult = await cloudinary.api.delete_resources(publicIds);
    
    const deletedCount = Object.keys(deleteResult.deleted).length;

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} old temporary files deleted.`
    });
  } catch (error) {
    console.error('Cleanup temp files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up temporary files'
    });
  }
});

// @route   GET /api/media/info/:type/:cloudinary_id
// @desc    Get file information from Cloudinary
// @access  Public
router.get('/info/:type/:cloudinary_id', async (req, res) => {
  try {
    const { type, cloudinary_id } = req.params;
    
    if (!['avatars', 'trips', 'temp'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }
    
    // Get resource info from Cloudinary
    const result = await cloudinary.api.resource(cloudinary_id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        public_id: result.public_id,
        type,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        created: result.created_at,
        url: result.secure_url,
        version: result.version
      }
    });
  } catch (error) {
    if (error.http_code === 404) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting file information'
    });
  }
});

module.exports = router;