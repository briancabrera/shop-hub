import { z } from "zod"

export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  deal_id: z.string().uuid().optional(),
  bundle_id: z.string().uuid().optional(),
})

export const userSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
})

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const shippingAddressSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
})

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema),
  shipping_address: shippingAddressSchema,
})
