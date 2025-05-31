import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { checkoutSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"

// POST /api/checkout - Process simulated checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkoutSchema.parse(body)

    // For demo purposes, we'll use a mock user ID
    // In a real app, you would get this from the authenticated session
    const userId = "demo-user-id"

    console.log("Processing checkout for user:", userId)
    console.log("Checkout data:", validatedData)

    // Fetch product details for all items
    const productIds = validatedData.items.map((item) => item.product_id)
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds)

    if (productsError || !products) {
      console.error("Products error:", productsError)
      return errorResponse("Failed to fetch product details", 500)
    }

    console.log("Found products:", products)

    // Check stock and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of validatedData.items) {
      const product = products.find((p) => p.id === item.product_id)

      if (!product) {
        return errorResponse(`Product ${item.product_id} not found`, 404)
      }

      if (product.stock < item.quantity) {
        return errorResponse(`Not enough stock for ${product.name}`, 400)
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      // Prepare order items for database
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    console.log("Total amount:", totalAmount)
    console.log("Order items:", orderItems)

    // Create order in database with completed status (simulated payment)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        status: "completed", // Simulated successful payment
        shipping_address: validatedData.shipping_address,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("Order creation error:", orderError)
      return errorResponse("Failed to create order", 500)
    }

    console.log("Created order:", order)

    // Create order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: orderItemsError } = await supabaseAdmin.from("order_items").insert(orderItemsWithOrderId)

    if (orderItemsError) {
      console.error("Failed to create order items:", orderItemsError)
      // Don't fail the entire checkout for this
    }

    // Update product stock
    for (const item of validatedData.items) {
      const product = products.find((p) => p.id === item.product_id)
      if (product) {
        const { error: stockError } = await supabaseAdmin
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("id", product.id)

        if (stockError) {
          console.error("Failed to update stock for product:", product.id, stockError)
        }
      }
    }

    // For demo purposes, we'll skip clearing the cart since we don't have real user sessions
    // In a real app: await supabaseAdmin.from("cart_items").delete().eq("user_id", userId)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Checkout completed successfully")

    return successResponse({
      order_id: order.id,
      total_amount: totalAmount,
      status: "completed",
      message: "Payment processed successfully (simulated)",
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return handleZodError(error)
  }
}
