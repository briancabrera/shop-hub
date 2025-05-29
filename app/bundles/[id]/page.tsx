import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BundleDetails } from "@/components/deals/bundle-details"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { createServerClient } from "@/lib/supabase/server"

interface BundlePageProps {
  params: {
    id: string
  }
}

async function getBundle(id: string) {
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
    .eq("id", id)
    .single()

  if (error || !bundle) {
    return null
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

  return {
    ...bundle,
    original_price: originalPrice,
    discounted_price: discountedPrice,
  }
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const bundle = await getBundle(params.id)

  if (!bundle) {
    return {
      title: "Bundle Not Found",
    }
  }

  const savings =
    bundle.discount_type === "percentage" ? `${bundle.discount_value}% OFF` : `$${bundle.discount_value} OFF`

  return {
    title: `${bundle.title} - ${savings}`,
    description: bundle.description || `Special bundle offer with ${savings}`,
    openGraph: {
      title: bundle.title,
      description: bundle.description || `Get ${savings} on this amazing bundle`,
      images: bundle.image_url ? [bundle.image_url] : [],
    },
  }
}

export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getBundle(params.id)

  if (!bundle) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <BundleDetails bundle={bundle} />
      </Suspense>
    </div>
  )
}
