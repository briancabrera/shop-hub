import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { z } from "zod"

const cartItemSchema = z.object({
  item_type: z.enum(["product", "deal", "bundle"]),
  product_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  bundle_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive(),
})

export async function GET() {
  try {
    const { supabase, userId } = await supabaseServer()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (cartError) {
      console.error("Error fetching cart items:", cartError)
      return NextResponse.json({ error: "Failed to fetch cart items" }, { status: 500 })
    }

    // Process cart items based on item_type
    const processedItems = []
    let total = 0
    let originalTotal = 0
    let totalSavings = 0
    const productItems = []
    const dealItems = []
    const bundleItems = []

    for (const item of cartItems) {
      const processedItem = { ...item }

      // Process based on item_type
      if (item.item_type === "product" && item.product_id) {
        // Get product details
        const { data: product } = await supabase.from("products").select("*").eq("id", item.product_id).single()

        if (product) {
          processedItem.product = product
          processedItem.original_price = product.price
          processedItem.discounted_price = product.price
          processedItem.discount_amount = 0

          originalTotal += product.price * item.quantity
          total += product.price * item.quantity

          productItems.push(processedItem)
        }
      } else if (item.item_type === "deal" && item.deal_id) {
        // Get deal details with product
        const { data: deal } = await supabase
          .from("deals")
          .select("*, product:product_id(*)")
          .eq("id", item.deal_id)
          .single()

        if (deal && deal.product) {
          processedItem.deal = deal
          processedItem.product = deal.product

          const originalPrice = deal.product.price
          let discountedPrice = originalPrice

          if (deal.discount_type === "percentage") {
            discountedPrice = originalPrice * (1 - deal.discount_value / 100)
          } else if (deal.discount_type === "fixed") {
            discountedPrice = Math.max(0, originalPrice - deal.discount_value)
          }

          processedItem.original_price = originalPrice
          processedItem.discounted_price = discountedPrice
          processedItem.discount_amount = originalPrice - discountedPrice

          originalTotal += originalPrice * item.quantity
          total += discountedPrice * item.quantity
          totalSavings += (originalPrice - discountedPrice) * item.quantity

          dealItems.push(processedItem)
        }
      } else if (item.item_type === "bundle" && item.bundle_id) {
        // Get bundle details with products
        const { data: bundle } = await supabase.from("bundles").select("*").eq("id", item.bundle_id).single()

        if (bundle) {
          // Get bundle items
          const { data: bundleItems } = await supabase
            .from("bundle_items")
            .select("*, product:product_id(*)")
            .eq("bundle_id", item.bundle_id)

          processedItem.bundle = bundle
          processedItem.bundle_items = bundleItems || []

          let originalPrice = 0
          if (bundleItems) {
            for (const bundleItem of bundleItems) {
              if (bundleItem.product) {
                originalPrice += bundleItem.product.price * bundleItem.quantity
              }
            }
          }

          let discountedPrice = originalPrice
          if (bundle.discount_type === "percentage") {
            discountedPrice = originalPrice * (1 - bundle.discount_value / 100)
          } else if (bundle.discount_type === "fixed") {
            discountedPrice = Math.max(0, originalPrice - bundle.discount_value)
          }

          processedItem.original_price = originalPrice
          processedItem.discounted_price = discountedPrice
          processedItem.discount_amount = originalPrice - discountedPrice

          originalTotal += originalPrice * item.quantity
          total += discountedPrice * item.quantity
          totalSavings += (originalPrice - discountedPrice) * item.quantity

          bundleItems.push(processedItem)
        }
      }

      processedItems.push(processedItem)
    }

    return NextResponse.json({
      items: processedItems,
      total,
      original_total: originalTotal,
      total_savings: totalSavings,
      product_items: productItems,
      deal_items: dealItems,
      bundle_items: bundleItems,
    })
  } catch (error) {
    console.error("Error in GET /api/cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await supabaseServer()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("🛒 Cart API - Received request:", JSON.stringify(body, null, 2))

    // Validate input
    const result = cartItemSchema.safeParse(body)
    if (!result.success) {
      console.error("Validation error:", result.error)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { item_type, product_id, deal_id, bundle_id, quantity } = result.data

    // Validate that the appropriate ID is provided based on item_type
    if (
      (item_type === "product" && !product_id) ||
      (item_type === "deal" && !deal_id) ||
      (item_type === "bundle" && !bundle_id)
    ) {
      return NextResponse.json({ error: `Missing ${item_type}_id for item_type: ${item_type}` }, { status: 400 })
    }

    // Process based on item_type
    let originalPrice = 0
    let discountedPrice = 0
    let discountAmount = 0

    if (item_type === "product" && product_id) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", product_id)
        .single()

      if (productError || !product) {
        console.error("Error fetching product:", productError)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      // Check stock
      if (product.stock < quantity) {
        return NextResponse.json({ error: "Not enough stock available" }, { status: 400 })
      }

      originalPrice = product.price
      discountedPrice = product.price
      discountAmount = 0
    } else if (item_type === "deal" && deal_id) {
      // Get deal details with product
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("*, product:product_id(*)")
        .eq("id", deal_id)
        .single()

      if (dealError || !deal) {
        console.error("Error fetching deal:", dealError)
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }

      // Check if deal is active
      const now = new Date()
      const startDate = new Date(deal.start_date)
      const endDate = new Date(deal.end_date)

      if (!deal.is_active || now < startDate || now > endDate) {
        return NextResponse.json({ error: "Deal is not active" }, { status: 400 })
      }

      // Check if max uses is reached
      if (deal.max_uses && deal.current_uses >= deal.max_uses) {
        return NextResponse.json({ error: "Deal maximum uses reached" }, { status: 400 })
      }

      // Check product stock
      if (deal.product && deal.product.stock < quantity) {
        return NextResponse.json({ error: "Not enough stock available" }, { status: 400 })
      }

      // Calculate price
      originalPrice = deal.product ? deal.product.price : 0
      discountedPrice = originalPrice

      if (deal.discount_type === "percentage") {
        discountedPrice = originalPrice * (1 - deal.discount_value / 100)
      } else if (deal.discount_type === "fixed") {
        discountedPrice = Math.max(0, originalPrice - deal.discount_value)
      }

      discountAmount = originalPrice - discountedPrice

      // Update deal uses
      await supabase
        .from("deals")
        .update({ current_uses: (deal.current_uses || 0) + 1 })
        .eq("id", deal_id)
    } else if (item_type === "bundle" && bundle_id) {
      // Get bundle details
      const { data: bundle, error: bundleError } = await supabase
        .from("bundles")
        .select("*")
        .eq("id", bundle_id)
        .single()

      if (bundleError || !bundle) {
        console.error("Error fetching bundle:", bundleError)
        return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
      }

      // Check if bundle is active
      const now = new Date()
      const startDate = new Date(bundle.start_date)
      const endDate = new Date(bundle.end_date)

      if (!bundle.is_active || now < startDate || now > endDate) {
        return NextResponse.json({ error: "Bundle is not active" }, { status: 400 })
      }

      // Check if max uses is reached
      if (bundle.max_uses && bundle.current_uses >= bundle.max_uses) {
        return NextResponse.json({ error: "Bundle maximum uses reached" }, { status: 400 })
      }

      // Get bundle items
      const { data: bundleItems, error: bundleItemsError } = await supabase
        .from("bundle_items")
        .select("*, product:product_id(*)")
        .eq("bundle_id", bundle_id)

      if (bundleItemsError) {
        console.error("Error fetching bundle items:", bundleItemsError)
        return NextResponse.json({ error: "Failed to fetch bundle items" }, { status: 500 })
      }

      // Check stock for all products in bundle
      for (const item of bundleItems || []) {
        if (item.product && item.product.stock < item.quantity * quantity) {
          return NextResponse.json({ error: `Not enough stock for ${item.product.name}` }, { status: 400 })
        }
      }

      // Calculate price
      originalPrice = 0
      if (bundleItems) {
        for (const item of bundleItems) {
          if (item.product) {
            originalPrice += item.product.price * item.quantity
          }
        }
      }

      discountedPrice = originalPrice
      if (bundle.discount_type === "percentage") {
        discountedPrice = originalPrice * (1 - bundle.discount_value / 100)
      } else if (bundle.discount_type === "fixed") {
        discountedPrice = Math.max(0, originalPrice - bundle.discount_value)
      }

      discountAmount = originalPrice - discountedPrice

      // Update bundle uses
      await supabase
        .from("bundles")
        .update({ current_uses: (bundle.current_uses || 0) + 1 })
        .eq("id", bundle_id)
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("item_type", item_type)
      .eq("product_id", product_id || null)
      .eq("deal_id", deal_id || null)
      .eq("bundle_id", bundle_id || null)
      .maybeSingle()

    if (existingItem) {
      // Update quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating cart item:", updateError)
        return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
      }

      return NextResponse.json(updatedItem)
    } else {
      // Insert new item
      const { data: newItem, error: insertError } = await supabase
        .from("cart_items")
        .insert({
          user_id: userId,
          item_type,
          product_id: product_id || null,
          deal_id: deal_id || null,
          bundle_id: bundle_id || null,
          quantity,
          original_price: originalPrice,
          discounted_price: discountedPrice,
          discount_amount: discountAmount,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting cart item:", insertError)
        return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
      }

      return NextResponse.json(newItem)
    }
  } catch (error) {
    console.error("Error in POST /api/cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, userId } = await supabaseServer()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Delete item
    const { error } = await supabase.from("cart_items").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("Error deleting cart item:", error)
      return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
