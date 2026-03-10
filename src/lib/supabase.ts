import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// If URL is empty or invalid, providing a placeholder prevents build crash during pre-rendering.
// The app will still need correct variables at runtime to function.
// Cast to SupabaseClient<Database> so table payloads (Insert/Update) are inferred correctly.
export const supabase = createBrowserClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
) as SupabaseClient<Database>;
