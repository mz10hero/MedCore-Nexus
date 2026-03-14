// src/lib/supabase.ts
// ─────────────────────────────────────────────────────────────
// Supabase client — single instance for the whole app
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('[LabCore] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
})
