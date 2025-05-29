import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"
import { authenticateRequest } from "@/lib/auth/server"
import type { BundleFilters, BundleCreateInput } from "@/types"

// GET /api/bundles - Obtener todos los bundles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: BundleFilters = {
      status: searchParams.get("status") || undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      active: searchParams.get("active") === "true" ? true : undefined,
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12)),
    }

    const offset = (filters.page! - 1) * filters.limit!

    // Construir la consulta base para contar
    let countQuery = supabaseAdmin.from("bundles").select("*", { count: "exact", head: true })

    // Construir la consulta para los datos
    let dataQuery = supabaseAdmin.from("bundles").select(`
        *,
        products:bundle_products(
          id,
          product_id,
          quantity,
          product:products(*)
        )
      `)

    // Aplicar filtros
    if (filters.status) {
      countQuery = countQuery.eq("status", filters.status)
      dataQuery = dataQuery.eq("status", filters.status)
    }

    if (filters.featured !== undefined) {
      countQuery = countQuery.eq("featured", filters.featured)
      dataQuery = dataQuery.eq("featured", filters.featured)
    }

    if (filters.active) {
      const now = new Date().toISOString()
      countQuery = countQuery
        .eq("status", "active")
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)

      dataQuery = dataQuery
        .eq("status", "active")
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
    }

    // Aplicar ordenamiento y paginación
    dataQuery = dataQuery
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + filters.limit! - 1)

    // Ejecutar consultas
    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery])

    if (countError || dataError) {
      throw new Error(countError?.message || dataError?.message || "Error al consultar bundles")
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / filters.limit!)

    return createResponse({
      data: data || [],
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: totalCount,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/bundles - Crear un nuevo bundle
export async function POST(request: NextRequest) {
  try {
    // Autenticar y verificar permisos de administrador
    const user = await authenticateRequest(request)
    if (!user || !user.is_admin) {
      return createResponse({ error: "Unauthorized" }, { status: 401 })
    }

    // Obtener y validar datos
    const data = (await request.json()) as BundleCreateInput

    // Validar datos básicos
    if (!data.name || !data.description || data.discount_percentage < 0 || data.discount_percentage > 100) {
      return createResponse({ error: "Datos inválidos" }, { status: 400 })
    }

    // Validar productos
    if (!data.products || data.products.length === 0) {
      return createResponse({ error: "El bundle debe contener al menos un producto" }, { status: 400 })
    }

    // Crear transacción para insertar bundle y sus productos
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from("bundles")
      .insert({
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        discount_percentage: data.discount_percentage,
        status: data.status || "active",
        featured: data.featured || false,
        start_date: data.start_date,
        end_date: data.end_date,
        slug: data.slug,
        // bundle_price y original_price se calcularán automáticamente con el trigger
        bundle_price: 0,
        original_price: 0,
      })
      .select("id")
      .single()

    if (bundleError) {
      throw new Error(`Error al crear bundle: ${bundleError.message}`)
    }

    // Insertar productos del bundle
    const bundleProducts = data.products.map((product) => ({
      bundle_id: bundle.id,
      product_id: product.product_id,
      quantity: product.quantity || 1,
    }))

    const { error: productsError } = await supabaseAdmin.from("bundle_products").insert(bundleProducts)

    if (productsError) {
      throw new Error(`Error al añadir productos al bundle: ${productsError.message}`)
    }

    // Obtener el bundle completo
    const { data: completeBundle, error: fetchError } = await supabaseAdmin
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
      .eq("id", bundle.id)
      .single()

    if (fetchError) {
      throw new Error(`Error al obtener el bundle creado: ${fetchError.message}`)
    }

    return createResponse(completeBundle, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
