import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"

interface SiteHeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function SiteHeader({ className, ...props }: SiteHeaderProps) {
  const { cart } = useCart()
  const itemCount = cart.item_count || 0

  return (
    <header className={cn("bg-background sticky top-0 z-40 w-full border-b", className)} {...props}>
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">Acme</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cart">Cart ({itemCount})</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
