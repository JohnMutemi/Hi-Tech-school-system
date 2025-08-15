"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"

interface StickyHeaderProps {
  children: React.ReactNode
  className?: string
  hideOnScrollDown?: boolean
  threshold?: number
  alwaysShowAbove?: number
}

export function StickyHeader({ 
  children, 
  className = "",
  hideOnScrollDown = true,
  threshold = 10,
  alwaysShowAbove = 100
}: StickyHeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  const handleScroll = useCallback(() => {
    if (!hideOnScrollDown) {
      setIsVisible(true)
      return
    }

    const currentScrollY = window.scrollY
    const scrollDifference = Math.abs(currentScrollY - lastScrollY)

    // Only trigger changes if scroll difference is above threshold
    if (scrollDifference < threshold) {
      return
    }

    // Always show header when near top or when scrolling up
    if (currentScrollY <= alwaysShowAbove) {
      setIsVisible(true)
    } else {
      const isScrollingDown = currentScrollY > lastScrollY
      
      // Only hide when scrolling down fast and significantly
      if (isScrollingDown && scrollDifference > threshold * 2) {
        setIsVisible(false)
      } else if (!isScrollingDown) {
        // Always show when scrolling up
        setIsVisible(true)
      }
    }

    setLastScrollY(currentScrollY)
  }, [lastScrollY, hideOnScrollDown, threshold, alwaysShowAbove])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Throttle scroll events for better performance
    let ticking = false
    
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [handleScroll, mounted])

  if (!mounted) {
    return null
  }

  const headerElement = (
    <div 
      className={`fixed z-[60] transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )

  return createPortal(headerElement, document.body)
}
