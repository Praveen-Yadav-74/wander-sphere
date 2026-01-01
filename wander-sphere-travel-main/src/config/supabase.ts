import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create a .env file in the root directory with:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  
  // Show user-friendly error instead of crashing
  if (typeof window !== 'undefined') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">⚠️ Configuration Error</h1>
          <p style="color: #64748b; margin-bottom: 24px; font-size: 16px;">
            Missing Supabase environment variables. Please create a <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">.env</code> file in the root directory.
          </p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: 600;">Add these to your <code>.env</code> file:</p>
            <pre style="background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 0; font-size: 14px;">VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000</pre>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            After creating the file, restart the dev server: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">npm run dev</code>
          </p>
        </div>
      </div>
    `;
  }
  
  // Still throw error to prevent app from running with invalid config
  throw new Error('Missing Supabase environment variables. Check console for setup instructions.');
}

// Create Supabase client for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // 🛑 CRITICAL FIX: Disable session detection on URL changes and tab visibility
    // This prevents Supabase from triggering auth checks when tab gains focus
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000) // 15 second timeout for all requests
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    // 🛑 CRITICAL FIX: Reduce aggressive realtime syncing on visibility change
    params: {
      eventsPerSecond: 1 // Limit to 1 event per second (down from 10)
    }
  }
});

export default supabase;