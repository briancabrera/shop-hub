import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"
import { authenticateRequest } from "@/lib/auth/server"

// GET /api/cart - Obtener el carrito del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    // Obtener los items del carrito con detalles de productos y bundles
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id, 
        quantity, 
        is_bundle,
        product:products(*),
        bundle:bundles(
          *,
          products:bundle_products(
            id,
            product_id,
            quantity,
            product:products(*)
          )
        )
      `)
      .eq("user_id", user.id)

    if (cartError) {
      throw new Error(`Error al obtener el carrito: ${cartError.message}`)
    }

    // Calcular el total del carrito
    let cartTotal = 0

    // Procesar los items del carrito para el cálculo correcto del total
    const processedItems = cartItems.map((item) => {
      if (item.is_bundle && item.bundle) {
        // Si es un bundle, usar el precio con descuento
        cartTotal += item.bundle.bundle.price
      } else if (item.product) {
        // Si es un producto individual, usar el precio del producto
        cartTotal += item.product.price * item.quantity
      }
      return item
    })

    return createResponse({ cartItems: processedItems, cartTotal }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
