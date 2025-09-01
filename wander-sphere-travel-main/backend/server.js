import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';

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

// CORS configuration
app.use(cors({
  origin: [
    config.FRONTEND_URL,
    'https://wander-sphere-zpml.vercel.app',
    'https://wander-sphere-travel-main.vercel.app',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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