import supabase from '../config/supabase.js';
import authService from '../services/authService.js';

// Middleware to authenticate requests using Supabase
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }

    // Get full user data from our users table
    const userData = await authService.getUserById(user.id);
    
    if (!userData || !userData.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is inactive.' 
      });
    }

    // Add user data to request object
    req.user = userData;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token verification failed.' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user data
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      const userData = await authService.getUserById(user.id);
      
      if (userData && userData.is_active) {
        req.user = userData;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user data if token verification fails
    next();
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run the regular auth middleware
    await auth(req, res, () => {});
    
    // Check if user has admin role (you can customize this logic)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed.' 
    });
  }
};

export { auth, optionalAuth, adminAuth };