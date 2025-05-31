"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OrderDetails {
  id: string
  total_amount: number
  status: string
  created_at: string
  shipping_address: any
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const orderNumber = orderId ? `ORD-${orderId.slice(-8).toUpperCase()}` : "ORD-DEMO123"

  useEffect(() => {
    if (orderId) {
      // Simulate fetching order details
      setTimeout(() => {
        setOrderDetails({
          id: orderId,
          total_amount: 299.99,
          status: "completed",
          created_at: new Date().toISOString(),
          shipping_address: {
            full_name: "Demo User",
            address_line1: "123 Demo Street",
            city: "Demo City",
            state: "DC",
            postal_code: "12345",
          },
        })
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your demo purchase. Your simulated order has been successfully placed.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Order Number:</span>
            <span className="font-mono">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className="text-green-600 font-medium">Confirmed (Demo)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total Amount:</span>
            <span className="font-semibold">${orderDetails?.total_amount?.toFixed(2) || "299.99"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Payment Method:</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Demo Card ****4242
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Estimated Delivery:</span>
            <span>3-5 business days (simulated)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Tracking:</span>
            <span className="text-blue-600">Available within 24 hours</span>
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-2">Shipping Address:</p>
            <div className="text-sm text-gray-600">
              <p>{orderDetails?.shipping_address?.full_name || "Demo User"}</p>
              <p>{orderDetails?.shipping_address?.address_line1 || "123 Demo Street"}</p>
              <p>
                {orderDetails?.shipping_address?.city || "Demo City"}, {orderDetails?.shipping_address?.state || "DC"}{" "}
                {orderDetails?.shipping_address?.postal_code || "12345"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-blue-800 text-sm">
          🎭 <strong>Demo Mode:</strong> This is a simulated order confirmation. No real payment was processed and no
          products will be shipped.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/dashboard">View Orders</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
