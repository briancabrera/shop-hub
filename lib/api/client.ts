import type { Product, ProductFilters, PaginatedResponse, Cart, CartItemInput, User, ApiResponse } from "@/types"
import { supabaseClient } from "@/lib/supabase/client"

class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    } catch {
      return {}
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: ApiResponse<T> = await response.json()

      if (!data.success) {
        throw new Error(data.error || "API request failed")
      }

      return data.data
    } catch (error) {
      console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, error)
      throw error
    }
  }

  // Products API
  products = {
    getAll: (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
      const params = new URLSearchParams()

      if (filters?.categories?.length) {
        params.set("categories", filters.categories.join(","))
      } else if (filters?.category) {
        params.set("category", filters.category)
      }

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && key !== "categories" && key !== "category") {
          params.set(key, String(value))
        }
      })

      const query = params.toString()
      return this.request(`/api/products${query ? `?${query}` : ""}`)
    },

    getById: (id: string): Promise<Product> => this.request(`/api/products/${id}`),
  }

  // Cart API
  cart = {
    get: (): Promise<Cart> => this.request("/api/cart"),

    add: (item: CartItemInput): Promise<void> =>
      this.request("/api/cart", {
        method: "POST",
        body: JSON.stringify(item),
      }),

    remove: (itemId: string): Promise<void> =>
      this.request(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      }),

    clear: (): Promise<void> =>
      this.request("/api/cart", {
        method: "DELETE",
      }),
  }

  // User API
  user = {
    getCurrent: (): Promise<User | null> => this.request("/api/user"),
  }
}

export const apiClient = new ApiClient()
