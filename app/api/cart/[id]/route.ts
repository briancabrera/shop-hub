import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"
import { authenticateRequest } from "@/lib/auth/server"

// PUT /api/cart/[id] - Actualizar cantidad de un item en el carrito
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const itemId = params.id
    const { quantity } = await request.json()

    // Validar cantidad
    if (quantity <= 0) {
      return createResponse({ error: "La cantidad debe ser mayor a 0" }, { status: 400 })
    }

    // Verificar que el item existe y pertenece al usuario
    const { data: item, error: itemError } = await supabaseAdmin
      .from("cart_items")
      .select("id, product_id, bundle_id, is_bundle")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .single()

    if (itemError) {
      if (itemError.code === "PGRST116") {
        return createResponse({ error: "Item no encontrado" }, { status: 404 })
      }
      throw new Error(`Error al verificar item: ${itemError.message}`)
    }

    // Si es un producto, verificar stock
    if (!item.is_bundle && item.product_id) {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (productError) {
        throw new Error(`Error al verificar stock: ${productError.message}`)
      }

      if (product.stock < quantity) {
        return createResponse({ error: "Stock insuficiente" }, { status: 400 })
      }
    }

    // Actualizar cantidad
    const { error: updateError } = await supabaseAdmin.from("cart_items").update({ quantity }).eq("id", itemId)

    if (updateError) {
      throw new Error(`Error al actualizar item: ${updateError.message}`)
    }

    // Obtener el carrito actualizado
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
      throw new Error(`Error al obtener el carrito actualizado: ${cartError.message}`)
    }

    // Calcular el total del carrito
    let cartTotal = 0
    cartItems.forEach((item) => {
      if (item.is_bundle && item.bundle) {
        cartTotal += item.bundle.bundle_price * item.quantity
      } else if (!item.is_bundle && item.product) {
        cartTotal += item.product.price * item.quantity
      }
    })

    return createResponse({
      items: cartItems,
      total: cartTotal,
      itemCount: cartItems.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/cart/[id] - Eliminar un item del carrito
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const itemId = params.id

    // Eliminar item
    const { error: deleteError } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id)

    if (deleteError) {
      throw new Error(`Error al eliminar item: ${deleteError.message}`)
    }

    // Obtener el carrito actualizado
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
      throw new Error(`Error al obtener el carrito actualizado: ${cartError.message}`)
    }

    // Calcular el total del carrito
    let cartTotal = 0
    cartItems?.forEach((item) => {
      if (item.is_bundle && item.bundle) {
        cartTotal += item.bundle.bundle_price * item.quantity
      } else if (!item.is_bundle && item.product) {
        cartTotal += item.product.price * item.quantity
      }
    })

    return createResponse({
      items: cartItems || [],
      total: cartTotal,
      itemCount: (cartItems || []).reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
