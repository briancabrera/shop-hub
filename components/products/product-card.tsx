"use client"

import type React from "react"
import type { Product as ProductType, Deal } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Image from "next/image"
import { Button } from "../ui/button"
import { useCart } from "@/hooks/use-cart"

interface ProductCardProps {
  product?: ProductType
  deal?: Deal
}

const ProductCard: React.FC<ProductCardProps> = ({ product, deal }) => {
  const { addItem, isAddingItem } = useCart()

  const handleAddToCart = () => {
    if (deal) {
      addItem({
        deal_id: deal.id,
        quantity: 1,
      })
    } else {
      addItem({
        product_id: product.id,
        quantity: 1,
      })
    }
  }

  if (deal) {
    return (
      <div className="border rounded-md p-4">
        <Image
          src={deal.image_url || "/placeholder.svg"}
          alt={deal.name}
          width={300}
          height={300}
          className="object-cover rounded-md mb-4"
        />
        <h3 className="text-lg font-semibold">{deal.name}</h3>
        <p className="text-gray-500">{deal.description}</p>
        <p className="text-xl font-bold">{formatCurrency(deal.price)}</p>
        <Button onClick={handleAddToCart} disabled={isAddingItem}>
          Add to Cart
        </Button>
      </div>
    )
  }

  if (product) {
    return (
      <div className="border rounded-md p-4">
        <Image
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          width={300}
          height={300}
          className="object-cover rounded-md mb-4"
        />
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-500">{product.description}</p>
        <p className="text-xl font-bold">{formatCurrency(product.price)}</p>
        <Button onClick={handleAddToCart} disabled={isAddingItem}>
          Add to Cart
        </Button>
      </div>
    )
  }

  return null
}

export default ProductCard
