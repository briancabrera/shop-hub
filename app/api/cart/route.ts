import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const cartItemSchema = z.object({
  item_type: z.enum(["product", "deal", "bundle"]),
  product_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  bundle_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive(),
})

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth error:", error)
      return null
    }

    return session?.user || null
  } catch (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
}

export async function GET() {
  try {
    console.log("🛒 Cart API GET - Starting request")

    const user = await getAuthenticatedUser()
    console.log("🛒 Cart API GET - User:", user?.id || "No user")

    if (!user) {
      console.log("🛒 Cart API GET - No authenticated user, returning empty cart")
      return NextResponse.json(
        {
          items: [],
          total: 0,
          original_total: 0,
          total_savings: 0,
          product_items: [],
          deal_items: [],
          bundle_items: [],
        },
        { status: 200 },
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (cartError) {
      console.error("Error fetching cart items:", cartError)
      return NextResponse.json({ error: "Failed to fetch cart items" }, { status: 500 })
    }

    console.log("🛒 Cart API GET - Found cart items:", cartItems?.length || 0)

    // Process cart items based on item_type
    const processedItems = []
    let total = 0
    let originalTotal = 0
    const productItems = []
    const dealItems = []
    const bundleItems = []

    for (const item of cartItems || []) {
      console.log(`🛒 Processing ${item.item_type} item:`, item.id)

      try {
        // Process based on item_type
        if (item.item_type === "product" && item.product_id) {
          console.log("🛒 Fetching product data for:", item.product_id)

          // Get product details
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", item.product_id)
            .single()

          if (productError) {
            console.error("Error fetching product:", productError)
            continue
          }

          if (product) {
            const processedItem = {
              ...item,
              product: product,
              display_name: product.name,
              display_image: product.image_url,
              original_price: Number(product.price) || 0,
              discounted_price: Number(product.price) || 0,
              discount_amount: 0,
            }

            const itemTotal = (Number(product.price) || 0) * item.quantity
            originalTotal += itemTotal
            total += itemTotal

            productItems.push(processedItem)
            processedItems.push(processedItem)

            console.log("🛒 Product processed:", product.name, "Price:", product.price)
          }
        } else if (item.item_type === "deal" && item.deal_id) {
          console.log("🛒 Fetching deal data for:", item.deal_id)

          // Get deal details with product
          const { data: deal, error: dealError } = await supabase
            .from("deals")
            .select(`
              *,
              products (*)
            `)
            .eq("id", item.deal_id)
            .single()

          if (dealError) {
            console.error("Error fetching deal:", dealError)
            continue
          }

          if (deal && deal.products) {
            const originalPrice = Number(deal.products.price) || 0
            let discountedPrice = originalPrice

            if (deal.discount_type === "percentage") {
              discountedPrice = originalPrice * (1 - (Number(deal.discount_value) || 0) / 100)
            } else if (deal.discount_type === "fixed") {
              discountedPrice = Math.max(0, originalPrice - (Number(deal.discount_value) || 0))
            }

            const processedItem = {
              ...item,
              deal: deal,
              product: deal.products, // Product info for compatibility
              display_name: deal.products.name,
              display_image: deal.products.image_url,
              deal_title: deal.title,
              deal_description: deal.description,
              original_price: originalPrice,
              discounted_price: discountedPrice,
              discount_amount: originalPrice - discountedPrice,
            }

            const itemOriginalTotal = originalPrice * item.quantity
            const itemDiscountedTotal = discountedPrice * item.quantity

            originalTotal += itemOriginalTotal
            total += itemDiscountedTotal

            dealItems.push(processedItem)
            processedItems.push(processedItem)

            console.log("🛒 Deal processed:", deal.title, "Original:", originalPrice, "Discounted:", discountedPrice)
          }
        } else if (item.item_type === "bundle" && item.bundle_id) {
          console.log("🛒 Fetching bundle data for:", item.bundle_id)

          // Get bundle details
          const { data: bundle, error: bundleError } = await supabase
            .from("bundles")
            .select("*")
            .eq("id", item.bundle_id)
            .single()

          if (bundleError) {
            console.error("Error fetching bundle:", bundleError)
            continue
          }

          if (bundle) {
            // Get bundle items with products
            const { data: bundleItemsData, error: bundleItemsError } = await supabase
              .from("bundle_items")
              .select(`
                *,
                products (*)
              `)
              .eq("bundle_id", item.bundle_id)

            if (bundleItemsError) {
              console.error("Error fetching bundle items:", bundleItemsError)
              continue
            }

            let originalPrice = 0
            const bundleProducts = []

            if (bundleItemsData) {
              for (const bundleItem of bundleItemsData) {
                if (bundleItem.products) {
                  const itemPrice = (Number(bundleItem.products.price) || 0) * bundleItem.quantity
                  originalPrice += itemPrice

                  bundleProducts.push({
                    ...bundleItem.products,
                    bundle_quantity: bundleItem.quantity,
                    total_price: itemPrice,
                  })
                }
              }
            }

            let discountedPrice = originalPrice
            if (bundle.discount_type === "percentage") {
              discountedPrice = originalPrice * (1 - (Number(bundle.discount_value) || 0) / 100)
            } else if (bundle.discount_type === "fixed") {
              discountedPrice = Math.max(0, originalPrice - (Number(bundle.discount_value) || 0))
            }

            const processedItem = {
              ...item,
              bundle: bundle,
              bundle_products: bundleProducts,
              display_name: bundle.title,
              display_image: bundle.image_url || bundleProducts[0]?.image_url,
              bundle_title: bundle.title,
              bundle_description: bundle.description,
              original_price: originalPrice,
              discounted_price: discountedPrice,
              discount_amount: originalPrice - discountedPrice,
            }

            const itemOriginalTotal = originalPrice * item.quantity
            const itemDiscountedTotal = discountedPrice * item.quantity

            originalTotal += itemOriginalTotal
            total += itemDiscountedTotal

            bundleItems.push(processedItem)
            processedItems.push(processedItem)

            console.log(
              "🛒 Bundle processed:",
              bundle.title,
              "Products:",
              bundleProducts.length,
              "Original:",
              originalPrice,
              "Discounted:",
              discountedPrice,
            )
          }
        }
      } catch (error) {
        console.error("Error processing cart item:", error)
        // Continue processing other items
      }
    }

    const totalSavings = originalTotal - total

    console.log("🛒 Cart totals:", {
      total: Math.round(total * 100) / 100,
      originalTotal: Math.round(originalTotal * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      productItems: productItems.length,
      dealItems: dealItems.length,
      bundleItems: bundleItems.length,
    })

    return NextResponse.json({
      items: processedItems,
      total: Math.round(total * 100) / 100,
      original_total: Math.round(originalTotal * 100) / 100,
      total_savings: Math.round(totalSavings * 100) / 100,
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
    console.log("🛒 Cart API POST - Starting request")

    const user = await getAuthenticatedUser()
    console.log("🛒 Cart API POST - User:", user?.id || "No user")

    if (!user) {
      console.log("🛒 Cart API POST - No authenticated user")
      return NextResponse.json({ error: "Please sign in to add items to your cart" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const body = await request.json()
    console.log("🛒 Cart API POST - Request body:", JSON.stringify(body, null, 2))

    // Validate input
    const result = cartItemSchema.safeParse(body)
    if (!result.success) {
      console.error("🛒 Cart API POST - Validation error:", result.error)
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 })
    }

    const { item_type, product_id, deal_id, bundle_id, quantity } = result.data

    // Normalize undefined/null values to actual null
    const normalizedProductId = product_id || null
    const normalizedDealId = deal_id || null
    const normalizedBundleId = bundle_id || null

    console.log("🛒 Cart API POST - Normalized data:", {
      item_type,
      product_id: normalizedProductId,
      deal_id: normalizedDealId,
      bundle_id: normalizedBundleId,
      quantity,
    })

    // Validate that the appropriate ID is provided based on item_type
    if (
      (item_type === "product" && !normalizedProductId) ||
      (item_type === "deal" && !normalizedDealId) ||
      (item_type === "bundle" && !normalizedBundleId)
    ) {
      console.error("🛒 Cart API POST - Missing ID for item type:", item_type)
      return NextResponse.json({ error: `Missing ${item_type}_id for item_type: ${item_type}` }, { status: 400 })
    }

    // Process based on item_type
    let originalPrice = 0
    let discountedPrice = 0
    let discountAmount = 0

    if (item_type === "product" && normalizedProductId) {
      console.log("🛒 Cart API POST - Processing product:", normalizedProductId)

      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", normalizedProductId)
        .single()

      if (productError) {
        console.error("🛒 Cart API POST - Error fetching product:", productError)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      if (!product) {
        console.error("🛒 Cart API POST - Product not found")
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      console.log("🛒 Cart API POST - Product found:", product.name)

      // Check stock
      if (product.stock < quantity) {
        console.error("🛒 Cart API POST - Not enough stock")
        return NextResponse.json({ error: "Not enough stock available" }, { status: 400 })
      }

      originalPrice = Number(product.price) || 0
      discountedPrice = Number(product.price) || 0
      discountAmount = 0

      console.log("🛒 Cart API POST - Product pricing:", { originalPrice, discountedPrice, discountAmount })
    } else if (item_type === "deal" && normalizedDealId) {
      console.log("🛒 Cart API POST - Processing deal:", normalizedDealId)

      // Get deal details with product
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select(`
          *,
          products (*)
        `)
        .eq("id", normalizedDealId)
        .single()

      if (dealError) {
        console.error("🛒 Cart API POST - Error fetching deal:", dealError)
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }

      if (!deal) {
        console.error("🛒 Cart API POST - Deal not found")
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }

      console.log("🛒 Cart API POST - Deal found:", deal.title)

      // Check if deal is active
      const now = new Date()
      const startDate = new Date(deal.start_date)
      const endDate = new Date(deal.end_date)

      if (!deal.is_active || now < startDate || now > endDate) {
        console.error("🛒 Cart API POST - Deal is not active")
        return NextResponse.json({ error: "Deal is not active" }, { status: 400 })
      }

      // Check if max uses is reached
      if (deal.max_uses && deal.current_uses >= deal.max_uses) {
        console.error("🛒 Cart API POST - Deal max uses reached")
        return NextResponse.json({ error: "Deal maximum uses reached" }, { status: 400 })
      }

      // Check product stock
      if (deal.products && deal.products.stock < quantity) {
        console.error("🛒 Cart API POST - Not enough stock for deal product")
        return NextResponse.json({ error: "Not enough stock available" }, { status: 400 })
      }

      // Calculate price
      originalPrice = deal.products ? Number(deal.products.price) || 0 : 0
      discountedPrice = originalPrice

      if (deal.discount_type === "percentage") {
        discountedPrice = originalPrice * (1 - (Number(deal.discount_value) || 0) / 100)
      } else if (deal.discount_type === "fixed") {
        discountedPrice = Math.max(0, originalPrice - (Number(deal.discount_value) || 0))
      }

      discountAmount = originalPrice - discountedPrice

      console.log("🛒 Cart API POST - Deal pricing:", { originalPrice, discountedPrice, discountAmount })

      // Update deal uses
      const { error: updateError } = await supabase
        .from("deals")
        .update({ current_uses: (deal.current_uses || 0) + 1 })
        .eq("id", normalizedDealId)

      if (updateError) {
        console.error("🛒 Cart API POST - Error updating deal uses:", updateError)
      }
    } else if (item_type === "bundle" && normalizedBundleId) {
      console.log("🛒 Cart API POST - Processing bundle:", normalizedBundleId)

      // Get bundle details
      const { data: bundle, error: bundleError } = await supabase
        .from("bundles")
        .select("*")
        .eq("id", normalizedBundleId)
        .single()

      if (bundleError) {
        console.error("🛒 Cart API POST - Error fetching bundle:", bundleError)
        return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
      }

      if (!bundle) {
        console.error("🛒 Cart API POST - Bundle not found")
        return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
      }

      console.log("🛒 Cart API POST - Bundle found:", bundle.title)

      // Check if bundle is active
      const now = new Date()
      const startDate = new Date(bundle.start_date)
      const endDate = new Date(bundle.end_date)

      if (!bundle.is_active || now < startDate || now > endDate) {
        console.error("🛒 Cart API POST - Bundle is not active")
        return NextResponse.json({ error: "Bundle is not active" }, { status: 400 })
      }

      // Check if max uses is reached
      if (bundle.max_uses && bundle.current_uses >= bundle.max_uses) {
        console.error("🛒 Cart API POST - Bundle max uses reached")
        return NextResponse.json({ error: "Bundle maximum uses reached" }, { status: 400 })
      }

      // Get bundle items
      const { data: bundleItemsData, error: bundleItemsError } = await supabase
        .from("bundle_items")
        .select(`
          *,
          products (*)
        `)
        .eq("bundle_id", normalizedBundleId)

      if (bundleItemsError) {
        console.error("🛒 Cart API POST - Error fetching bundle items:", bundleItemsError)
        return NextResponse.json({ error: "Failed to fetch bundle items" }, { status: 500 })
      }

      // Check stock for all products in bundle
      for (const item of bundleItemsData || []) {
        if (item.products && item.products.stock < item.quantity * quantity) {
          console.error("🛒 Cart API POST - Not enough stock for bundle item:", item.products.name)
          return NextResponse.json({ error: `Not enough stock for ${item.products.name}` }, { status: 400 })
        }
      }

      // Calculate price
      originalPrice = 0
      if (bundleItemsData) {
        for (const item of bundleItemsData) {
          if (item.products) {
            originalPrice += (Number(item.products.price) || 0) * item.quantity
          }
        }
      }

      discountedPrice = originalPrice
      if (bundle.discount_type === "percentage") {
        discountedPrice = originalPrice * (1 - (Number(bundle.discount_value) || 0) / 100)
      } else if (bundle.discount_type === "fixed") {
        discountedPrice = Math.max(0, originalPrice - (Number(bundle.discount_value) || 0))
      }

      discountAmount = originalPrice - discountedPrice

      console.log("🛒 Cart API POST - Bundle pricing:", { originalPrice, discountedPrice, discountAmount })

      // Update bundle uses
      const { error: updateError } = await supabase
        .from("bundles")
        .update({ current_uses: (bundle.current_uses || 0) + 1 })
        .eq("id", normalizedBundleId)

      if (updateError) {
        console.error("🛒 Cart API POST - Error updating bundle uses:", updateError)
      }
    }

    // Check if item already exists in cart
    console.log("🛒 Cart API POST - Checking for existing item")

    // Build the query step by step to handle null values properly
    let existingItemQuery = supabase.from("cart_items").select("*").eq("user_id", user.id).eq("item_type", item_type)

    // Handle null values properly for PostgreSQL
    if (normalizedProductId) {
      existingItemQuery = existingItemQuery.eq("product_id", normalizedProductId)
    } else {
      existingItemQuery = existingItemQuery.is("product_id", null)
    }

    if (normalizedDealId) {
      existingItemQuery = existingItemQuery.eq("deal_id", normalizedDealId)
    } else {
      existingItemQuery = existingItemQuery.is("deal_id", null)
    }

    if (normalizedBundleId) {
      existingItemQuery = existingItemQuery.eq("bundle_id", normalizedBundleId)
    } else {
      existingItemQuery = existingItemQuery.is("bundle_id", null)
    }

    const { data: existingItem, error: existingError } = await existingItemQuery.maybeSingle()

    if (existingError) {
      console.error("🛒 Cart API POST - Error checking existing item:", existingError)
      return NextResponse.json({ error: "Error checking existing cart item" }, { status: 500 })
    }

    if (existingItem) {
      console.log("🛒 Cart API POST - Updating existing item")

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
        console.error("🛒 Cart API POST - Error updating cart item:", updateError)
        return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
      }

      console.log("🛒 Cart API POST - Item updated successfully")
      return NextResponse.json({ success: true, data: updatedItem })
    } else {
      console.log("🛒 Cart API POST - Creating new item")

      // Insert new item
      const insertData = {
        user_id: user.id,
        item_type,
        product_id: normalizedProductId,
        deal_id: normalizedDealId,
        bundle_id: normalizedBundleId,
        quantity,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_amount: discountAmount,
      }

      console.log("🛒 Cart API POST - Insert data:", JSON.stringify(insertData, null, 2))

      const { data: newItem, error: insertError } = await supabase
        .from("cart_items")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("🛒 Cart API POST - Error inserting cart item:", insertError)
        return NextResponse.json({ error: "Failed to add item to cart", details: insertError }, { status: 500 })
      }

      console.log("🛒 Cart API POST - Item created successfully")
      return NextResponse.json({ success: true, data: newItem })
    }
  } catch (error) {
    console.error("🛒 Cart API POST - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Delete item
    const { error } = await supabase.from("cart_items").delete().eq("id", id).eq("user_id", user.id)

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
