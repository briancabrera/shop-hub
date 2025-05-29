import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"
import { authenticateRequest } from "@/lib/auth/server"

// GET /api/bundles/[id] - Obtener un bundle específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bundleId = params.id

    // Comprobar si es un slug o un ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bundleId)

    const { data: bundle, error } = await supabaseAdmin
      .from("bundles")
      .select(`
        *,
        products:bundle_products(
          id,
          product_id,
          quantity,
          product:products(*)
        )
      `)
      .eq(isUUID ? "id" : "slug", bundleId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return createResponse({ error: "Bundle no encontrado" }, { status: 404 })
      }
      throw new Error(`Error al obtener bundle: ${error.message}`)
    }

    return createResponse(bundle)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/bundles/[id] - Actualizar un bundle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Autenticar y verificar permisos de administrador
    const user = await authenticateRequest(request)
    if (!user || !user.is_admin) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const bundleId = params.id
    const data = await request.json()

    // Actualizar datos básicos del bundle
    const { error: updateError } = await supabaseAdmin
      .from("bundles")
      .update({
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        discount_percentage: data.discount_percentage,
        status: data.status,
        featured: data.featured,
        start_date: data.start_date,
        end_date: data.end_date,
        slug: data.slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bundleId)

    if (updateError) {
      throw new Error(`Error al actualizar bundle: ${updateError.message}`)
    }

    // Si se proporcionan productos, actualizar los productos del bundle
    if (data.products) {
      // Eliminar productos actuales
      const { error: deleteError } = await supabaseAdmin.from("bundle_products").delete().eq("bundle_id", bundleId)

      if (deleteError) {
        throw new Error(`Error al eliminar productos del bundle: ${deleteError.message}`)
      }

      // Insertar nuevos productos
      const bundleProducts = data.products.map((product: any) => ({
        bundle_id: bundleId,
        product_id: product.product_id,
        quantity: product.quantity || 1,
      }))

      const { error: productsError } = await supabaseAdmin.from("bundle_products").insert(bundleProducts)

      if (productsError) {
        throw new Error(`Error al añadir productos al bundle: ${productsError.message}`)
      }
    }

    // Obtener el bundle actualizado
    const { data: bundle, error: fetchError } = await supabaseAdmin
      .from("bundles")
      .select(`
        *,
        products:bundle_products(
          id,
          product_id,
          quantity,
          product:products(*)
        )
      `)
      .eq("id", bundleId)
      .single()

    if (fetchError) {
      throw new Error(`Error al obtener el bundle actualizado: ${fetchError.message}`)
    }

    return createResponse(bundle)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/bundles/[id] - Eliminar un bundle
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Autenticar y verificar permisos de administrador
    const user = await authenticateRequest(request)
    if (!user || !user.is_admin) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const bundleId = params.id

    // Eliminar bundle (los productos relacionados se eliminarán por la restricción ON DELETE CASCADE)
    const { error } = await supabaseAdmin.from("bundles").delete().eq("id", bundleId)

    if (error) {
      throw new Error(`Error al eliminar bundle: ${error.message}`)
    }

    return createResponse({ success: true, message: "Bundle eliminado correctamente" })
  } catch (error) {
    return handleApiError(error)
  }
}
