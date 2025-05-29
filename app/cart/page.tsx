"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ArrowRight, Tag, Package, ShoppingBag, Gift } from "lucide-react"
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

  const renderCartItem = (item: any) => {
    let displayName = ""
    let displayImage = ""
    const displayPrice = item.discounted_price || 0
    const originalPrice = item.original_price || 0
    const savings = originalPrice - displayPrice

    switch (item.item_type) {
      case "product":
        displayName = item.product?.name || "Unknown Product"
        displayImage = item.product?.image_url || "/placeholder.svg?height=80&width=80"
        break
      case "deal":
        displayName = item.deal?.product?.name || "Unknown Product"
        displayImage = item.deal?.product?.image_url || "/placeholder.svg?height=80&width=80"
        break
      case "bundle":
        displayName = item.bundle?.title || "Unknown Bundle"
        displayImage = item.bundle?.image_url || "/placeholder.svg?height=80&width=80"
        break
    }

    return (
      <Card key={item.id} className="relative">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Item Image */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
              <Image
                src={displayImage || "/placeholder.svg"}
                alt={displayName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>

                  {/* Item Type Badge */}
                  <div className="flex items-center gap-2 mt-1">
                    {item.item_type === "product" && (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Product
                      </Badge>
                    )}
                    {item.item_type === "deal" && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        Deal: {item.deal?.title}
                      </Badge>
                    )}
                    {item.item_type === "bundle" && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <Gift className="w-3 h-3 mr-1" />
                        Bundle
                      </Badge>
                    )}
                  </div>

                  {/* Bundle Items */}
                  {item.item_type === "bundle" && item.bundle?.items && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Includes:</p>
                      <div className="space-y-1">
                        {item.bundle.items.slice(0, 3).map((bundleItem: any) => (
                          <p key={bundleItem.id} className="text-xs text-gray-600">
                            • {bundleItem.quantity}x {bundleItem.products?.name}
                          </p>
                        ))}
                        {item.bundle.items.length > 3 && (
                          <p className="text-xs text-gray-500">+{item.bundle.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mt-2 flex items-center space-x-2">
                    {savings > 0 ? (
                      <>
                        <span className="text-lg font-bold text-green-600">{formatPrice(displayPrice)}</span>
                        <span className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                        <Badge variant="secondary" className="text-xs">
                          Save {formatPrice(savings)}
                        </Badge>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">{formatPrice(displayPrice)}</span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      disabled={removeFromCartMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-right ml-4">
                  <p className="font-semibold text-gray-900">{formatPrice(displayPrice * item.quantity)}</p>
                  {savings > 0 && (
                    <p className="text-xs text-gray-500 line-through">{formatPrice(originalPrice * item.quantity)}</p>
                  )}
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
        Your Cart
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
                    <h2 className="text-lg font-semibold text-gray-900">Deals</h2>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart?.original_total || 0)}</span>
                </div>
                {cart?.total_savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span>-{formatPrice(cart?.total_savings || 0)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(cart?.total || 0)}</span>
                </div>
              </div>

              {cart?.total_savings > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-800">
                  <p className="flex items-center gap-1 font-medium">
                    <Tag className="h-4 w-4" />
                    You're saving {formatPrice(cart.total_savings)}!
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
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
                    Checkout <ArrowRight className="ml-2 h-4 w-4" />
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
