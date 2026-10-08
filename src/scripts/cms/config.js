/**
 * KruuuuLove CMS Configuration
 * Reads Vite environment variables for Supabase and admin authentication.
 */

export const CMS_CONFIG = {
  // Supabase Configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

  // Fallback Admin Password for local development / offline testing
  // In production with Supabase, Supabase Auth (email + password) is used.
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || 'kruuuu2026',

  // Image optimization parameters
  imageMaxDimension: 1600,
  imageQuality: 0.85,
  maxFileSizeMB: 20
};

export function isSupabaseConfigured() {
  return Boolean(
    CMS_CONFIG.supabaseUrl &&
    CMS_CONFIG.supabaseAnonKey &&
    CMS_CONFIG.supabaseUrl.trim() !== '' &&
    CMS_CONFIG.supabaseAnonKey.trim() !== '' &&
    !CMS_CONFIG.supabaseUrl.includes('your-project')
  );
}
