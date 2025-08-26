import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/supabaseAuth.js';
import userRoutes from './routes/users.js';
import tripRoutes from './routes/trips.js';
import clubRoutes from './routes/clubs.js';
import journeyRoutes from './routes/journeys.js';
import notificationRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import mediaRoutes from './routes/media.js';
import mapRoutes from './routes/maps.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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
      search: '/api/search',
      media: '/api/media',
      map: '/api/map',
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
app.use('/api/search', searchRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/map', mapRoutes);

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
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;