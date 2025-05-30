import { HeroSection } from "@/components/home/hero-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { DealsSection } from "@/components/deals/deals-section"
import { CategoryGrid } from "@/components/home/category-grid"

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <DealsSection />
      <FeaturedProducts />
      <CategoryGrid />
    </div>
  )
}
