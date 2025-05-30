"use client"

import { createContext, useContext, type ReactNode } from "react"

type CartContextType = {}

const CartContext = createContext<CartContextType>({})

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartContext.Provider value={{}}>{children}</CartContext.Provider>
}

export const useCartContext = () => useContext(CartContext)
