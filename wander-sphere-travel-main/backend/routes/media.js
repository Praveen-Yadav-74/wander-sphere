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

// @route   DELETE /api/media/trip-image/:filename
// @desc    Delete trip image
// @access  Private
router.delete('/trip-image/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDirs.trips, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user owns any trip that uses this image
    const imageUrl = getFileUrl(filename, 'trips');
    const trip = await SupabaseTrip.findByOrganizerAndImage(req.user.id, imageUrl);

    if (!trip) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this image'
      });
    }

    // Delete file
    deleteFile(filePath);

    // Remove image from trip
    await SupabaseTrip.removeImage(trip.id, imageUrl);

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

// @route   DELETE /api/media/temp/:filename
// @desc    Delete temporary file
// @access  Private
router.delete('/temp/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDirs.temp, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    deleteFile(filePath);

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
// @desc    Cleanup old temporary files
// @access  Private (Admin only)
router.post('/cleanup-temp', auth, (req, res) => {
  try {
    // Only allow admin users (you can implement role-based auth)
    // For now, any authenticated user can trigger cleanup
    
    const tempDir = uploadDirs.temp;
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let deletedCount = 0;
    
    files.forEach(filename => {
      const filePath = path.join(tempDir, filename);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        deleteFile(filePath);
        deletedCount++;
      }
    });

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

// @route   GET /api/media/info/:type/:filename
// @desc    Get file information
// @access  Public
router.get('/info/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    
    if (!['avatars', 'trips', 'temp'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }
    
    const filePath = path.join(uploadDirs[type], filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    res.json({
      success: true,
      data: {
        filename,
        type,
        size: stats.size,
        extension: ext,
        created: stats.birthtime,
        modified: stats.mtime,
        url: getFileUrl(filename, type)
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

module.exports = router;