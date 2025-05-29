// Centralized type definitions
export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
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
}

export interface CartItem {
  id: string
  quantity: number
  product?: Product
  bundle?: Bundle
  is_bundle: boolean
}

export interface Cart {
  items: CartItem[]
  total: number
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

export interface CartItemInput {
  product_id?: string
  bundle_id?: string
  quantity: number
  is_bundle?: boolean
}

export interface CheckoutInput {
  items: CartItemInput[]
  shipping_address: ShippingAddress
}

// Bundle Types
export interface Bundle {
  id: string
  name: string
  description: string
  image_url?: string
  discount_percentage: number
  bundle_price: number
  original_price: number
  status: "active" | "inactive"
  featured: boolean
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  slug: string
  products: BundleProduct[]
}

export interface BundleProduct {
  id: string
  bundle_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface BundleFilters {
  status?: string
  featured?: boolean
  active?: boolean
  page?: number
  limit?: number
}

// Form input types para bundles
export interface BundleCreateInput {
  name: string
  description: string
  image_url?: string
  discount_percentage: number
  status: "active" | "inactive"
  featured: boolean
  start_date?: string
  end_date?: string
  slug: string
  products: BundleProductInput[]
}

export interface BundleProductInput {
  product_id: string
  quantity: number
}
