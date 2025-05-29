import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { cartItemSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"

// GET /api/cart - Get current user's cart
export async function GET(request: NextRequest) {
  try {
    console.log("Cart API: GET request received")

    // Get authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Cart API: No auth header, returning empty cart")
      // Return empty cart for unauthenticated users instead of error
      return successResponse({
        items: [],
        total: 0,
      })
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log("Cart API: Invalid token, returning empty cart")
      // Return empty cart for invalid tokens instead of error
      return successResponse({
        items: [],
        total: 0,
      })
    }

    const userId = user.id
    console.log(`Cart API: Authenticated user ${userId}`)

    // Check if cart_items table exists
    try {
      // Get cart items with product details
      const { data, error } = await supabaseAdmin
        .from("cart_items")
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            stock
          )
        `)
        .eq("user_id", userId)

      if (error) {
        console.error("Cart API database error:", error)
        // Return empty cart on database error instead of failing
        return successResponse({
          items: [],
          total: 0,
        })
      }

      // Format the response
      const cartItems = data.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.products,
      }))

      console.log(`Cart API: Found ${cartItems.length} items in cart`)

      return successResponse({
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      })
    } catch (error) {
      console.error("Cart API error:", error)
      // Return empty cart on any error
      return successResponse({
        items: [],
        total: 0,
      })
    }
  } catch (error) {
    console.error("Cart API error:", error)
    // Return empty cart on any error
    return successResponse({
      items: [],
      total: 0,
    })
  }
}

// POST /api/cart - Add product to cart
export async function POST(request: NextRequest) {
  try {
    console.log("Cart API: POST request received")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Cart API: Request body:", body)
    } catch (error) {
      console.error("Cart API: Failed to parse request body:", error)
      return errorResponse("Invalid request body", 400)
    }

    // Validate request data
    let validatedData
    try {
      validatedData = cartItemSchema.parse(body)
      console.log("Cart API: Validated data:", validatedData)
    } catch (error) {
      console.error("Cart API: Validation error:", error)
      return handleZodError(error)
    }

    // Get user from authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Cart API: No auth header for POST")
      return errorResponse("Authentication required", 401)
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log("Cart API: Invalid token for POST")
      return errorResponse("Invalid authentication token", 401)
    }

    const userId = user.id
    console.log(`Cart API: Adding item to cart for user ${userId}`)

    // Check if product exists and has enough stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, stock, name")
      .eq("id", validatedData.product_id)
      .single()

    if (productError) {
      console.error("Cart API: Product query error:", productError)
      return errorResponse("Product not found", 404)
    }

    if (!product) {
      console.log("Cart API: Product not found:", validatedData.product_id)
      return errorResponse("Product not found", 404)
    }

    console.log(`Cart API: Found product ${product.name} with stock ${product.stock}`)

    if (product.stock < validatedData.quantity) {
      console.log(`Cart API: Not enough stock. Requested: ${validatedData.quantity}, Available: ${product.stock}`)
      return errorResponse("Not enough stock available", 400)
    }

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", validatedData.product_id)
      .maybeSingle() // Use maybeSingle instead of single to avoid error when no item exists

    if (existingError) {
      console.error("Cart API: Error checking existing item:", existingError)
      return errorResponse("Database error", 500)
    }

    let result

    if (existingItem) {
      console.log("Cart API: Item already exists in cart, updating quantity")
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + validatedData.quantity

      if (newQuantity > product.stock) {
        console.log(`Cart API: Total quantity would exceed stock. New total: ${newQuantity}, Stock: ${product.stock}`)
        return errorResponse("Not enough stock available", 400)
      }

      result = await supabaseAdmin
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select()
        .single()

      console.log("Cart API: Updated existing item:", result)
    } else {
      console.log("Cart API: Adding new item to cart")
      // Add new item to cart
      result = await supabaseAdmin
        .from("cart_items")
        .insert({
          user_id: userId,
          product_id: validatedData.product_id,
          quantity: validatedData.quantity,
        })
        .select()
        .single()

      console.log("Cart API: Inserted new item:", result)
    }

    if (result.error) {
      console.error("Cart API: Database operation error:", result.error)
      return errorResponse(result.error.message, 500)
    }

    console.log("Cart API: Successfully added/updated cart item")
    return successResponse(result.data, 201)
  } catch (error) {
    console.error("Cart API: Unexpected error in POST:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/cart - Clear cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    console.log("Cart API: DELETE request received")

    // Get user from authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Authentication required", 401)
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return errorResponse("Invalid authentication token", 401)
    }

    const userId = user.id

    const url = new URL(request.url)
    const itemId = url.searchParams.get("itemId")

    let query = supabaseAdmin.from("cart_items").delete()

    if (itemId) {
      console.log(`Cart API: Deleting specific item ${itemId} for user ${userId}`)
      // Delete specific item
      query = query.eq("id", itemId).eq("user_id", userId)
    } else {
      console.log(`Cart API: Clearing entire cart for user ${userId}`)
      // Clear entire cart
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Cart API: Delete operation error:", error)
      return errorResponse(error.message, 500)
    }

    console.log("Cart API: Successfully deleted cart item(s)")
    return successResponse({ message: itemId ? "Item removed from cart" : "Cart cleared" })
  } catch (error) {
    console.error("Cart API: Unexpected error in DELETE:", error)
    return errorResponse("Failed to delete cart items", 500)
  }
}
