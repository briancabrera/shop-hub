import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        shipping_address,
        order_items (
          id,
          quantity,
          price,
          product_id,
          products (
            name,
            image_url
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(data)
  } catch (error) {
    return errorResponse("Failed to fetch orders", 500)
  }
}

// POST /api/orders - Create an order after successful payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return errorResponse("Session ID is required", 400)
    }

    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    // Find the order with this session ID
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("stripe_session_id", session_id)
      .eq("user_id", userId)
      .single()

    if (orderError || !order) {
      return errorResponse("Order not found", 404)
    }

    // Update order status to completed
    const { error: updateError } = await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order.id)

    if (updateError) {
      return errorResponse("Failed to update order status", 500)
    }

    // Get user's cart items
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", userId)

    if (cartError) {
      return errorResponse("Failed to fetch cart items", 500)
    }

    // Create order items
    if (cartItems && cartItems.length > 0) {
      // Get product details for all items
      const productIds = cartItems.map((item) => item.product_id)
      const { data: products } = await supabaseAdmin.from("products").select("id, price").in("id", productIds)

      if (products) {
        const orderItems = cartItems.map((item) => {
          const product = products.find((p) => p.id === item.product_id)
          return {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: product ? product.price : 0,
          }
        })

        // Insert order items
        await supabaseAdmin.from("order_items").insert(orderItems)

        // Update product stock
        for (const item of cartItems) {
          await supabaseAdmin.rpc("decrease_product_stock", {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          })
        }

        // Clear the cart
        await supabaseAdmin.from("cart_items").delete().eq("user_id", userId)
      }
    }

    return successResponse({ order_id: order.id })
  } catch (error) {
    return errorResponse("Failed to process order", 500)
  }
}
