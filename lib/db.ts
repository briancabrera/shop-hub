import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a single supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Create a client for client-side usage (with limited permissions)
export const createServerClient = () => {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
