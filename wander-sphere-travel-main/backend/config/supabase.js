import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const supabaseUrl = config.SUPABASE_URL;
const supabaseServiceKey = config.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Missing Supabase environment variables:');
  console.warn('SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.warn('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'NOT SET');
  console.warn('⚠️  Please create a .env file in the backend directory with:');
  console.warn('   SUPABASE_URL=your_supabase_url');
  console.warn('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.warn('⚠️  Server will start but database operations will fail.');
  // Don't throw error, allow server to start but log warning
}

// Create Supabase client with service role key for backend operations
// Enhanced configuration for better connection handling
// Use placeholder values if env vars are missing to allow server to start
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'wander-sphere-backend'
    }
  },
  // Connection pooling and timeout settings
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection health check function
let lastHealthCheck = Date.now();
let connectionHealthy = true;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

async function checkConnectionHealth() {
  // Skip health check if Supabase credentials are missing
  if (!supabaseUrl || !supabaseServiceKey) {
    connectionHealthy = false;
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      connectionHealthy = false;
      console.warn('[Supabase] Connection health check failed:', error.message);
      return false;
    }
    
    connectionHealthy = true;
    lastHealthCheck = Date.now();
    return true;
  } catch (error) {
    connectionHealthy = false;
    console.warn('[Supabase] Connection health check error:', error.message);
    return false;
  }
}

// Periodic health checks
setInterval(() => {
  if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    checkConnectionHealth();
  }
}, HEALTH_CHECK_INTERVAL);

// Initial health check
checkConnectionHealth().catch(console.error);

// Export health check function
export const isConnectionHealthy = () => connectionHealthy;
export const performHealthCheck = checkConnectionHealth;

export default supabase;