"use client"

import type React from "react"
import type { Bundle } from "@/types"
import { useCart } from "@/hooks/use-cart"

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
      <h3 className="text-lg font-semibold">{bundle.name}</h3>
      <p className="text-gray-600">{bundle.description}</p>
      <p className="text-xl font-bold">${bundle.price}</p>
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

export default BundleCard
