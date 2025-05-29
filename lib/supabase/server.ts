import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Server-side Supabase client
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
