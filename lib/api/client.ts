import type { CartItemInput } from "@/types"
import { supabaseClient } from "@/lib/supabase/client"

class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_APP_URL || ""

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    } catch (error) {
      console.error("Error getting auth headers:", error)
      return {}
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
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

      console.log(
        `API Request: ${options.method || "GET"} ${endpoint}`,
        options.method === "POST" ? "with payload" : "",
      )

      const response = await fetch(url, config)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, response.status, errorText)

        let errorMessage = `HTTP Error ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If not JSON, use text as is
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, error)
      throw error
    }
  }

  // Cart API
  cart = {
    get: async () => {
      return this.request("/api/cart")
    },

    add: async (item: CartItemInput) => {
      console.log("Adding to cart:", item)
      return this.request("/api/cart", {
        method: "POST",
        body: JSON.stringify(item),
      })
    },

    remove: async (itemId: string) => {
      return this.request(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })
    },

    clear: async () => {
      return this.request("/api/cart", {
        method: "DELETE",
      })
    },
  }

  // Other API methods...
}

export const apiClient = new ApiClient()
