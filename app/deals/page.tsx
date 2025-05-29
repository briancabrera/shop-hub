import type { Metadata } from "next"
import { DealsSection } from "@/components/deals/deals-section"

export const metadata: Metadata = {
  title: "Deals & Bundles | E-commerce",
  description:
    "Discover amazing deals and exclusive bundles. Save big on your favorite products with limited-time offers.",
}

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DealsSection />
    </div>
  )
}
