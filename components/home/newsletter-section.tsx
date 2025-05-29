import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  return (
    <section className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated with Our Latest Deals</h2>
          <p className="text-lg text-gray-600 mb-8">
            Subscribe to our newsletter and never miss out on exclusive offers and new arrivals.
          </p>

          <div className="max-w-md mx-auto flex gap-4">
            <Input type="email" placeholder="Enter your email address" className="flex-1" />
            <Button>Subscribe</Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  )
}
