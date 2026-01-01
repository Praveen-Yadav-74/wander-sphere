import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { isConnectionHealthy, performHealthCheck } from './config/supabase.js';

// Import routes
import authRoutes from './routes/supabaseAuth.js';
import userRoutes from './routes/users.js';
import tripRoutes from './routes/trips.js';
import clubRoutes from './routes/clubs.js';
import journeyRoutes from './routes/journeys.js';
import notificationRoutes from './routes/notifications.js';
import storyRoutes from './routes/stories.js';
import searchRoutes from './routes/search.js';
import mediaRoutes from './routes/media.js';
import mapRoutes from './routes/maps.js';
import budgetRoutes from './routes/budget.js';
import bookingRoutes from './routes/booking.js';
import walletRoutes from './routes/wallet.js';
import etravRoutes from './routes/etrav.js';

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // limit each IP to requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - Production and Development
const allowedOrigins = [
  config.FRONTEND_URL,
  'https://wander-sphere-zpml.vercel.app',
  'https://wander-sphere-zpml.vercel.app/', // With trailing slash
  'https://wander-sphere-travel-main.vercel.app',
  // Local development origins
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, only allow specific origins
    if (config.NODE_ENV === 'production') {
      // Check if origin is in allowed list (exact match or starts with)
      const isAllowed = allowedOrigins.some(allowed => 
        origin === allowed || origin.startsWith(allowed.replace(/\/$/, ''))
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin ${origin} in production`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow localhost and 127.0.0.1
      if (allowedOrigins.indexOf(origin) !== -1 || 
          origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin ${origin}`);
        callback(null, true); // Allow all in development for easier debugging
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Connection', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Connection keep-alive middleware
app.use((req, res, next) => {
  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  
  // Add request timestamp for monitoring
  req.requestTime = Date.now();
  
  next();
});

// Body parsing middleware - skip multipart requests (needed for multer)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next(); // Skip body parsing for multipart requests so multer can handle them
  }
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });
});

// Request logging middleware (development only)
if (config.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Supabase connection is handled in individual routes
console.log('Using Supabase as the database backend');

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WanderSphere API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      trips: '/api/trips',
      clubs: '/api/clubs',
      journeys: '/api/journeys',
      notifications: '/api/notifications',
      stories: '/api/stories',
      search: '/api/search',
      media: '/api/media',
      map: '/api/map',
      budget: '/api/budget',
      booking: '/api/booking',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint with database connection status
app.get('/health', async (req, res) => {
  const dbHealthy = isConnectionHealthy();
  
  // Perform a quick health check if connection status is unknown or unhealthy
  if (!dbHealthy) {
    const checkResult = await performHealthCheck();
    if (!checkResult) {
      return res.status(503).json({ 
        status: 'SERVICE_UNAVAILABLE', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'unhealthy'
      });
    }
  }
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'healthy'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/etrav', etravRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler with better error handling
app.use((err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Handle database connection errors
  if (err.message && (
    err.message.includes('connection') || 
    err.message.includes('timeout') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ENOTFOUND')
  )) {
    // Mark connection as unhealthy
    performHealthCheck().catch(console.error);
    
    return res.status(503).json({
      message: 'Service temporarily unavailable. Please try again later.',
      error: 'Database connection error',
      retryAfter: 5
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
});

export default app;