"use client"

import type React from "react"
import type { Deal } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface DealCardProps {
  deal: Deal
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const { addItem, isAddingItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      deal_id: deal.id,
      quantity: 1,
    })
  }

  return (
    <div className="border rounded-md p-4">
      <Image
        src={deal.image_url || "/placeholder.svg?height=300&width=300"}
        alt={deal.title || "Deal"}
        width={300}
        height={300}
        className="object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold">{deal.title}</h3>
      <p className="text-gray-600">{deal.description}</p>
      <p className="text-green-500 font-bold">{formatCurrency(deal.price || 0)}</p>
      <Button onClick={handleAddToCart} disabled={isAddingItem} className="mt-4">
        {isAddingItem ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  )
}

export default DealCard
