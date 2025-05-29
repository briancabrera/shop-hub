import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Client-side Supabase client
export const supabaseClient = createClientComponentClient<Database>()
