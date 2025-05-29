import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError, getAuthenticatedUser } from "@/lib/api/utils"
import { cartItemSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return createResponse({ items: [], total: 0 })
    }

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
      .eq("user_id", user.id)

    if (error) {
      console.error("Cart query error:", error)
      return createResponse({ items: [], total: 0 })
    }

    const cartItems = data.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: item.products,
    }))

    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    return createResponse({
      items: cartItems,
      total,
    })
  } catch (error) {
    console.error("Cart API error:", error)
    return createResponse({ items: [], total: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return handleApiError(new Error("Authentication required"), 401)
    }

    const body = await request.json()
    const validatedData = cartItemSchema.parse(body)

    // Check product exists and has stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, stock, name")
      .eq("id", validatedData.product_id)
      .single()

    if (productError || !product) {
      return handleApiError(new Error("Product not found"), 404)
    }

    if (product.stock < validatedData.quantity) {
      return handleApiError(new Error("Not enough stock available"), 400)
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", validatedData.product_id)
      .maybeSingle()

    let result

    if (existingItem) {
      const newQuantity = existingItem.quantity + validatedData.quantity

      if (newQuantity > product.stock) {
        return handleApiError(new Error("Not enough stock available"), 400)
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
    } else {
      result = await supabaseAdmin
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: validatedData.product_id,
          quantity: validatedData.quantity,
        })
        .select()
        .single()
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    return createResponse(result.data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return handleApiError(new Error("Authentication required"), 401)
    }

    const url = new URL(request.url)
    const itemId = url.searchParams.get("itemId")

    let query = supabaseAdmin.from("cart_items").delete()

    if (itemId) {
      query = query.eq("id", itemId).eq("user_id", user.id)
    } else {
      query = query.eq("user_id", user.id)
    }

    const { error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return createResponse({
      message: itemId ? "Item removed from cart" : "Cart cleared",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
