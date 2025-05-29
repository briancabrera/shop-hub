"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, Tag, Gift, Clock, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCart, useRemoveFromCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { CartItem } from "@/types"

export default function CartPage() {
  const { data: cartData, isLoading, error, refetch } = useCart()
  const removeFromCartMutation = useRemoveFromCart()
  const { toast } = useToast()
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      setUpdatingItemId(itemId)
      await new Promise((resolve) => setTimeout(resolve, 500))
      await refetch()

      toast({
        title: "Cart updated",
        description: "Item quantity has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      })
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromCartMutation.mutate(itemId)
  }

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h left`
    }

    return `${hours}h ${minutes}m left`
  }

  const renderCartItem = (item: CartItem) => (
    <Card key={item.id} className="relative">
      {/* Deal/Bundle Badge */}
      {item.deal && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
            <Tag className="w-3 h-3 mr-1" />
            Deal
          </Badge>
        </div>
      )}
      {item.bundle && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Gift className="w-3 h-3 mr-1" />
            Bundle
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
            <Image
              src={item.product.image_url || "/placeholder.svg?height=80&width=80&query=product"}
              alt={item.product.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>

            {/* Deal Information */}
            {item.deal && (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-red-600 font-medium">{item.deal.title}</p>
                <div className="flex items-center text-xs text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimeRemaining(item.deal.end_date)}
                </div>
              </div>
            )}

            {/* Bundle Information */}
            {item.bundle && (
              <div className="mt-1">
                <p className="text-sm text-purple-600 font-medium">{item.bundle.title}</p>
                <p className="text-xs text-gray-500">Part of bundle deal</p>
              </div>
            )}

            {/* Pricing */}
            <div className="mt-2 flex items-center space-x-2">
              {item.discount_amount > 0 ? (
                <>
                  <span className="text-lg font-bold text-green-600">${item.discounted_price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 line-through">${item.original_price.toFixed(2)}</span>
                  <Badge variant="secondary" className="text-xs">
                    Save ${item.discount_amount.toFixed(2)}
                  </Badge>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">${item.original_price.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || updatingItemId === item.id}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-12 text-center font-medium">{updatingItemId === item.id ? "..." : item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={updatingItemId === item.id}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Total Price and Remove */}
          <div className="text-right">
            <p className="font-semibold text-gray-900">${(item.discounted_price * item.quantity).toFixed(2)}</p>
            {item.discount_amount > 0 && (
              <p className="text-xs text-gray-500 line-through">${(item.original_price * item.quantity).toFixed(2)}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id)}
              className="text-red-600 hover:text-red-700 mt-2"
              disabled={removeFromCartMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !cartData?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild size="lg">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { items, total, original_total, total_savings, deal_items, bundle_items, regular_items } = cartData

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Items Section */}
          {deal_items.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <Tag className="w-5 h-5 text-red-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Deal Items</h2>
                <Badge className="ml-2 bg-red-100 text-red-800">{deal_items.length}</Badge>
              </div>
              <div className="space-y-4">{deal_items.map(renderCartItem)}</div>
            </div>
          )}

          {/* Bundle Items Section */}
          {bundle_items.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <Gift className="w-5 h-5 text-purple-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Bundle Items</h2>
                <Badge className="ml-2 bg-purple-100 text-purple-800">{bundle_items.length}</Badge>
              </div>
              <div className="space-y-4">{bundle_items.map(renderCartItem)}</div>
            </div>
          )}

          {/* Regular Items Section */}
          {regular_items.length > 0 && (
            <div>
              {(deal_items.length > 0 || bundle_items.length > 0) && (
                <>
                  <Separator className="my-6" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Regular Items</h2>
                </>
              )}
              <div className="space-y-4">{regular_items.map(renderCartItem)}</div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${original_total.toFixed(2)}</span>
              </div>

              {total_savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Savings
                  </span>
                  <span>-${total_savings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(total * 0.08).toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${(total * 1.08).toFixed(2)}</span>
              </div>

              {total_savings > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🎉 You're saving ${total_savings.toFixed(2)} with deals and bundles!
                  </p>
                </div>
              )}

              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
