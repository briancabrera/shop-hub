import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { cartItemSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"

// GET /api/cart - Get current user's cart
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      // Return empty cart instead of error for unauthenticated users
      return successResponse({
        items: [],
        total: 0,
      })
    }

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
      return errorResponse(error.message, 500)
    }

    // Format the response
    const cartItems = data.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: item.products,
    }))

    return successResponse({
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    })
  } catch (error) {
    return errorResponse("Failed to fetch cart", 500)
  }
}

// POST /api/cart - Add product to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = cartItemSchema.parse(body)

    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    // Check if product exists and has enough stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("stock")
      .eq("id", validatedData.product_id)
      .single()

    if (productError || !product) {
      return errorResponse("Product not found", 404)
    }

    if (product.stock < validatedData.quantity) {
      return errorResponse("Not enough stock available", 400)
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", validatedData.product_id)
      .single()

    let result

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + validatedData.quantity

      if (newQuantity > product.stock) {
        return errorResponse("Not enough stock available", 400)
      }

      result = await supabaseAdmin
        .from("cart_items")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", existingItem.id)
        .select()
        .single()
    } else {
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
    }

    if (result.error) {
      return errorResponse(result.error.message, 500)
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleZodError(error)
  }
}

// DELETE /api/cart - Clear cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    const url = new URL(request.url)
    const itemId = url.searchParams.get("itemId")

    let query = supabaseAdmin.from("cart_items").delete()

    if (itemId) {
      // Delete specific item
      query = query.eq("id", itemId).eq("user_id", userId)
    } else {
      // Clear entire cart
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse({ message: itemId ? "Item removed from cart" : "Cart cleared" })
  } catch (error) {
    return errorResponse("Failed to delete cart items", 500)
  }
}
