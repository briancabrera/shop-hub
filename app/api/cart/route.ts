import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError, getAuthenticatedUser } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return createResponse({
        items: [],
        total: 0,
        original_total: 0,
        total_savings: 0,
        product_items: [],
        deal_items: [],
        bundle_items: [],
      })
    }

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id,
        quantity,
        item_type,
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
          rating,
          description
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
          current_uses,
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            stock,
            category,
            rating,
            description
          )
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
          image_url,
          bundle_items (
            id,
            quantity,
            product_id,
            products (
              id,
              name,
              price,
              image_url,
              stock,
              category,
              rating,
              description
            )
          )
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
        product_items: [],
        deal_items: [],
        bundle_items: [],
      })
    }

    const cartItems = data.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_type: item.item_type,
      product_id: item.product_id,
      deal_id: item.deal_id,
      bundle_id: item.bundle_id,
      original_price: item.original_price || 0,
      discounted_price: item.discounted_price || 0,
      discount_amount: item.discount_amount || 0,
      product: item.products,
      deal: item.deals
        ? {
            ...item.deals,
            product: item.deals.products,
          }
        : null,
      bundle: item.bundles
        ? {
            ...item.bundles,
            items: item.bundles.bundle_items,
          }
        : null,
    }))

    // Categorizar items por tipo
    const productItems = cartItems.filter((item) => item.item_type === "product")
    const dealItems = cartItems.filter((item) => item.item_type === "deal")
    const bundleItems = cartItems.filter((item) => item.item_type === "bundle")

    // Calcular totales
    const total = cartItems.reduce((sum, item) => sum + (item.discounted_price || 0) * item.quantity, 0)
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.original_price || 0) * item.quantity, 0)
    const totalSavings = originalTotal - total

    return createResponse({
      items: cartItems,
      total,
      original_total: originalTotal,
      total_savings: totalSavings,
      product_items: productItems,
      deal_items: dealItems,
      bundle_items: bundleItems,
    })
  } catch (error) {
    console.error("Cart API error:", error)
    return createResponse({
      items: [],
      total: 0,
      original_total: 0,
      total_savings: 0,
      product_items: [],
      deal_items: [],
      bundle_items: [],
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return handleApiError(new Error("Authentication required"), 401)
    }

    const body = await request.json()
    console.log("Cart POST: Request body:", JSON.stringify(body))

    // Validate required fields
    if (!body.item_type || !["product", "deal", "bundle"].includes(body.item_type)) {
      return handleApiError(new Error("Invalid item_type"), 400)
    }

    if (!body.quantity || body.quantity < 1) {
      return handleApiError(new Error("Invalid quantity"), 400)
    }

    const itemType = body.item_type
    const quantity = body.quantity

    let itemId: string
    let originalPrice = 0
    let discountedPrice = 0
    let discountAmount = 0

    // Determine which ID to use based on item type
    switch (itemType) {
      case "product":
        if (!body.product_id) {
          return handleApiError(new Error("product_id required for product items"), 400)
        }
        itemId = body.product_id

        // Get product information
        const { data: product, error: productError } = await supabaseAdmin
          .from("products")
          .select("id, name, price, stock")
          .eq("id", itemId)
          .single()

        if (productError || !product) {
          return handleApiError(new Error("Product not found"), 404)
        }

        if (product.stock < quantity) {
          return handleApiError(new Error("Not enough stock available"), 400)
        }

        originalPrice = Number(product.price) || 0
        discountedPrice = originalPrice
        break

      case "deal":
        if (!body.deal_id) {
          return handleApiError(new Error("deal_id required for deal items"), 400)
        }
        itemId = body.deal_id

        // Get deal and product information
        const { data: deal, error: dealError } = await supabaseAdmin
          .from("deals")
          .select(`
            *,
            products (id, name, price, stock)
          `)
          .eq("id", itemId)
          .single()

        if (dealError || !deal) {
          return handleApiError(new Error("Deal not found"), 404)
        }

        if (!isValidDeal(deal)) {
          return handleApiError(new Error("Deal is not active or expired"), 400)
        }

        if (deal.products.stock < quantity) {
          return handleApiError(new Error("Not enough stock available"), 400)
        }

        originalPrice = Number(deal.products.price) || 0
        discountedPrice = calculateDealPrice(originalPrice, deal)
        discountAmount = originalPrice - discountedPrice
        break

      case "bundle":
        if (!body.bundle_id) {
          return handleApiError(new Error("bundle_id required for bundle items"), 400)
        }
        itemId = body.bundle_id

        // Get bundle information
        const { data: bundle, error: bundleError } = await supabaseAdmin
          .from("bundles")
          .select(`
            *,
            bundle_items (
              quantity,
              products (id, name, price, stock)
            )
          `)
          .eq("id", itemId)
          .single()

        if (bundleError || !bundle) {
          return handleApiError(new Error("Bundle not found"), 404)
        }

        if (!isValidBundle(bundle)) {
          return handleApiError(new Error("Bundle is not active or expired"), 400)
        }

        // Check stock for all bundle items
        for (const bundleItem of bundle.bundle_items) {
          if (bundleItem.products.stock < bundleItem.quantity * quantity) {
            return handleApiError(new Error(`Not enough stock for ${bundleItem.products.name}`), 400)
          }
        }

        // Calculate bundle pricing
        originalPrice = bundle.bundle_items.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0)
        discountedPrice = calculateBundlePrice(originalPrice, bundle)
        discountAmount = originalPrice - discountedPrice
        break

      default:
        return handleApiError(new Error("Invalid item type"), 400)
    }

    // Check for existing cart item
    let existingItemQuery = supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", itemType)

    switch (itemType) {
      case "product":
        existingItemQuery = existingItemQuery.eq("product_id", itemId)
        break
      case "deal":
        existingItemQuery = existingItemQuery.eq("deal_id", itemId)
        break
      case "bundle":
        existingItemQuery = existingItemQuery.eq("bundle_id", itemId)
        break
    }

    const { data: existingItem, error: existingError } = await existingItemQuery.maybeSingle()

    if (existingError) {
      console.error("Error checking existing item:", existingError)
      return handleApiError(new Error("Error checking existing cart item"), 500)
    }

    let result

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity

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
      // Create new cart item
      const insertData: any = {
        user_id: user.id,
        item_type: itemType,
        quantity: quantity,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_amount: discountAmount,
      }

      // Set the appropriate ID field
      switch (itemType) {
        case "product":
          insertData.product_id = itemId
          break
        case "deal":
          insertData.deal_id = itemId
          break
        case "bundle":
          insertData.bundle_id = itemId
          break
      }

      console.log("Cart POST: Insert data:", JSON.stringify(insertData))

      result = await supabaseAdmin.from("cart_items").insert(insertData).select().single()
    }

    if (result.error) {
      console.error("Database operation error:", result.error)
      return handleApiError(new Error(result.error.message), 500)
    }

    // Update usage counters for deals and bundles
    if (!existingItem && (itemType === "deal" || itemType === "bundle")) {
      const table = itemType === "deal" ? "deals" : "bundles"
      await supabaseAdmin
        .from(table)
        .update({ current_uses: supabaseAdmin.raw("current_uses + 1") })
        .eq("id", itemId)
    }

    return createResponse(result.data, 201)
  } catch (error) {
    console.error("Cart POST error:", error)
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

function calculateBundlePrice(originalPrice: number, bundle: any): number {
  try {
    if (!bundle || !originalPrice) return originalPrice

    const price = Number(originalPrice)
    if (isNaN(price)) return originalPrice

    if (bundle.discount_type === "percentage") {
      const discountValue = Number(bundle.discount_value)
      if (isNaN(discountValue)) return price
      return Math.round(price * (1 - discountValue / 100) * 100) / 100
    } else {
      const discountValue = Number(bundle.discount_value)
      if (isNaN(discountValue)) return price
      return Math.max(0, Math.round((price - discountValue) * 100) / 100)
    }
  } catch (error) {
    console.error("Error calculating bundle price:", error)
    return originalPrice
  }
}
