"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { supabaseAdmin } from "@/lib/db"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock: number
  category: string
  rating: number
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const categories = ["electronics", "clothing", "home-garden", "sports", "books"]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (product: Partial<Product>) => {
    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabaseAdmin.from("products").update(product).eq("id", editingProduct.id)

        if (error) throw error
        toast.success("Producto actualizado exitosamente")
      } else {
        // Create new product
        const { error } = await supabaseAdmin.from("products").insert([product])

        if (error) throw error
        toast.success("Producto creado exitosamente")
      }

      setEditingProduct(null)
      setShowAddForm(false)
      fetchProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Error al guardar producto")
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return

    try {
      const { error } = await supabaseAdmin.from("products").delete().eq("id", productId)

      if (error) throw error
      toast.success("Producto eliminado exitosamente")
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Error al eliminar producto")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando productos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Productos</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      {(showAddForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={() => {
            setEditingProduct(null)
            setShowAddForm(false)
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">${product.price}</span>
                  <Badge variant="outline">Stock: {product.stock}</Badge>
                </div>
                <div className="flex justify-between">
                  <Badge>{product.category}</Badge>
                  <span className="text-sm">★ {product.rating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: {
  product: Product | null
  categories: string[]
  onSave: (product: Partial<Product>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    image_url: product?.image_url || "",
    stock: product?.stock || 0,
    category: product?.category || "",
    rating: product?.rating || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Editar Producto" : "Agregar Nuevo Producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number.parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">URL de Imagen</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="/placeholder.svg?height=400&width=400&text=Producto"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
