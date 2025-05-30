"use client"

import type React from "react"
import type { Deal } from "@/types"
import { useCart } from "@/hooks/use-cart"

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
      <h3 className="text-lg font-semibold">{deal.title}</h3>
      <p className="text-gray-600">{deal.description}</p>
      <p className="text-green-500 font-bold">${deal.price}</p>
      <button
        onClick={handleAddToCart}
        disabled={isAddingItem}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:opacity-50"
      >
        {isAddingItem ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  )
}

export default DealCard
