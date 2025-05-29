"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRemoveFromCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CartItemProps {
  item: any
}

export function CartItem({ item }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const removeFromCart = useRemoveFromCart()

  const handleRemove = () => {
    removeFromCart.mutate(item.id)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const hasDeal = !!item.deal
  const hasBundle = !!item.bundle
  const discountAmount = item.discount_amount || 0
  const originalPrice = item.original_price || item.product?.price || 0
  const discountedPrice = item.discounted_price || item.product?.price || 0
  const savings = originalPrice - discountedPrice

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b">
      {/* Product Image */}
      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={item.product?.image_url || "/placeholder.svg?height=80&width=80"}
          alt={item.product?.name || "Product"}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Product Info */}
      <div className="flex-grow space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
          <div className="flex items-center gap-2">
            {hasDeal && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {item.deal.title}
              </Badge>
            )}
            {hasBundle && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {item.bundle.title}
              </Badge>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          {hasDeal || hasBundle ? (
            <>
              <span className="font-semibold text-green-600">{formatPrice(discountedPrice)}</span>
              <span className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</span>
              <span className="text-xs text-green-600">
                (Save {formatPrice(savings)} - {Math.round((savings / originalPrice) * 100)}% off)
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(originalPrice)}</span>
          )}
        </div>

        {/* Deal/Bundle Description */}
        {(hasDeal || hasBundle) && (
          <p className="text-xs text-gray-500">
            {hasDeal
              ? item.deal.description || `${item.deal.discount_value}% off special deal`
              : item.bundle.description || "Bundle special pricing"}
          </p>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Qty: {quantity}</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={handleRemove}
                  disabled={removeFromCart.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove from cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
