"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ArrowRight, Tag, Package, ShoppingBag, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CartItem } from "@/components/cart/cart-item"
import { useCart } from "@/hooks/use-cart"
import { useUser } from "@/hooks/use-auth"
import { useCheckout } from "@/hooks/use-checkout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function CartPage() {
  const router = useRouter()
  const { data: user, isLoading: isUserLoading } = useUser()
  const { data: cart, isLoading: isCartLoading, error: cartError } = useCart()
  const checkoutMutation = useCheckout()

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

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
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({cart?.items?.length})</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {/* Deal Items Section */}
                {cart?.deal_items?.length > 0 && (
                  <div className="mb-4 pb-2">
                    <div className="flex items-center gap-2 mb-2 text-red-600">
                      <Tag className="h-5 w-5" />
                      <h3 className="font-medium">Deal Items</h3>
                    </div>
                    <div className="space-y-1">
                      {cart.deal_items.map((item) => (
                        <CartItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bundle Items Section */}
                {cart?.bundle_items?.length > 0 && (
                  <div className="mb-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <Package className="h-5 w-5" />
                      <h3 className="font-medium">Bundle Items</h3>
                    </div>
                    <div className="space-y-1">
                      {cart.bundle_items.map((item) => (
                        <CartItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Items Section */}
                {cart?.regular_items?.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                      <ShoppingBag className="h-5 w-5" />
                      <h3 className="font-medium">Regular Items</h3>
                    </div>
                    <div className="space-y-1">
                      {cart.regular_items.map((item) => (
                        <CartItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State (shouldn't happen but just in case) */}
                {cart?.items?.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No items in your cart</p>
                  </div>
                )}
              </CardContent>
            </Card>
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

              {cart?.items?.length > 0 && cart?.items?.some((item) => !item.product?.stock) && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-800">
                  <p className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Some items in your cart are out of stock
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                disabled={isEmpty || checkoutMutation.isPending || cart?.items?.some((item) => !item.product?.stock)}
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
