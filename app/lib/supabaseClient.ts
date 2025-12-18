import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Safe Supabase client:
 * - Uses public env vars
 * - Does NOT crash the app if env vars are missing
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const supabaseReady = Boolean(
  supabaseUrl && supabaseAnonKey
);
