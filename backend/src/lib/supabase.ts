import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Server-side Supabase client using the service role key.
 * Used for Supabase Storage operations (question images).
 * Never expose the service role key to the client.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;
