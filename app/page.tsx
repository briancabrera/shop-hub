import { HeroSection } from "@/components/home/hero-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { DealsSection } from "@/components/deals/deals-section"

export default function HomePage() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <DealsSection />
      <FeaturedProducts />
    </div>
  )
}
