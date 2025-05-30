"use client"
import { useCart } from "@/hooks/use-cart"

const CartPage = () => {
  const { cart, updateQuantity, removeItem, isLoading } = useCart()

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
    } else {
      updateQuantity({ id, quantity })
    }
  }

  const handleRemoveItem = (id: string) => {
    removeItem(id)
  }

  if (isLoading) {
    return <div>Loading cart...</div>
  }

  if (!cart || cart.length === 0) {
    return <div>Your cart is empty.</div>
  }

  return (
    <div>
      <h1>Shopping Cart</h1>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            {item.name} - Quantity:
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value))}
            />
            <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: ${cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>
    </div>
  )
}

export default CartPage
