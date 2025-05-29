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
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return handleApiError(new Error("Authentication required"), 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = cartItemSchema.parse(body)

    // Normalize null values - convert undefined to null, filter out empty strings
    const dealId = validatedData.deal_id || null
    const bundleId = validatedData.bundle_id || null

    // Get product information
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .eq("id", validatedData.product_id)
      .single()

    if (productError || !product) {
      return handleApiError(new Error("Product not found"), 404)
    }

    if (product.stock < validatedData.quantity) {
      return handleApiError(new Error("Not enough stock available"), 400)
    }

    // Initialize pricing
    const originalPrice = Number(product.price) || 0
    let discountedPrice = originalPrice
    let discountAmount = 0
    let dealInfo = null
    let bundleInfo = null

    // Handle deal if specified
    if (dealId) {
      const { data: deal, error: dealError } = await supabaseAdmin.from("deals").select("*").eq("id", dealId).single()

      if (!dealError && deal) {
        // Check if deal is valid
        if (isValidDeal(deal)) {
          dealInfo = deal
          discountedPrice = calculateDealPrice(originalPrice, deal)
          discountAmount = originalPrice - discountedPrice
        }
      }
    }

    // Handle bundle if specified
    if (bundleId) {
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from("bundles")
        .select("*")
        .eq("id", bundleId)
        .single()

      if (!bundleError && bundle && isValidBundle(bundle)) {
        bundleInfo = bundle
      }
    }

    // Check for existing cart item with proper null handling
    let existingItemQuery = supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", validatedData.product_id)

    // Handle deal_id comparison
    if (dealId === null) {
      existingItemQuery = existingItemQuery.is("deal_id", null)
    } else {
      existingItemQuery = existingItemQuery.eq("deal_id", dealId)
    }

    // Handle bundle_id comparison
    if (bundleId === null) {
      existingItemQuery = existingItemQuery.is("bundle_id", null)
    } else {
      existingItemQuery = existingItemQuery.eq("bundle_id", bundleId)
    }

    const { data: existingItem, error: existingError } = await existingItemQuery.maybeSingle()

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
      const insertData = {
        user_id: user.id,
        product_id: validatedData.product_id,
        quantity: validatedData.quantity,
        deal_id: dealId,
        bundle_id: bundleId,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_amount: discountAmount,
      }

      result = await supabaseAdmin.from("cart_items").insert(insertData).select().single()
    }

    if (result.error) {
      return handleApiError(new Error(result.error.message), 500)
    }

    // Update usage counters (only for new items)
    if (!existingItem) {
      if (dealInfo) {
        await supabaseAdmin
          .from("deals")
          .update({ current_uses: (dealInfo.current_uses || 0) + 1 })
          .eq("id", dealInfo.id)
      }

      if (bundleInfo) {
        await supabaseAdmin
          .from("bundles")
          .update({ current_uses: (bundleInfo.current_uses || 0) + 1 })
          .eq("id", bundleInfo.id)
      }
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

// Helper functions
function isValidDeal(deal: any): boolean {
  if (!deal) return false

  try {
    const now = new Date()
    const startDate = new Date(deal.start_date)
    const endDate = new Date(deal.end_date)

    return (
      deal.is_active === true &&
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime()) &&
      now >= startDate &&
      now <= endDate &&
      (deal.max_uses === null || (deal.current_uses || 0) < deal.max_uses)
    )
  } catch (error) {
    console.error("Error validating deal:", error)
    return false
  }
}

function isValidBundle(bundle: any): boolean {
  if (!bundle) return false

  try {
    const now = new Date()
    const startDate = new Date(bundle.start_date)
    const endDate = new Date(bundle.end_date)

    return (
      bundle.is_active === true &&
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime()) &&
      now >= startDate &&
      now <= endDate &&
      (bundle.max_uses === null || (bundle.current_uses || 0) < bundle.max_uses)
    )
  } catch (error) {
    console.error("Error validating bundle:", error)
    return false
  }
}

function calculateDealPrice(originalPrice: number, deal: any): number {
  try {
    if (!deal || !originalPrice) return originalPrice

    const price = Number(originalPrice)
    if (isNaN(price)) return originalPrice

    if (deal.discount_type === "percentage") {
      const discountValue = Number(deal.discount_value)
      if (isNaN(discountValue)) return price
      return Math.round(price * (1 - discountValue / 100) * 100) / 100
    } else {
      const discountValue = Number(deal.discount_value)
      if (isNaN(discountValue)) return price
      return Math.max(0, Math.round((price - discountValue) * 100) / 100)
    }
  } catch (error) {
    console.error("Error calculating deal price:", error)
    return originalPrice
  }
}
