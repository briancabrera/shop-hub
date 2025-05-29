export interface Deal {
  id: string
  product_id: string
  title: string
  description?: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses?: number
  current_uses: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface Bundle {
  id: string
  title: string
  description?: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses?: number
  current_uses: number
  image_url?: string
  created_at: string
  updated_at: string
  items?: BundleItem[]
  original_price?: number
  discounted_price?: number
}

export interface BundleItem {
  id: string
  bundle_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface DealFilters {
  category?: string
  discount_type?: "percentage" | "fixed"
  min_discount?: number
  max_discount?: number
  active_only?: boolean
}

export interface BundleFilters {
  discount_type?: "percentage" | "fixed"
  min_discount?: number
  max_discount?: number
  active_only?: boolean
}

import type { Product } from "@/types"
