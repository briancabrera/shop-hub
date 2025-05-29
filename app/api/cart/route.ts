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

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Cart POST: Request body:", JSON.stringify(body))
    } catch (error) {
      console.error("Cart POST: Failed to parse JSON:", error)
      return handleApiError(new Error("Invalid JSON in request body"), 400)
    }

    // Validate request data
    try {
      const validatedData = cartItemSchema.parse(body)
      console.log("Cart POST: Validated data:", JSON.stringify(validatedData))

      // Debug: Log the exact values being processed
      console.log("🔍 Cart API Debug - Raw deal_id:", body.deal_id, "Type:", typeof body.deal_id)
      console.log("🔍 Cart API Debug - Raw bundle_id:", body.bundle_id, "Type:", typeof body.bundle_id)
      console.log(
        "🔍 Cart API Debug - Validated deal_id:",
        validatedData.deal_id,
        "Type:",
        typeof validatedData.deal_id,
      )
      console.log(
        "🔍 Cart API Debug - Validated bundle_id:",
        validatedData.bundle_id,
        "Type:",
        typeof validatedData.bundle_id,
      )

      // Normalize null values - convert undefined to null, filter out empty strings
      const dealId =
        validatedData.deal_id === undefined || validatedData.deal_id === "" || validatedData.deal_id === null
          ? null
          : validatedData.deal_id
      const bundleId =
        validatedData.bundle_id === undefined || validatedData.bundle_id === "" || validatedData.bundle_id === null
          ? null
          : validatedData.bundle_id

      console.log("🔧 Cart API Debug - Normalized dealId:", dealId, "Type:", typeof dealId)
      console.log("🔧 Cart API Debug - Normalized bundleId:", bundleId, "Type:", typeof bundleId)

      // Get product information
      console.log("Cart POST: Fetching product:", validatedData.product_id)
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("id, name, price, stock")
        .eq("id", validatedData.product_id)
        .single()

      if (productError) {
        console.error("Cart POST: Product query error:", productError)
        return handleApiError(new Error("Product not found"), 404)
      }

      if (!product) {
        console.log("Cart POST: Product not found")
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
      if (dealId) {
        console.log("Cart POST: Processing deal:", dealId)

        const { data: deal, error: dealError } = await supabaseAdmin.from("deals").select("*").eq("id", dealId).single()

        if (dealError) {
          console.error("Cart POST: Deal query error:", dealError)
        } else if (deal) {
          console.log("Cart POST: Deal found:", deal.title)

          // Check if deal is valid
          if (isValidDeal(deal)) {
            console.log("Cart POST: Deal is valid")
            dealInfo = deal
            discountedPrice = calculateDealPrice(originalPrice, deal)
            discountAmount = originalPrice - discountedPrice
            console.log("Cart POST: Discounted price:", discountedPrice)
          } else {
            console.log("Cart POST: Deal is not valid")
          }
        } else {
          console.log("Cart POST: Deal not found")
        }
      }

      // Handle bundle if specified
      if (bundleId) {
        console.log("Cart POST: Processing bundle:", bundleId)

        const { data: bundle, error: bundleError } = await supabaseAdmin
          .from("bundles")
          .select("*")
          .eq("id", bundleId)
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

      // Check for existing cart item with proper null handling
      console.log("Cart POST: Checking for existing cart item")

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

      if (existingError) {
        console.error("Cart POST: Error checking existing item:", existingError)
        return handleApiError(new Error("Error checking existing cart item"), 500)
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
          deal_id: dealId,
          bundle_id: bundleId,
          original_price: originalPrice,
          discounted_price: discountedPrice,
          discount_amount: discountAmount,
        }

        console.log("Cart POST: Insert data:", JSON.stringify(insertData))

        result = await supabaseAdmin.from("cart_items").insert(insertData).select().single()
      }

      if (result.error) {
        console.error("Cart POST: Database operation error:", result.error)
        return handleApiError(new Error(result.error.message), 500)
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
      console.error("Cart POST: Validation or processing error:", error)
      return handleApiError(error)
    }
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
