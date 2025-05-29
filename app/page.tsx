import { HeroSection } from "@/components/hero/hero-section"
import { FeaturedProducts } from "@/components/products/featured-products"
import { DealsSection } from "@/components/deals/deals-section"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <HeroSection />
      <DealsSection />
      <FeaturedProducts />
    </main>
  )
}
