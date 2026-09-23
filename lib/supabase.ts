// lib/supabase.ts
// Cliente Supabase compartido con rol "anon". Sujeto a RLS.
// Para operaciones con service role, ver endpoints en `app/api/`.
// Doc completa: docs/codigo/codigo.md#libsupabasets

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
