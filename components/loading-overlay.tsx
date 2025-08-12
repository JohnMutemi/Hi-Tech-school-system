"use client"

import { usePageTransition } from "@/hooks/use-scroll-animations"

export function LoadingOverlay() {
  const { isTransitioning } = usePageTransition()

  return (
    <div className={`page-loading-overlay ${isTransitioning ? 'active' : ''}`}>
      <div className="text-center">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  )
}

