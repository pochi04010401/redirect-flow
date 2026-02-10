import { createClient } from '@supabase/supabase-js';

// Factory pattern for browser client
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder')) {
    // Return a dummy client during build
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createClient(url, key);
}

// Keep singleton for backward compatibility in some components if needed
export const supabase = createBrowserSupabase();
