"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SearchBar } from "@/components/search/search-bar"
import { useCart } from "@/hooks/use-cart"
import { useUser, useLogout } from "@/hooks/use-auth"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: userData, isLoading: userLoading } = useUser()
  const logoutMutation = useLogout()

  const itemCount = cart?.item_count || 0

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Shoppero</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-orange-600 transition-colors">
              Products
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-orange-600 transition-colors relative">
              🔥 Deals
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-2 h-2 animate-pulse"></span>
            </Link>
          </nav>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchBar className="w-full" />
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {!cartLoading && itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-orange-500">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!userLoading && userData ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                      {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup">Sign Up</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-4">
              <div className="px-2">
                <SearchBar className="w-full" onResultClick={closeMobileMenu} />
              </div>
              <Link
                href="/products"
                className="text-gray-700 hover:text-orange-600 transition-colors px-2 py-1"
                onClick={closeMobileMenu}
              >
                Products
              </Link>
              <Link
                href="/deals"
                className="text-gray-700 hover:text-orange-600 transition-colors px-2 py-1 relative"
                onClick={closeMobileMenu}
              >
                🔥 Deals
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-2 h-2 animate-pulse"></span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
