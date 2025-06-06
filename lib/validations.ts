import { z } from "zod"

export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  deal_id: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  bundle_id: z.string().uuid().optional().or(z.literal("")).or(z.null()),
})

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  search: z.string().optional(),
  sort: z.enum(["name", "price", "rating", "created_at", "deals-first"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Schema for checkout API
export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().uuid("Invalid product ID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    }),
  ),
  shipping_address: z.object({
    full_name: z.string().min(1, "Full name is required"),
    address_line1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postal_code: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
})
