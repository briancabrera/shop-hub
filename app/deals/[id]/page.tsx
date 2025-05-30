import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DealDetails } from "@/components/deals/deal-details"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { createServerClient } from "@/lib/supabase/server"

interface DealPageProps {
  params: {
    id: string
  }
}

async function getDeal(id: string) {
  const supabase = createServerClient()

  const { data: deal, error } = await supabase
    .from("deals")
    .select(`
      *,
      product:products(*)
    `)
    .eq("id", id)
    .single()

  if (error || !deal) {
    return null
  }

  return deal
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const deal = await getDeal(params.id)

  if (!deal) {
    return {
      title: "Deal Not Found",
    }
  }

  const savings = deal.discount_type === "percentage" ? `${deal.discount_value}% OFF` : `$${deal.discount_value} OFF`

  return {
    title: `${deal.title} - ${savings}`,
    description: deal.description || `Special offer on ${deal.product?.name}`,
    openGraph: {
      title: deal.title,
      description: deal.description || `Get ${savings} on ${deal.product?.name}`,
      images: deal.product?.image_url ? [deal.product.image_url] : [],
    },
  }
}

export default async function DealPage({ params }: DealPageProps) {
  const deal = await getDeal(params.id)

  if (!deal) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <DealDetails deal={deal} />
      </Suspense>
    </div>
  )
}
