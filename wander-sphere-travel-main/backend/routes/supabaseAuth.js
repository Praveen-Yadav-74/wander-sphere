import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';
import { auth } from '../middleware/supabaseAuth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Register user with Supabase
    const result = await authService.register({
      firstName,
      lastName,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: result.user.id,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          email: result.user.email,
          isEmailVerified: result.user.is_email_verified
        },
        session: result.session
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Supabase errors
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Login user with Supabase
    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          email: result.user.email,
          avatar: result.user.avatar,
          bio: result.user.bio,
          location: result.user.location,
          preferences: result.user.preferences,
          stats: result.user.stats,
          isEmailVerified: result.user.is_email_verified
        },
        session: result.session
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific authentication errors
    if (error.message.includes('Invalid login credentials')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Refresh session with Supabase
    const result = await authService.refreshSession(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        session: result.session
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    await authService.logout();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          email: req.user.email,
          avatar: req.user.avatar,
          bio: req.user.bio,
          location: req.user.location,
          dateOfBirth: req.user.date_of_birth,
          phone: req.user.phone,
          preferences: req.user.preferences,
          stats: req.user.stats,
          isEmailVerified: req.user.is_email_verified,
          lastLogin: req.user.last_login,
          createdAt: req.user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'bio', 'location', 'dateOfBirth', 'phone', 'avatar'];
    const updates = {};
    
    // Map frontend field names to database field names
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth'
    };

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        const dbField = fieldMapping[key] || key;
        updates[dbField] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update user profile
    const updatedUser = await authService.updateProfile(req.userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          location: updatedUser.location,
          dateOfBirth: updatedUser.date_of_birth,
          phone: updatedUser.phone,
          preferences: updatedUser.preferences,
          stats: updatedUser.stats
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    await authService.sendPasswordReset(email);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send password reset email'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    await authService.updatePassword(password);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Password update failed'
    });
  }
});

export default router;