"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Package, Users, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabaseAdmin } from "@/lib/db"

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: any[]
  topProducts: any[]
  categoryStats: any[]
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch products count and top products
        const { data: products, count: productsCount } = await supabaseAdmin
          .from("products")
          .select("*", { count: "exact" })
          .order("rating", { ascending: false })
          .limit(5)

        // Fetch orders count and recent orders
        const { data: orders, count: ordersCount } = await supabaseAdmin
          .from("orders")
          .select(
            `
            *,
            order_items (
              quantity,
              price,
              products (name, image_url)
            )
          `,
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .limit(10)

        // Fetch users count
        const { count: usersCount } = await supabaseAdmin
          .from("cart_items")
          .select("user_id", { count: "exact", head: true })

        // Calculate total revenue
        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

        // Get category statistics
        const { data: categoryStats } = await supabaseAdmin
          .from("products")
          .select("category")
          .then(({ data }) => {
            const stats = data?.reduce(
              (acc, product) => {
                acc[product.category] = (acc[product.category] || 0) + 1
                return acc
              },
              {} as Record<string, number>,
            )

            return {
              data: Object.entries(stats || {}).map(([category, count]) => ({
                category,
                count,
              })),
            }
          })

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue,
          recentOrders: orders || [],
          topProducts: products || [],
          categoryStats: categoryStats || [],
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Debes iniciar sesión para acceder al dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/login")} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de E-commerce</h1>
          <p className="text-muted-foreground">Bienvenido, {user.email}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin Panel
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Órdenes procesadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Con items en carrito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">En ventas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Órdenes Recientes</TabsTrigger>
          <TabsTrigger value="products">Productos Top</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes Recientes</CardTitle>
              <CardDescription>Las últimas 10 órdenes procesadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Orden #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </p>
                      <Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${Number(order.total_amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{order.order_items?.length || 0} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Mejor Valorados</CardTitle>
              <CardDescription>Top 5 productos por rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <Badge variant="outline">★ {product.rating}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${Number(product.price).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categorías</CardTitle>
              <CardDescription>Número de productos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.categoryStats.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{category.category.replace("-", " ")}</p>
                    </div>
                    <Badge variant="secondary">{category.count} productos</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
