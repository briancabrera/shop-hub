// Centralized type definitions
export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

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
  items?: BundleItem[]
  original_price?: number
  discounted_price?: number
  savings?: number
}

export interface BundleItem {
  id: string
  bundle_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
  category: string
  rating?: number
  created_at: string
  updated_at: string
  deal?: Deal
  has_deal?: boolean
  discounted_price?: number
  savings?: number
}

export interface CartItem {
  id: string
  quantity: number
  product: Product
  deal_id?: string
  bundle_id?: string
  original_price: number
  discounted_price: number
  discount_amount: number
  deal?: Deal
  bundle?: Bundle
}

export interface Cart {
  items: CartItem[]
  total: number
  original_total: number
  total_savings: number
  deal_items: CartItem[]
  bundle_items: CartItem[]
  regular_items: CartItem[]
}

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: string
  shipping_address: ShippingAddress
  created_at: string
  updated_at: string
  stripe_session_id?: string
}

export interface ShippingAddress {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface ProductFilters {
  category?: string
  categories?: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: string
  page?: number
  limit?: number
  search?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

// Form input types
export interface UserSignupInput {
  email: string
  password: string
  full_name: string
}

export interface UserLoginInput {
  email: string
  password: string
}

// Definición de CartItemInput
export interface CartItemInput {
  product_id: string
  quantity: number
  deal_id?: string | null
  bundle_id?: string | null
}

export interface CheckoutInput {
  items: CartItemInput[]
  shipping_address: ShippingAddress
}
