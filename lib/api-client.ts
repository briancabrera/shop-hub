import type {
  ApiResponse,
  ProductCreateInput,
  ProductFilters,
  CartItem,
  CheckoutInput,
  UserSignupInput,
  UserLoginInput,
  PaginatedResponse,
  Product,
  SearchFilters,
  SearchResponse,
} from "@/types/api"
import type { Category } from "@/hooks/use-categories"
import { supabaseClient } from "@/lib/db-client"

class ApiClient {
  private baseURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Get auth token from Supabase client if available
    let authHeaders = {}
    if (typeof window !== "undefined") {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()
        if (session?.access_token) {
          authHeaders = {
            Authorization: `Bearer ${session.access_token}`,
          }
        }
      } catch (error) {
        console.warn("Failed to get auth token:", error)
      }
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log(`API Request: ${options.method || "GET"} ${url}`)
      const response = await fetch(url, config)

      // Special handling for specific endpoints that should return null/empty on error
      const isUserEndpoint = endpoint.startsWith("/api/user")
      const isCartEndpoint = endpoint.startsWith("/api/cart")

      // Handle non-JSON responses
      let data: ApiResponse<T>
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)

        // Return appropriate fallback for specific endpoints
        if (isCartEndpoint) {
          return { items: [], total: 0 } as unknown as T
        }
        if (isUserEndpoint) {
          return null as unknown as T
        }

        throw new Error(`Invalid response format`)
      }

      if (!response.ok) {
        console.warn(`API Error: ${response.status} ${response.statusText} for ${endpoint}`)

        // Handle authentication errors specifically
        if (response.status === 401) {
          console.warn("Authentication failed for:", endpoint)

          // Return appropriate fallback for specific endpoints
          if (isCartEndpoint) {
            return { items: [], total: 0 } as unknown as T
          }
          if (isUserEndpoint) {
            return null as unknown as T
          }

          throw new Error("Authentication required")
        }

        // Return appropriate fallback for specific endpoints on any error
        if (isCartEndpoint) {
          return { items: [], total: 0 } as unknown as T
        }
        if (isUserEndpoint) {
          return null as unknown as T
        }

        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        console.warn(`API request failed: ${data.error || "Unknown error"} for ${endpoint}`)

        // Return appropriate fallback for specific endpoints
        if (isCartEndpoint) {
          return { items: [], total: 0 } as unknown as T
        }
        if (isUserEndpoint) {
          return null as unknown as T
        }

        throw new Error(data.error || "API request failed")
      }

      return data.data as T
    } catch (error) {
      console.error("API request failed:", {
        url,
        method: options.method,
        error: error instanceof Error ? error.message : error,
      })

      // Return appropriate fallback for specific endpoints
      if (isCartEndpoint) {
        console.warn("Returning empty cart due to error")
        return { items: [], total: 0 } as unknown as T
      }
      if (isUserEndpoint) {
        console.warn("Returning null user due to error")
        return null as unknown as T
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error - please check your connection")
      }

      throw error
    }
  }

  // Products API
  products = {
    getAll: (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
      const params = new URLSearchParams()

      // Handle multiple categories
      if (filters?.categories && filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","))
      } else if (filters?.category) {
        params.append("category", filters.category)
      }

      if (filters?.minPrice !== undefined) params.append("minPrice", filters.minPrice.toString())
      if (filters?.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString())
      if (filters?.minRating !== undefined) params.append("minRating", filters.minRating.toString())
      if (filters?.sort) params.append("sort", filters.sort)
      if (filters?.page !== undefined) params.append("page", filters.page.toString())
      if (filters?.limit !== undefined) params.append("limit", filters.limit.toString())
      if (filters?.search) params.append("q", filters.search)

      const query = params.toString()
      console.log("API Client: Making request with query:", query)
      return this.request(`/api/products${query ? `?${query}` : ""}`)
    },

    getById: (id: string) => this.request(`/api/products/${id}`),

    create: (data: ProductCreateInput) =>
      this.request("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  }

  // Search API
  search = {
    products: (filters: SearchFilters): Promise<SearchResponse> => {
      const params = new URLSearchParams()
      params.append("q", filters.query)

      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.categories && filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","))
      }

      const query = params.toString()
      console.log("API Client: Search request:", query)
      return this.request(`/api/search?${query}`)
    },
  }

  // Cart API
  cart = {
    get: () => this.request("/api/cart"),

    add: (item: CartItem) =>
      this.request("/api/cart", {
        method: "POST",
        body: JSON.stringify(item),
      }),

    remove: (itemId?: string) =>
      this.request(`/api/cart${itemId ? `?itemId=${itemId}` : ""}`, {
        method: "DELETE",
      }),

    clear: () =>
      this.request("/api/cart", {
        method: "DELETE",
      }),
  }

  // Checkout API
  checkout = {
    create: (data: CheckoutInput) =>
      this.request("/api/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  }

  // Orders API
  orders = {
    getAll: () => this.request("/api/orders"),

    create: (sessionId: string) =>
      this.request("/api/orders", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      }),
  }

  // Auth API
  auth = {
    signup: (data: UserSignupInput) =>
      this.request("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: UserLoginInput) =>
      this.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  }

  // User API
  user = {
    getCurrent: () => this.request("/api/user"),
  }

  // Categories API
  categories = {
    getAll: (): Promise<Category[]> => this.request("/api/categories"),
  }
}

export const apiClient = new ApiClient()
