import Link from "next/link"
import { useShoppingCart } from "use-shopping-cart"

const Navbar = () => {
  const { cartDetails, cartCount, formattedTotalPrice, clearCart, removeItem, totalPrice, cart } = useShoppingCart()

  return (
    <nav className="bg-white py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          My Store
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            Home
          </Link>
          <Link href="/products" className="text-gray-600 hover:text-gray-800">
            Products
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-800">
            About
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-800">
            Contact
          </Link>

          <Link href="/cart" className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600 hover:text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2.7M5 5.9l-.4-2.7M7 13a2 2 0 00-4 0H3a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H5m7 5a2 2 0 104 0m-4-5a2 2 0 104 0m-9 5a2 2 0 012-2h6a2 2 0 012 2"
              />
            </svg>
            {cart?.item_count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.item_count > 99 ? "99+" : cart.item_count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
