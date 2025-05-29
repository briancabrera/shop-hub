import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    const { data: deal, error } = await supabase
      .from("deals")
      .select(`
        *,
        product:products(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching deal:", error)
      return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: deal,
    })
  } catch (error) {
    console.error("Error in deal API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
