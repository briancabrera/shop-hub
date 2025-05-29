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
      original_price: item.original_price || item.products.price,
      discounted_price: item.discounted_price || item.products.price,
      discount_amount: item.discount_amount || 0,
      deal: item.deals,
      bundle: item.bundles,
    }))

    // Categorizar items
    const dealItems = cartItems.filter((item) => item.deal_id)
    const bundleItems = cartItems.filter((item) => item.bundle_id)
    const regularItems = cartItems.filter((item) => !item.deal_id && !item.bundle_id)

    // Calcular totales
    const total = cartItems.reduce((sum, item) => sum + item.discounted_price * item.quantity, 0)
    const originalTotal = cartItems.reduce((sum, item) => sum + item.original_price * item.quantity, 0)
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

    const body = await request.json()
    const validatedData = cartItemSchema.parse(body)

    // Obtener información del producto
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

    let dealInfo = null
    let bundleInfo = null
    const originalPrice = product.price
    let discountedPrice = product.price
    let discountAmount = 0

    // Si se especifica un deal, validarlo y calcular precios
    if (validatedData.deal_id) {
      const { data: deal } = await supabaseAdmin
        .from("deals")
        .select("*")
        .eq("id", validatedData.deal_id)
        .eq("product_id", validatedData.product_id)
        .single()

      if (deal && (await isValidDeal(deal))) {
        dealInfo = deal
        discountedPrice = calculateDealPrice(originalPrice, deal)
        discountAmount = originalPrice - discountedPrice
      }
    }

    // Si se especifica un bundle, validarlo
    if (validatedData.bundle_id) {
      const { data: bundle } = await supabaseAdmin
        .from("bundles")
        .select("*")
        .eq("id", validatedData.bundle_id)
        .single()

      if (bundle && (await isValidBundle(bundle))) {
        bundleInfo = bundle
        // Para bundles, el descuento se aplica al nivel del bundle completo
        // Aquí mantenemos el precio original del producto individual
      }
    }

    // Verificar si el item ya existe en el carrito
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", validatedData.product_id)
      .eq("deal_id", validatedData.deal_id || null)
      .eq("bundle_id", validatedData.bundle_id || null)
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
          deal_id: validatedData.deal_id || null,
          bundle_id: validatedData.bundle_id || null,
          original_price: originalPrice,
          discounted_price: discountedPrice,
          discount_amount: discountAmount,
        })
        .select()
        .single()
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    // Incrementar uso del deal si aplica
    if (dealInfo && !existingItem) {
      await supabaseAdmin
        .from("deals")
        .update({ current_uses: dealInfo.current_uses + 1 })
        .eq("id", dealInfo.id)
    }

    // Incrementar uso del bundle si aplica
    if (bundleInfo && !existingItem) {
      await supabaseAdmin
        .from("bundles")
        .update({ current_uses: bundleInfo.current_uses + 1 })
        .eq("id", bundleInfo.id)
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
async function isValidDeal(deal: any): Promise<boolean> {
  const now = new Date()
  return (
    deal.is_active &&
    now >= new Date(deal.start_date) &&
    now <= new Date(deal.end_date) &&
    (deal.max_uses === null || deal.current_uses < deal.max_uses)
  )
}

async function isValidBundle(bundle: any): Promise<boolean> {
  const now = new Date()
  return (
    bundle.is_active &&
    now >= new Date(bundle.start_date) &&
    now <= new Date(bundle.end_date) &&
    (bundle.max_uses === null || bundle.current_uses < bundle.max_uses)
  )
}

function calculateDealPrice(originalPrice: number, deal: any): number {
  if (deal.discount_type === "percentage") {
    return Math.round(originalPrice * (1 - deal.discount_value / 100) * 100) / 100
  } else {
    return Math.max(0, Math.round((originalPrice - deal.discount_value) * 100) / 100)
  }
}
