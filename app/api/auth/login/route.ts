import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { userLoginSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"

// POST /api/auth/login - Log in a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userLoginSchema.parse(body)

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (authError) {
      return errorResponse("Invalid email or password", 401)
    }

    // Get user details from our database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", authData.user.id)
      .single()

    if (userError) {
      return errorResponse("User not found", 404)
    }

    return successResponse({
      user,
      session: {
        access_token: authData.session?.access_token,
        expires_at: authData.session?.expires_at,
      },
    })
  } catch (error) {
    return handleZodError(error)
  }
}
