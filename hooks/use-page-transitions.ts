import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function usePageTransitions() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== currentPath) {
      setIsTransitioning(true)
      
      // Simulate page transition
      const timer = setTimeout(() => {
        setCurrentPath(pathname)
        setIsTransitioning(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname, currentPath])

  return {
    isTransitioning,
    currentPath
  }
}

export function useScrollAnimation() {
  const [scrollY, setScrollY] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      setScrollY(window.scrollY)
      setIsScrolling(true)

      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  return {
    scrollY,
    isScrolling
  }
}

export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  }

  const ref = (node: HTMLElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setIsIntersecting(true)
          setHasIntersected(true)
        }
      }, defaultOptions)

      observer.observe(node)

      return () => observer.disconnect()
    }
  }

  return [ref, isIntersecting] as const
}

export function useStaggerAnimation(delay = 100) {
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set())

  const animateItem = (index: number) => {
    setTimeout(() => {
      setAnimatedItems(prev => new Set([...prev, index]))
    }, index * delay)
  }

  const resetAnimation = () => {
    setAnimatedItems(new Set())
  }

  return {
    animatedItems,
    animateItem,
    resetAnimation
  }
}

export function useHoverAnimation() {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  const handleMouseEnter = (id: string) => {
    setHoveredElement(id)
  }

  const handleMouseLeave = () => {
    setHoveredElement(null)
  }

  return {
    hoveredElement,
    handleMouseEnter,
    handleMouseLeave
  }
}

// Animation utilities
export const animationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3
    }
  }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.4
    }
  }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

// CSS classes for animations
export const animationClasses = {
  slideUp: 'animate-slide-up',
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
  stagger: 'animate-stagger',
  float: 'animate-float',
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  ping: 'animate-ping'
}

// Custom CSS for animations
export const customAnimations = `
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes stagger {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .animate-slide-up {
    animation: slide-up 0.6s ease-out forwards;
  }

  .animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
  }

  .animate-scale-in {
    animation: scale-in 0.4s ease-out forwards;
  }

  .animate-stagger {
    animation: stagger 0.6s ease-out forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }

  .animate-delay-100 {
    animation-delay: 100ms;
  }

  .animate-delay-200 {
    animation-delay: 200ms;
  }

  .animate-delay-300 {
    animation-delay: 300ms;
  }

  .animate-delay-400 {
    animation-delay: 400ms;
  }

  .animate-delay-500 {
    animation-delay: 500ms;
  }
` 