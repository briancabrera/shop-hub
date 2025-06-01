"use client"

import { ProductCard } from "@/components/products/product-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { ProductWithDeal } from "@/types"

interface ProductGridProps {
  products: ProductWithDeal[]
  className?: string
}

export function ProductGrid({ products, className = "" }: ProductGridProps) {
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

  // Determine grid columns based on screen size
  const gridCols = isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3 xl:grid-cols-4"

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
