import { z } from "zod"

export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  deal_id: z.string().uuid().optional().nullable(),
  bundle_id: z.string().uuid().optional().nullable(),
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
