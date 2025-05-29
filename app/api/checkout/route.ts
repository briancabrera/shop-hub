import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { checkoutSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// POST /api/checkout - Process checkout using Stripe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkoutSchema.parse(body)

    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    // Fetch product details for all items
    const productIds = validatedData.items.map((item) => item.product_id)
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds)

    if (productsError || !products) {
      return errorResponse("Failed to fetch product details", 500)
    }

    // Check stock and calculate total
    let totalAmount = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
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

      // Add to Stripe line items
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(product.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })

      // Prepare order items for database
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        status: "pending",
        shipping_address: validatedData.shipping_address,
      })
      .select()
      .single()

    if (orderError || !order) {
      return errorResponse("Failed to create order", 500)
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        order_id: order.id,
        user_id: userId,
      },
    })

    // Update order with Stripe session ID
    await supabaseAdmin.from("orders").update({ stripe_session_id: checkoutSession.id }).eq("id", order.id)

    return successResponse({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    })
  } catch (error) {
    return handleZodError(error)
  }
}
