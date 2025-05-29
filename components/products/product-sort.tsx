"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductSortProps {
  value?: string
  onChange: (value: string) => void
}

export function ProductSort({ value = "relevance", onChange }: ProductSortProps) {
  const [sortOption, setSortOption] = useState(value)

  // Update internal state when prop changes
  useEffect(() => {
    if (value !== sortOption) {
      setSortOption(value)
    }
  }, [value])

  const handleChange = (newValue: string) => {
    setSortOption(newValue)
    onChange(newValue)
  }

  return (
    <Select value={sortOption} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sort by</SelectLabel>
          <SelectItem value="relevance">Relevance</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="rating-desc">Highest Rated</SelectItem>
          <SelectItem value="name-asc">Name: A-Z</SelectItem>
          <SelectItem value="name-desc">Name: Z-A</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
