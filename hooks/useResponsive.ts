'use client';

import { useState, useEffect } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  large: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Screen size types
export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'large';

// Orientation types
export type Orientation = 'portrait' | 'landscape';

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Responsive hook interface
interface ResponsiveState {
  // Screen dimensions
  width: number;
  height: number;
  
  // Breakpoint detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  
  // Screen size
  screenSize: ScreenSize;
  
  // Orientation
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Device type
  deviceType: DeviceType;
  
  // Touch support
  isTouch: boolean;
  
  // Utility functions
  isBreakpoint: (breakpoint: Breakpoint) => boolean;
  isBreakpointUp: (breakpoint: Breakpoint) => boolean;
  isBreakpointDown: (breakpoint: Breakpoint) => boolean;
  isBreakpointBetween: (min: Breakpoint, max: Breakpoint) => boolean;
}

/**
 * Custom hook for responsive design
 * Provides screen size, orientation, and device detection
 */
export const useResponsive = (): ResponsiveState => {
  // State for screen dimensions
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  
  // State for touch detection
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    // Function to update dimensions
    const updateDimensions = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Function to detect touch support
    const detectTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Initial setup
    updateDimensions();
    detectTouch();

    // Add event listeners
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // Calculate screen size
  const getScreenSize = (): ScreenSize => {
    if (width >= BREAKPOINTS.large) return 'large';
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  };

  // Calculate orientation
  const getOrientation = (): Orientation => {
    return width > height ? 'landscape' : 'portrait';
  };

  // Calculate device type
  const getDeviceType = (): DeviceType => {
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  };

  // Utility functions
  const isBreakpoint = (breakpoint: Breakpoint): boolean => {
    const breakpointWidth = BREAKPOINTS[breakpoint];
    return width >= breakpointWidth && width < (BREAKPOINTS[breakpoint + 1] || Infinity);
  };

  const isBreakpointUp = (breakpoint: Breakpoint): boolean => {
    return width >= BREAKPOINTS[breakpoint];
  };

  const isBreakpointDown = (breakpoint: Breakpoint): boolean => {
    return width < BREAKPOINTS[breakpoint];
  };

  const isBreakpointBetween = (min: Breakpoint, max: Breakpoint): boolean => {
    return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];
  };

  // Current values
  const screenSize = getScreenSize();
  const orientation = getOrientation();
  const deviceType = getDeviceType();

  return {
    // Screen dimensions
    width,
    height,
    
    // Breakpoint detection
    isMobile: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.large,
    isLarge: width >= BREAKPOINTS.large,
    
    // Screen size
    screenSize,
    
    // Orientation
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    
    // Device type
    deviceType,
    
    // Touch support
    isTouch,
    
    // Utility functions
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
  };
};

/**
 * Hook for responsive visibility
 * Shows/hides elements based on breakpoints
 */
export const useResponsiveVisibility = () => {
  const responsive = useResponsive();

  return {
    // Show only on specific breakpoints
    showOnMobile: responsive.isMobile,
    showOnTablet: responsive.isTablet,
    showOnDesktop: responsive.isDesktop,
    showOnLarge: responsive.isLarge,
    
    // Hide on specific breakpoints
    hideOnMobile: !responsive.isMobile,
    hideOnTablet: !responsive.isTablet,
    hideOnDesktop: !responsive.isDesktop,
    hideOnLarge: !responsive.isLarge,
    
    // Show on multiple breakpoints
    showOnMobileAndTablet: responsive.isMobile || responsive.isTablet,
    showOnTabletAndDesktop: responsive.isTablet || responsive.isDesktop,
    showOnDesktopAndLarge: responsive.isDesktop || responsive.isLarge,
    
    // Hide on multiple breakpoints
    hideOnMobileAndTablet: !(responsive.isMobile || responsive.isTablet),
    hideOnTabletAndDesktop: !(responsive.isTablet || responsive.isDesktop),
    hideOnDesktopAndLarge: !(responsive.isDesktop || responsive.isLarge),
  };
};

/**
 * Hook for responsive layout
 * Provides layout-specific responsive utilities
 */
export const useResponsiveLayout = () => {
  const responsive = useResponsive();

  return {
    // Grid columns
    gridCols: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      large: 4,
    },
    
    // Current grid columns based on screen size
    currentGridCols: responsive.isLarge ? 4 : responsive.isDesktop ? 3 : responsive.isTablet ? 2 : 1,
    
    // Spacing
    spacing: {
      mobile: '16px',
      tablet: '24px',
      desktop: '32px',
      large: '40px',
    },
    
    // Current spacing based on screen size
    currentSpacing: responsive.isLarge ? '40px' : responsive.isDesktop ? '32px' : responsive.isTablet ? '24px' : '16px',
    
    // Typography sizes
    textSizes: {
      mobile: {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
      },
      tablet: {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
      },
      desktop: {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
    },
    
    // Current text sizes based on screen size
    currentTextSizes: responsive.isDesktop 
      ? responsive.textSizes.desktop 
      : responsive.isTablet 
      ? responsive.textSizes.tablet 
      : responsive.textSizes.mobile,
  };
};

/**
 * Hook for responsive interactions
 * Provides touch and interaction utilities
 */
export const useResponsiveInteractions = () => {
  const responsive = useResponsive();

  return {
    // Touch interactions
    touchTarget: responsive.isTouch ? '44px' : 'auto',
    touchPadding: responsive.isTouch ? '12px' : '8px',
    
    // Hover support
    hasHover: !responsive.isTouch,
    
    // Gesture support
    hasGestures: responsive.isTouch,
    
    // Keyboard navigation
    hasKeyboard: !responsive.isTouch,
    
    // Focus management
    focusVisible: responsive.isTouch ? 'none' : 'auto',
  };
};

/**
 * Hook for responsive performance
 * Provides performance optimizations for different devices
 */
export const useResponsivePerformance = () => {
  const responsive = useResponsive();

  return {
    // Animation preferences
    prefersReducedMotion: false, // Could be enhanced with media query detection
    
    // Performance optimizations
    shouldOptimize: responsive.isMobile,
    shouldLazyLoad: responsive.isMobile || responsive.isTablet,
    shouldDebounce: responsive.isMobile,
    
    // Memory considerations
    maxItems: responsive.isMobile ? 50 : responsive.isTablet ? 100 : 200,
    maxImages: responsive.isMobile ? 10 : responsive.isTablet ? 20 : 50,
    
    // Network considerations
    shouldPreload: !responsive.isMobile,
    shouldCache: true,
  };
};

/**
 * Hook for responsive accessibility
 * Provides accessibility utilities for different devices
 */
export const useResponsiveAccessibility = () => {
  const responsive = useResponsive();

  return {
    // Focus management
    focusRing: responsive.isTouch ? 'none' : '2px solid #3b82f6',
    focusOffset: responsive.isTouch ? '0' : '2px',
    
    // Touch targets
    minTouchTarget: '44px',
    touchTargetPadding: '8px',
    
    // Screen reader
    screenReaderOnly: 'sr-only',
    
    // High contrast
    highContrast: false, // Could be enhanced with media query detection
    
    // Reduced motion
    reducedMotion: false, // Could be enhanced with media query detection
  };
};

// Export all hooks
export default useResponsive; 