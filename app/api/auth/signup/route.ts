import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { userSignupSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"
import bcrypt from "bcryptjs"

// POST /api/auth/signup - Sign up a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userSignupSchema.parse(body)

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", validatedData.email)
      .single()

    if (existingUser) {
      return errorResponse("User with this email already exists", 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
    })

    if (authError) {
      return errorResponse(authError.message, 500)
    }

    // Create user in our database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUser.user.id,
        email: validatedData.email,
        password_hash: hashedPassword,
        full_name: validatedData.full_name,
      })
      .select("id, email, full_name, created_at")
      .single()

    if (userError) {
      // Rollback auth user creation if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return errorResponse(userError.message, 500)
    }

    return successResponse(user, 201)
  } catch (error) {
    return handleZodError(error)
  }
}
