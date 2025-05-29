export interface ProductCreateInput {
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
  category?: string
}

export interface ProductFilters {
  category?: string // For backward compatibility
  categories?: string[] // New: support multiple categories
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: string // New: sorting option
  page?: number // New: pagination
  limit?: number // New: pagination
  search?: string // New: search functionality
}

export interface SearchFilters {
  query: string
  limit?: number
  categories?: string[]
}

export interface SearchResult {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  rating?: number
  // Highlight information for search results
  highlight?: {
    name?: string
    description?: string
  }
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  suggestions?: string[]
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
  category?: string
  rating?: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  product_id: string
  quantity: number
}

export interface CartItemWithProduct {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url?: string
  }
}

export interface CheckoutInput {
  items: CartItem[]
  shipping_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export interface UserSignupInput {
  email: string
  password: string
  full_name: string
}

export interface UserLoginInput {
  email: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
