// Environment Variable Checker
// Run this script to verify environment variables are properly set

console.log('=== Environment Variables Check ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NOT SET (using fallback: http://localhost:5000/api)');
console.log('NODE_ENV:', import.meta.env.NODE_ENV || 'NOT SET');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('=== End Check ===');

// For debugging in production
if (typeof window !== 'undefined') {
  window.checkEnv = () => {
    console.log('Current API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
    console.log('All env vars:', import.meta.env);
  };
}