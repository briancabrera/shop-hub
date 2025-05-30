import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShoppingBag, Truck, CreditCard, Clock } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] opacity-10 bg-repeat"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium text-sm mb-4">
                🎉 Summer Sale | Up to 50% Off
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Shop Smarter, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
                  Live Better
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Discover amazing products at unbeatable prices. Join thousands of happy customers shopping with Shoppero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
              >
                <Link href="/products" className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Shop Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                <Link href="/deals" className="flex items-center gap-2">
                  Explore Deals
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white p-2 rounded-2xl shadow-xl">
              <img
                src="/placeholder.svg?height=600&width=600"
                alt="Shopping experience"
                className="w-full h-auto rounded-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-gray-100">
                <div className="bg-green-500 rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Trusted by</p>
                  <p className="text-orange-600 font-bold">10,000+ customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
