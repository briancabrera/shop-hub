"use client"

import { useState } from "react"
import { useBundles } from "@/hooks/use-bundles"
import { BundleCard } from "@/components/bundles/bundle-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"
import type { BundleFilters } from "@/types"

export function BundlesDisplay() {
  const [activeTab, setActiveTab] = useState<string>("active")
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<BundleFilters>({
    status: "active",
    active: true,
    page: 1,
    limit: 6,
  })

  const { data: bundlesResponse, isLoading, error } = useBundles(filters)

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "active") {
      setFilters({
        ...filters,
        status: "active",
        active: true,
        page: 1,
      })
    } else if (value === "upcoming") {
      setFilters({
        ...filters,
        status: "active",
        active: false,
        page: 1,
      })
    } else if (value === "expired") {
      setFilters({
        ...filters,
        status: "inactive",
        page: 1,
      })
    }
    setPage(1)
  }

  // Handle pagination
  const handlePrevPage = () => {
    if (page > 1) {
      const newPage = page - 1
      setPage(newPage)
      setFilters({
        ...filters,
        page: newPage,
      })
    }
  }

  const handleNextPage = () => {
    if (bundlesResponse?.pagination && page < bundlesResponse.pagination.totalPages) {
      const newPage = page + 1
      setPage(newPage)
      setFilters({
        ...filters,
        page: newPage,
      })
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Bundles</h3>
        <p className="mt-1 text-gray-500">We couldn't load the bundles. Please try again later.</p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="active" value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="active">Active Deals</TabsTrigger>
          <TabsTrigger value="upcoming">Coming Soon</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Active Special Deals</h2>
            <p className="text-gray-600">Limited time offers available right now</p>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Coming Soon</h2>
            <p className="text-gray-600">Exciting deals that will be available shortly</p>
          </div>
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Expired Deals</h2>
            <p className="text-gray-600">Previous offers that are no longer available</p>
          </div>
        </TabsContent>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
          ))}
        </div>
      ) : bundlesResponse?.data && bundlesResponse.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {bundlesResponse.data.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>

          {/* Pagination */}
          {bundlesResponse.pagination && bundlesResponse.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm px-3 py-2 bg-gray-100 rounded-md">
                Page {page} of {bundlesResponse.pagination.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={page >= bundlesResponse.pagination.totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No bundles found</h3>
          <p className="mt-1 text-gray-500">
            {activeTab === "active" && "There are no active deals at the moment."}
            {activeTab === "upcoming" && "There are no upcoming deals scheduled."}
            {activeTab === "expired" && "There are no expired deals in the system."}
          </p>
        </div>
      )}
    </div>
  )
}
