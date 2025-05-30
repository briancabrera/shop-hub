"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ArrowRight, Tag, Package, ShoppingBag, Gift, Clock, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart, useRemoveFromCart } from "@/hooks/use-cart"
import { useUser } from "@/hooks/use-auth"
import { useCheckout } from "@/hooks/use-checkout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import Image from "next/image"
import { Trash2 } from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const { data: user, isLoading: isUserLoading } = useUser()
  const { data: cart, isLoading: isCartLoading, error: cartError } = useCart()
  const checkoutMutation = useCheckout()
  const removeFromCartMutation = useRemoveFromCart()

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login?redirect=/cart")
    }
  }, [user, isUserLoading, router])

  const handleCheckout = async () => {
    try {
      const result = await checkoutMutation.mutateAsync()
      if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromCartMutation.mutate(itemId)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
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

  const renderCartItem = (item: any) => {
    const savings = item.discount_amount * item.quantity || 0

    return (
      <Card key={item.id} className="relative">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Item Image */}
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
              <Image
                src={item.display_image || "/placeholder.svg?height=96&width=96"}
                alt={item.display_name || "Item"}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.display_name}</h3>

                  {/* Item Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {item.item_type === "product" && (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Product
                      </Badge>
                    )}
                    {item.item_type === "deal" && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        Deal
                      </Badge>
                    )}
                    {item.item_type === "bundle" && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <Gift className="w-3 h-3 mr-1" />
                        Bundle
                      </Badge>
                    )}
                  </div>

                  {/* Deal Information */}
                  {item.item_type === "deal" && item.deal && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-red-800">{item.deal_title}</h4>
                        <div className="flex items-center text-xs text-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(item.deal.end_date)}
                        </div>
                      </div>
                      {item.deal_description && <p className="text-sm text-red-700">{item.deal_description}</p>}
                      <div className="flex items-center mt-2">
                        <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-green-600">
                          {item.deal.discount_type === "percentage"
                            ? `${item.deal.discount_value}% OFF`
                            : `$${item.deal.discount_value} OFF`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bundle Information */}
                  {item.item_type === "bundle" && item.bundle_products && (
                    <div className="mb-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">{item.bundle_title}</h4>
                      {item.bundle_description && (
                        <p className="text-sm text-purple-700 mb-2">{item.bundle_description}</p>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-purple-600 mb-1">Includes:</p>
                        {item.bundle_products.slice(0, 3).map((product: any, index: number) => (
                          <div key={index} className="flex items-center text-xs text-purple-700">
                            <div className="w-6 h-6 bg-purple-100 rounded mr-2 overflow-hidden">
                              <Image
                                src={product.image_url || "/placeholder.svg?height=24&width=24"}
                                alt={product.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>
                              {product.bundle_quantity}x {product.name} ({formatPrice(product.price)})
                            </span>
                          </div>
                        ))}
                        {item.bundle_products.length > 3 && (
                          <p className="text-xs text-purple-600">+{item.bundle_products.length - 3} more items</p>
                        )}
                      </div>
                      <div className="flex items-center mt-2">
                        <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-green-600">
                          {item.bundle.discount_type === "percentage"
                            ? `${item.bundle.discount_value}% OFF Bundle`
                            : `$${item.bundle.discount_value} OFF Bundle`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center space-x-3 mb-3">
                    {savings > 0 ? (
                      <>
                        <span className="text-xl font-bold text-green-600">{formatPrice(item.discounted_price)}</span>
                        <span className="text-lg text-gray-500 line-through">{formatPrice(item.original_price)}</span>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Save {formatPrice(item.discount_amount)}
                        </Badge>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">{formatPrice(item.original_price)}</span>
                    )}
                  </div>

                  {/* Quantity and Remove */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={removeFromCartMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-right ml-6">
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(item.discounted_price * item.quantity)}
                  </p>
                  {savings > 0 && (
                    <p className="text-sm text-gray-500 line-through">
                      {formatPrice(item.original_price * item.quantity)}
                    </p>
                  )}
                  {savings > 0 && <p className="text-sm font-medium text-green-600">Save {formatPrice(savings)}</p>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isUserLoading || isCartLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (cartError) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <ErrorBoundary
          error={cartError}
          resetErrorBoundary={() => window.location.reload()}
          message="There was an error loading your cart"
        />
      </div>
    )
  }

  const isEmpty = !cart?.items?.length

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ShoppingCart className="h-8 w-8" />
        Your Cart{" "}
        {cart?.item_count > 0 && (
          <Badge variant="outline" className="ml-2">
            {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
          </Badge>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isEmpty ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                  <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
                  <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Product Items Section */}
              {cart?.product_items?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                    <Badge variant="outline">{cart.product_items.length}</Badge>
                  </div>
                  <div className="space-y-4">{cart.product_items.map(renderCartItem)}</div>
                </div>
              )}

              {/* Deal Items Section */}
              {cart?.deal_items?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Special Deals</h2>
                    <Badge className="bg-red-100 text-red-800">{cart.deal_items.length}</Badge>
                  </div>
                  <div className="space-y-4">{cart.deal_items.map(renderCartItem)}</div>
                </div>
              )}

              {/* Bundle Items Section */}
              {cart?.bundle_items?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Bundles</h2>
                    <Badge className="bg-purple-100 text-purple-800">{cart.bundle_items.length}</Badge>
                  </div>
                  <div className="space-y-4">{cart.bundle_items.map(renderCartItem)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart?.original_total || 0)}</span>
                </div>
                {cart?.total_savings > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span className="flex items-center">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      Total Savings
                    </span>
                    <span>-{formatPrice(cart?.total_savings || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice((cart?.total || 0) * 0.08)}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>{formatPrice((cart?.total || 0) * 1.08)}</span>
                </div>
              </div>

              {cart?.total_savings > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                  <p className="flex items-center gap-2 font-medium text-green-800">
                    <Gift className="h-5 w-5" />🎉 You're saving {formatPrice(cart.total_savings)} with deals and
                    bundles!
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                disabled={isEmpty || checkoutMutation.isPending}
                onClick={handleCheckout}
              >
                {checkoutMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" /> Processing...
                  </>
                ) : (
                  <>
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/products")}>
                Continue Shopping
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
