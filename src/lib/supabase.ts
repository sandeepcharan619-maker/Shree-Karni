import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ufwokmxbnjiwwqktwliv.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_-l5Y1hDMkOAr7VfFnCTM4A_dHlvNWqu";

// Client-side and server-side Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);
