import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  image_url: z.string().url().optional(),
  stock: z.number().int().nonnegative("Stock must be non-negative"),
  category: z.string().optional(),
})

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
})

export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
})

export const cartItemsSchema = z.array(cartItemSchema)

export const shippingAddressSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
})

export const checkoutSchema = z.object({
  items: cartItemsSchema,
  shipping_address: shippingAddressSchema,
})

export const userSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
})

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})
