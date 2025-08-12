"use client"

import { useEffect, useRef, useState } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  const { threshold = 0.3, rootMargin = '0px 0px -100px 0px', triggerOnce = true } = options

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add a small delay for more dramatic effect
          setTimeout(() => {
            setIsVisible(true)
            if (triggerOnce) {
              setHasAnimated(true)
            }
          }, 100)
        } else if (!triggerOnce && !hasAnimated) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [threshold, rootMargin, triggerOnce, hasAnimated])

  return { elementRef, isVisible }
}

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction)
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0)
    }

    window.addEventListener('scroll', updateScrollDirection)
    return () => window.removeEventListener('scroll', updateScrollDirection)
  }, [scrollDirection, lastScrollY])

  return scrollDirection
}

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const startTransition = () => {
    setIsTransitioning(true)
    // Add bounce effect to body
    document.body.classList.add('page-transitioning')
    
    // Auto-scroll down with bounce effect
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    const scrollBounce = () => {
      // First scroll down a bit
      window.scrollTo({
        top: 100,
        behavior: 'smooth'
      })
      
      // Then scroll back to top with bounce
      setTimeout(() => {
        scrollToTop()
      }, 150)
    }

    scrollBounce()

    // Remove transition class after animation
    setTimeout(() => {
      setIsTransitioning(false)
      document.body.classList.remove('page-transitioning')
    }, 800)
  }

  return { isTransitioning, startTransition }
}
