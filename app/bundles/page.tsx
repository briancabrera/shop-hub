import type { Metadata } from "next"
import { BundlesDisplay } from "@/components/bundles/bundles-display"

export const metadata: Metadata = {
  title: "Special Deals & Bundles | Ecommerce Store",
  description: "Discover our exclusive bundles and special deals with incredible savings up to 40% off!",
}

export default function BundlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Special Deals & Bundles</h1>
          <p className="text-xl text-gray-600">Explore our handpicked collections with exclusive discounts</p>
        </div>

        <BundlesDisplay />
      </div>
    </div>
  )
}
