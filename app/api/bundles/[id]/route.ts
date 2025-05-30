import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    const { data: bundle, error } = await supabase
      .from("bundles")
      .select(`
        *,
        items:bundle_items(
          *,
          product:products(*)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching bundle:", error)
      return NextResponse.json({ success: false, error: "Bundle not found" }, { status: 404 })
    }

    // Calculate bundle pricing
    const originalPrice =
      bundle.items?.reduce((total: number, item: any) => {
        return total + (item.product?.price || 0) * item.quantity
      }, 0) || 0

    const discountedPrice =
      bundle.discount_type === "percentage"
        ? originalPrice * (1 - bundle.discount_value / 100)
        : Math.max(0, originalPrice - bundle.discount_value)

    const bundleWithPricing = {
      ...bundle,
      original_price: originalPrice,
      discounted_price: discountedPrice,
    }

    return NextResponse.json({
      success: true,
      data: bundleWithPricing,
    })
  } catch (error) {
    console.error("Error in bundle API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
