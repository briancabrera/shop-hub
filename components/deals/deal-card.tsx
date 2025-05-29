"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Tag, Zap } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Deal } from "@/types/deals"
import { calculateDealPrice, formatTimeRemaining, getDiscountBadgeColor, isValidDeal } from "@/lib/deals/utils"

interface DealCardProps {
  deal: Deal
  onAddToCart?: (productId: string) => void
}

export function DealCard({ deal, onAddToCart }: DealCardProps) {
  const isValid = isValidDeal(deal)
  const originalPrice = deal.product?.price || 0
  const discountedPrice = calculateDealPrice(originalPrice, deal)
  const savings = originalPrice - discountedPrice
  const timeRemaining = formatTimeRemaining(deal.end_date)
  const badgeColor = getDiscountBadgeColor(deal.discount_type, deal.discount_value)

  if (!deal.product) return null

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${!isValid ? "opacity-60" : ""}`}
    >
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={`${badgeColor} text-white font-bold`}>
          <Tag className="w-3 h-3 mr-1" />
          {deal.discount_type === "percentage" ? `${deal.discount_value}% OFF` : `$${deal.discount_value} OFF`}
        </Badge>
      </div>

      {/* Flash Sale Indicator */}
      {isValid && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            DEAL
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={deal.product.image_url || "/placeholder.svg?height=300&width=300&query=product"}
            alt={deal.product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {!isValid && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg font-bold">
                EXPIRED
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{deal.title}</h3>

          {deal.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{deal.description}</p>}

          {/* Price Section */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
              <span className="text-lg text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
            </div>
            <div className="text-sm text-green-600 font-medium">You save ${savings.toFixed(2)}</div>
          </div>

          {/* Time Remaining */}
          {isValid && (
            <div className="flex items-center gap-1 text-sm text-orange-600 mb-3">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{timeRemaining} left</span>
            </div>
          )}

          {/* Usage Limit */}
          {deal.max_uses && (
            <div className="text-xs text-muted-foreground mb-3">
              {deal.max_uses - deal.current_uses} of {deal.max_uses} remaining
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1" disabled={!isValid}>
            <Link href={`/products/${deal.product.id}`}>View Details</Link>
          </Button>

          {onAddToCart && (
            <Button
              onClick={() => onAddToCart(deal.id)}
              className="flex-1"
              disabled={!isValid || deal.product.stock === 0}
            >
              {deal.product.stock === 0 ? "Out of Stock" : "Add Deal to Cart"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
