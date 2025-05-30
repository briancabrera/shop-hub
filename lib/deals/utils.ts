import type { Deal, Bundle } from "@/types/deals"

export function isValidDeal(deal: Deal): boolean {
  const now = new Date()
  const startDate = new Date(deal.start_date)
  const endDate = new Date(deal.end_date)

  return (
    deal.is_active &&
    now >= startDate &&
    now <= endDate &&
    (deal.max_uses === null || deal.current_uses < deal.max_uses)
  )
}

export function isValidBundle(bundle: Bundle): boolean {
  const now = new Date()
  const startDate = new Date(bundle.start_date)
  const endDate = new Date(bundle.end_date)

  return (
    bundle.is_active &&
    now >= startDate &&
    now <= endDate &&
    (bundle.max_uses === null || bundle.current_uses < bundle.max_uses)
  )
}

export function calculateDealPrice(originalPrice: number, deal: Deal): number {
  if (!isValidDeal(deal)) return originalPrice

  if (deal.discount_type === "percentage") {
    return originalPrice * (1 - deal.discount_value / 100)
  } else {
    return Math.max(0, originalPrice - deal.discount_value)
  }
}

export function calculateBundlePrice(originalPrice: number, bundle: Bundle): number {
  if (!isValidBundle(bundle)) return originalPrice

  if (bundle.discount_type === "percentage") {
    return originalPrice * (1 - bundle.discount_value / 100)
  } else {
    return Math.max(0, originalPrice - bundle.discount_value)
  }
}

export function formatTimeRemaining(endDate: string): string {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return "Expired"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function getDiscountBadgeColor(discountType: string, discountValue: number): string {
  if (discountType === "percentage") {
    if (discountValue >= 50) return "bg-red-500"
    if (discountValue >= 30) return "bg-orange-500"
    if (discountValue >= 20) return "bg-yellow-500"
    return "bg-green-500"
  } else {
    if (discountValue >= 100) return "bg-red-500"
    if (discountValue >= 50) return "bg-orange-500"
    if (discountValue >= 25) return "bg-yellow-500"
    return "bg-green-500"
  }
}
