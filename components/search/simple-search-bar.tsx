"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"

interface SimpleSearchBarProps {
  placeholder?: string
  className?: string
  initialQuery?: string
  onSearchChange?: (query: string) => void
}

export function SimpleSearchBar({
  placeholder = "Search products...",
  className = "",
  initialQuery = "",
  onSearchChange,
}: SimpleSearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  // Aplicar debounce al valor de búsqueda - aumentamos a 500ms para dar más
  // tiempo en búsquedas simples que pueden ser costosas en la API
  const debouncedQuery = useDebounce(query, 500)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update local state when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // Efecto para notificar al componente padre cuando cambia el valor debounced
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedQuery)
    }
  }, [debouncedQuery, onSearchChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    // Ya no notificamos aquí, sino en el efecto con el valor debounced
  }

  const handleClear = () => {
    setQuery("")
    // Aquí sí notificamos inmediatamente para limpiar los resultados
    if (onSearchChange) {
      onSearchChange("")
    }
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Para búsqueda simple, notificar inmediatamente al enviar el formulario
    if (onSearchChange) {
      onSearchChange(query)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            className="pl-10 pr-10 w-full"
            autoComplete="off"
          />
          {query && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
