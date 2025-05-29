import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// POST /api/webhook/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  } catch (err) {
    return errorResponse(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`, 400)
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      // Update order status
      if (session.metadata?.order_id) {
        await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", session.metadata.order_id)

        // Clear the user's cart
        if (session.metadata.user_id) {
          await supabaseAdmin.from("cart_items").delete().eq("user_id", session.metadata.user_id)
        }
      }
      break
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Update order status if we can find it
      if (paymentIntent.metadata?.order_id) {
        await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", paymentIntent.metadata.order_id)
      }
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return successResponse({ received: true })
}
