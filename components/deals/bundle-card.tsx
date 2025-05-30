"use client"

import type React from "react"
import type { Bundle } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface BundleCardProps {
  bundle: Bundle
}

const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
  const { addItem, isAddingItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      bundle_id: bundle.id,
      quantity: 1,
    })
  }

  return (
    <div className="border rounded-md p-4">
      <Image
        src={bundle.image_url || "/placeholder.svg?height=300&width=300"}
        alt={bundle.name || "Bundle"}
        width={300}
        height={300}
        className="object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold">{bundle.name || bundle.title}</h3>
      <p className="text-gray-600">{bundle.description}</p>
      <p className="text-xl font-bold">{formatCurrency(bundle.price || 0)}</p>
      <Button onClick={handleAddToCart} disabled={isAddingItem} className="mt-4">
        {isAddingItem ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  )
}

export default BundleCard
