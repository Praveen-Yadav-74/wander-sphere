const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/supabaseAuth');
const SupabaseUser = require('../models/SupabaseUser');
const SupabaseTrip = require('../models/SupabaseTrip');

const router = express.Router();

// Ensure upload directories exist
const uploadDirs = {
  avatars: path.join(__dirname, '../uploads/avatars'),
  trips: path.join(__dirname, '../uploads/trips'),
  temp: path.join(__dirname, '../uploads/temp')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
  }
};

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.avatars);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for trip images
const tripStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.trips);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for temporary uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.temp);
  },
  filename: (req, file, cb) => {
    const uniqueName = `temp_${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer configurations
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

const uploadTripImages = multer({
  storage: tripStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter
});

const uploadTemp = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper function to get file URL
const getFileUrl = (filename, type = 'trips') => {
  if (!filename) return null;
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/media/${type}/${filename}`;
};

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
        // Delete uploaded file if user not found
        deleteFile(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old avatar file if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(uploadDirs.avatars, path.basename(user.avatar));
        deleteFile(oldAvatarPath);
      }

      // Update user with new avatar URL
      const avatarUrl = getFileUrl(req.file.filename, 'avatars');
      await SupabaseUser.updateById(req.user.id, { avatar: avatarUrl });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: avatarUrl,
          filename: req.file.filename
        }
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        deleteFile(req.file.path);
      }
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

      // Generate URLs for uploaded files
      const uploadedImages = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: getFileUrl(file.filename, 'trips'),
        size: file.size
      }));

      res.json({
        success: true,
        message: `${req.files.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages
        }
      });
    } catch (error) {
      // Delete uploaded files on error
      if (req.files) {
        req.files.forEach(file => deleteFile(file.path));
      }
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

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: getFileUrl(req.file.filename, 'temp'),
          size: req.file.size
        }
      });
    } catch (error) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      console.error('Upload temp file error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading file'
      });
    }
  });
});

// @route   GET /api/media/avatars/:filename
// @desc    Serve avatar files
// @access  Public
router.get('/avatars/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDirs.avatars, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while serving file'
    });
  }
});

// @route   GET /api/media/trips/:filename
// @desc    Serve trip image files
// @access  Public
router.get('/trips/:filename', (req, res) => {
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

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve trip image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while serving file'
    });
  }
});

// @route   GET /api/media/temp/:filename
// @desc    Serve temporary files
// @access  Private
router.get('/temp/:filename', auth, (req, res) => {
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

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve temp file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while serving file'
    });
  }
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