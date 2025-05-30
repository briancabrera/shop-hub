"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star, ShoppingBag, Truck, Shield } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillrule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="space-y-8 text-white">
            {/* Badge */}
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-2 text-sm">
              ✨ New Collection Available
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Shop
                <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                  {" "}Smart
                </span>
                <br />
                Save More
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 max-w-lg">
                Discover amazing products with exclusive deals, bundles, and lightning-fast delivery.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-400" />
                <span>50K+ Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>Free Shipping</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 font-semibold px-8 py-4 text-lg group"
              >
                <Link href="/products" className="flex items-center gap-2">
                  Start Shopping
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-purple-900 font-semibold px-8 py-4 text-lg"
              >
                <Link href="/deals">View Deals</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4 pt-4">
              <Shield className="w-6 h-6 text-green-400" />
              <span className="text-sm text-purple-100">Secure payments • 30-day returns • 24/7 support</span>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            {/* Main Product Image */}
            <div className="relative z-10">
              <img
                src="/placeholder.svg?height=600&width=500"
                alt="Shopping Hero"
                className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl"
              />
            </div>

            {/* Floating Product Cards */}
            <div className="absolute top-10 -left-4 bg-white rounded-xl p-4 shadow-xl animate-float z-20">
              <div className="flex items-center gap-3">
                <img
                  src="/placeholder.svg?height=50&width=50"
                  alt="Product"
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Wireless Headphones</p>
                  <p className="text-green-600 font-bold text-sm">$99.99</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-20 -right-4 bg-white rounded-xl p-4 shadow-xl animate-float-delayed z-20">
              <div className="flex items-center gap-3">
                <img
                  src="/placeholder.svg?height=50&width=50"
                  alt="Product"
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Smart Watch</p>
                  <p className="text-green-600 font-bold text-sm">$199.99</p>
                </div>
              </div>
            </div>

            {/* Discount Badge */}
            <div className="absolute top-1/2 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-sm shadow-xl animate-pulse z-20">
              UP TO<br />50% OFF
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </section>
  )
}
