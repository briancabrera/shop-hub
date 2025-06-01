import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { CartProvider } from "@/components/providers/cart-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/providers/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shoppero - Modern E-commerce Platform",
  description: "Discover amazing products at great prices",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
