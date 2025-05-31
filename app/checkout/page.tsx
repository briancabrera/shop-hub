"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useCheckout } from "@/hooks/use-checkout"
import { useAuth } from "@/hooks/use-auth"
import { CreditCard, Wallet, ArrowLeft, Loader2 } from "lucide-react"

export default function CheckoutPage() {
  const { data: cartData, isLoading: cartLoading } = useCart()
  const checkoutMutation = useCheckout()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState("card")
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent("/checkout")}`)
    }
  }, [authLoading, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent("/checkout")}`)
      return
    }

    if (!cartData?.items?.length) {
      alert("Your cart is empty")
      return
    }

    const formData = new FormData(e.target as HTMLFormElement)

    // Validate required fields
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const state = formData.get("state") as string
    const zipCode = formData.get("zipCode") as string

    if (!firstName || !lastName || !email || !address || !city || !state || !zipCode) {
      alert("Please fill in all required fields")
      return
    }

    // Map cart items to checkout format with safe property access
    const checkoutItems = cartData.items
      .map((item) => {
        // Handle different possible data structures
        const productId = item.product?.id || item.product_id || item.id
        const quantity = item.quantity || 1

        if (!productId) {
          console.warn("Item missing product ID:", item)
          return null
        }

        return {
          product_id: productId,
          quantity: quantity,
        }
      })
      .filter(Boolean) // Remove null items

    if (!checkoutItems.length) {
      alert("No valid items found in cart")
      return
    }

    const checkoutData = {
      items: checkoutItems,
      shipping_address: {
        full_name: `${firstName} ${lastName}`,
        address_line1: address,
        city: city,
        state: state,
        postal_code: zipCode,
        country: "US",
      },
    }

    console.log("Submitting checkout data:", checkoutData)
    checkoutMutation.mutate(checkoutData)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price || 0)
  }

  const getItemName = (item: any) => {
    return item.product?.name || item.name || item.display_name || "Unknown Item"
  }

  const getItemPrice = (item: any) => {
    return item.product?.price || item.price || item.discounted_price || item.original_price || 0
  }

  const getItemQuantity = (item: any) => {
    return item.quantity || 1
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect will happen via useEffect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cartData?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
          <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.push("/cart")} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* User info banner */}
      {user && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Logged in as:</strong> {user.email}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      required
                      placeholder="Enter your first name"
                      defaultValue={user?.full_name?.split(" ")[0] || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      required
                      placeholder="Enter your last name"
                      defaultValue={user?.full_name?.split(" ")[1] || ""}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter your email address"
                    defaultValue={user?.email || ""}
                    readOnly={!!user?.email}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" name="address" required placeholder="Enter your street address" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" name="city" required placeholder="City" />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" name="state" required placeholder="State" />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input id="zipCode" name="zipCode" required placeholder="ZIP" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method (Demo)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="w-5 h-5" />
                    <Label htmlFor="card" className="flex-1">
                      Credit/Debit Card (Demo)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Wallet className="w-5 h-5" />
                    <Label htmlFor="paypal" className="flex-1">
                      PayPal (Demo)
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      This is a demo payment form. No real payment will be processed.
                    </p>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="4242 4242 4242 4242"
                        defaultValue="4242 4242 4242 4242"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="12/25" defaultValue="12/25" disabled />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" defaultValue="123" disabled />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      PayPal payment simulation. You will be redirected to a demo confirmation page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartData?.items?.map((item, index) => {
                    if (!item) {
                      console.warn(`Cart item at index ${index} is undefined`)
                      return null
                    }

                    const itemName = getItemName(item)
                    const itemPrice = getItemPrice(item)
                    const itemQuantity = getItemQuantity(item)

                    return (
                      <div key={item.id || index} className="flex justify-between">
                        <div>
                          <p className="font-medium">{itemName}</p>
                          <p className="text-sm text-gray-600">Qty: {itemQuantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(itemPrice * itemQuantity)}</p>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartData?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice((cartData?.total || 0) * 0.08)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice((cartData?.total || 0) * 1.08)}</span>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🎭 This is a demo checkout. No real payment will be processed.
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={checkoutMutation.isPending}>
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Demo Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
