/**
 * Catnip Studios — Client Environment Configuration
 * 
 * Provides runtime configuration for Supabase integration.
 * DO NOT put Supabase service-role keys or database passwords here.
 * Only the public project URL and public anon key should be configured.
 */

window.ENV = window.ENV || {};

// Read from existing window properties, or process.env if bundled, or provide default placeholders.
// You can also configure these dynamically in the Community Voting interface.
window.ENV.SUPABASE_URL = window.ENV.SUPABASE_URL || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) || '';
window.ENV.SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) || '';
