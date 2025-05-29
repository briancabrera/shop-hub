import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError, getAuthenticatedUser } from "@/lib/api/utils"
import { cartItemSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return createResponse({
        items: [],
        total: 0,
        original_total: 0,
        total_savings: 0,
        deal_items: [],
        bundle_items: [],
        regular_items: [],
      })
    }

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id,
        quantity,
        product_id,
        deal_id,
        bundle_id,
        original_price,
        discounted_price,
        discount_amount,
        products (
          id,
          name,
          price,
          image_url,
          stock,
          category,
          rating
        ),
        deals (
          id,
          title,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_active,
          max_uses,
          current_uses
        ),
        bundles (
          id,
          title,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_active,
          max_uses,
          current_uses,
          image_url
        )
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Cart query error:", error)
      return createResponse({
        items: [],
        total: 0,
        original_total: 0,
        total_savings: 0,
        deal_items: [],
        bundle_items: [],
        regular_items: [],
      })
    }

    const cartItems = data.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: item.products,
      deal_id: item.deal_id,
      bundle_id: item.bundle_id,
      original_price: item.original_price || item.products?.price || 0,
      discounted_price: item.discounted_price || item.products?.price || 0,
      discount_amount: item.discount_amount || 0,
      deal: item.deals,
      bundle: item.bundles,
    }))

    // Categorizar items
    const dealItems = cartItems.filter((item) => item.deal_id)
    const bundleItems = cartItems.filter((item) => item.bundle_id)
    const regularItems = cartItems.filter((item) => !item.deal_id && !item.bundle_id)

    // Calcular totales
    const total = cartItems.reduce((sum, item) => sum + (item.discounted_price || 0) * item.quantity, 0)
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.original_price || 0) * item.quantity, 0)
    const totalSavings = originalTotal - total

    return createResponse({
      items: cartItems,
      total,
      original_total: originalTotal,
      total_savings: totalSavings,
      deal_items: dealItems,
      bundle_items: bundleItems,
      regular_items: regularItems,
    })
  } catch (error) {
    console.error("Cart API error:", error)
    return createResponse({
      items: [],
      total: 0,
      original_total: 0,
      total_savings: 0,
      deal_items: [],
      bundle_items: [],
      regular_items: [],
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Cart POST: Starting request processing")

    const user = await getAuthenticatedUser(request)
    if (!user) {
      console.log("Cart POST: No authenticated user")
      return handleApiError(new Error("Authentication required"), 401)
    }

    console.log("Cart POST: User authenticated:", user.id)

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      console.log("Cart POST: Request body:", body)
    } catch (error) {
      console.error("Cart POST: Failed to parse JSON:", error)
      return handleApiError(new Error("Invalid JSON in request body"), 400)
    }

    let validatedData
    try {
      validatedData = cartItemSchema.parse(body)
      console.log("Cart POST: Validated data:", validatedData)
    } catch (error) {
      console.error("Cart POST: Validation error:", error)
      return handleApiError(new Error("Invalid request data"), 400)
    }

    // Get product information
    console.log("Cart POST: Fetching product:", validatedData.product_id)
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .eq("id", validatedData.product_id)
      .single()

    if (productError || !product) {
      console.error("Cart POST: Product not found:", productError)
      return handleApiError(new Error("Product not found"), 404)
    }

    console.log("Cart POST: Product found:", product.name, "Price:", product.price)

    if (product.stock < validatedData.quantity) {
      console.log("Cart POST: Insufficient stock")
      return handleApiError(new Error("Not enough stock available"), 400)
    }

    // Initialize pricing
    const originalPrice = Number(product.price) || 0
    let discountedPrice = originalPrice
    let discountAmount = 0
    let dealInfo = null
    let bundleInfo = null

    console.log("Cart POST: Original price:", originalPrice)

    // Handle deal if specified
    if (validatedData.deal_id) {
      console.log("Cart POST: Processing deal:", validatedData.deal_id)

      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("*")
        .eq("id", validatedData.deal_id)
        .eq("product_id", validatedData.product_id)
        .single()

      if (dealError) {
        console.error("Cart POST: Deal query error:", dealError)
      } else if (deal && isValidDeal(deal)) {
        console.log("Cart POST: Valid deal found:", deal.title)
        dealInfo = deal
        discountedPrice = calculateDealPrice(originalPrice, deal)
        discountAmount = originalPrice - discountedPrice
        console.log("Cart POST: Deal price calculated:", discountedPrice)
      } else {
        console.log("Cart POST: Deal not valid or not found")
      }
    }

    // Handle bundle if specified
    if (validatedData.bundle_id) {
      console.log("Cart POST: Processing bundle:", validatedData.bundle_id)

      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from("bundles")
        .select("*")
        .eq("id", validatedData.bundle_id)
        .single()

      if (bundleError) {
        console.error("Cart POST: Bundle query error:", bundleError)
      } else if (bundle && isValidBundle(bundle)) {
        console.log("Cart POST: Valid bundle found:", bundle.title)
        bundleInfo = bundle
      } else {
        console.log("Cart POST: Bundle not valid or not found")
      }
    }

    // Check for existing cart item
    console.log("Cart POST: Checking for existing cart item")
    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", validatedData.product_id)
      .eq("deal_id", validatedData.deal_id || null)
      .eq("bundle_id", validatedData.bundle_id || null)
      .maybeSingle()

    if (existingError) {
      console.error("Cart POST: Error checking existing item:", existingError)
    }

    let result

    if (existingItem) {
      console.log("Cart POST: Updating existing item")
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
      console.log("Cart POST: Creating new cart item")

      const insertData = {
        user_id: user.id,
        product_id: validatedData.product_id,
        quantity: validatedData.quantity,
        deal_id: validatedData.deal_id || null,
        bundle_id: validatedData.bundle_id || null,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_amount: discountAmount,
      }

      console.log("Cart POST: Insert data:", insertData)

      result = await supabaseAdmin.from("cart_items").insert(insertData).select().single()
    }

    if (result.error) {
      console.error("Cart POST: Database operation error:", result.error)
      throw new Error(result.error.message)
    }

    console.log("Cart POST: Successfully added/updated cart item")

    // Update usage counters (only for new items)
    if (!existingItem) {
      if (dealInfo) {
        console.log("Cart POST: Incrementing deal usage")
        await supabaseAdmin
          .from("deals")
          .update({ current_uses: (dealInfo.current_uses || 0) + 1 })
          .eq("id", dealInfo.id)
      }

      if (bundleInfo) {
        console.log("Cart POST: Incrementing bundle usage")
        await supabaseAdmin
          .from("bundles")
          .update({ current_uses: (bundleInfo.current_uses || 0) + 1 })
          .eq("id", bundleInfo.id)
      }
    }

    return createResponse(result.data, 201)
  } catch (error) {
    console.error("Cart POST: Unexpected error:", error)
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

// Helper functions
function isValidDeal(deal: any): boolean {
  const now = new Date()
  return (
    deal.is_active &&
    now >= new Date(deal.start_date) &&
    now <= new Date(deal.end_date) &&
    (deal.max_uses === null || (deal.current_uses || 0) < deal.max_uses)
  )
}

function isValidBundle(bundle: any): boolean {
  const now = new Date()
  return (
    bundle.is_active &&
    now >= new Date(bundle.start_date) &&
    now <= new Date(bundle.end_date) &&
    (bundle.max_uses === null || (bundle.current_uses || 0) < bundle.max_uses)
  )
}

function calculateDealPrice(originalPrice: number, deal: any): number {
  if (deal.discount_type === "percentage") {
    return Math.round(originalPrice * (1 - Number(deal.discount_value) / 100) * 100) / 100
  } else {
    return Math.max(0, Math.round((originalPrice - Number(deal.discount_value)) * 100) / 100)
  }
}
