import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  isHoverCapable: boolean;
}

export interface ResponsiveConfig {
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  debounceMs: number;
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  debounceMs: 150,
};

/**
 * Hook để detect device type và responsive state
 * @param config Cấu hình tùy chỉnh breakpoints
 * @returns Responsive state với các thông tin về device
 */
export function useResponsive(config: Partial<ResponsiveConfig> = {}): ResponsiveState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < finalConfig.mobileBreakpoint) {
      return 'mobile';
    } else if (width < finalConfig.tabletBreakpoint) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, [finalConfig.mobileBreakpoint, finalConfig.tabletBreakpoint]);

  const getOrientation = useCallback((width: number, height: number): 'portrait' | 'landscape' => {
    return width > height ? 'landscape' : 'portrait';
  }, []);

  const getIsTouchDevice = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - fallback for older browsers
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  const getIsHoverCapable = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    
    // Check for hover capability
    return window.matchMedia('(hover: hover)').matches;
  }, []);

  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        isTouchDevice: false,
        isHoverCapable: true,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType(width);

    return {
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      width,
      height,
      orientation: getOrientation(width, height),
      isTouchDevice: getIsTouchDevice(),
      isHoverCapable: getIsHoverCapable(),
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const deviceType = getDeviceType(width);

        setState(prevState => {
          // Only update if something changed
          if (
            prevState.deviceType !== deviceType ||
            prevState.width !== width ||
            prevState.height !== height ||
            prevState.orientation !== getOrientation(width, height)
          ) {
            return {
              deviceType,
              isMobile: deviceType === 'mobile',
              isTablet: deviceType === 'tablet',
              isDesktop: deviceType === 'desktop',
              width,
              height,
              orientation: getOrientation(width, height),
              isTouchDevice: getIsTouchDevice(),
              isHoverCapable: getIsHoverCapable(),
            };
          }
          return prevState;
        });
      }, finalConfig.debounceMs);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Listen for media query changes
    const hoverMediaQuery = window.matchMedia('(hover: hover)');
    const touchMediaQuery = window.matchMedia('(pointer: coarse)');

    const handleMediaQueryChange = () => {
      handleResize();
    };

    if (hoverMediaQuery.addEventListener) {
      hoverMediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      // Fallback for older browsers
      hoverMediaQuery.addListener(handleMediaQueryChange);
    }

    if (touchMediaQuery.addEventListener) {
      touchMediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      // Fallback for older browsers
      touchMediaQuery.addListener(handleMediaQueryChange);
    }

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      if (hoverMediaQuery.removeEventListener) {
        hoverMediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        hoverMediaQuery.removeListener(handleMediaQueryChange);
      }

      if (touchMediaQuery.removeEventListener) {
        touchMediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        touchMediaQuery.removeListener(handleMediaQueryChange);
      }

      clearTimeout(timeoutId);
    };
  }, [getDeviceType, getOrientation, getIsTouchDevice, getIsHoverCapable, finalConfig.debounceMs]);

  return state;
}

/**
 * Hook để lấy thông tin về viewport
 * @returns Viewport information
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        scrollX: 0,
        scrollY: 0,
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setViewport(prev => ({
        ...prev,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      }));
    };

    const handleResize = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewport;
}

/**
 * Hook để detect device capabilities
 * @returns Device capabilities
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isTouchDevice: false,
        isHoverCapable: true,
        isReducedMotion: false,
        isHighContrast: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      };
    }

    return {
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isHoverCapable: window.matchMedia('(hover: hover)').matches,
      isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
    ];

    const handleChange = () => {
      setCapabilities({
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isHoverCapable: window.matchMedia('(hover: hover)').matches,
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
      });
    };

    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleChange);
      }
    });

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => handleChange();
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
        mediaQueries.forEach(mq => {
          if (mq.removeEventListener) {
            mq.removeEventListener('change', handleChange);
          } else {
            mq.removeListener(handleChange);
          }
        });
      };
    }

    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleChange);
        } else {
          mq.removeListener(handleChange);
        }
      });
    };
  }, []);

  return capabilities;
}

/**
 * Hook để quản lý responsive breakpoints
 * @param breakpoints Custom breakpoints
 * @returns Breakpoint utilities
 */
export function useBreakpoints(breakpoints: Record<string, number> = {}) {
  const defaultBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
    ...breakpoints,
  };

  const { width } = useResponsive();

  const currentBreakpoint = Object.entries(defaultBreakpoints)
    .reverse()
    .find(([, breakpointWidth]) => width >= breakpointWidth)?.[0] || 'xs';

  const isUp = useCallback((breakpoint: keyof typeof defaultBreakpoints) => {
    return width >= defaultBreakpoints[breakpoint];
  }, [width]);

  const isDown = useCallback((breakpoint: keyof typeof defaultBreakpoints) => {
    return width < defaultBreakpoints[breakpoint];
  }, [width]);

  const isBetween = useCallback((min: keyof typeof defaultBreakpoints, max: keyof typeof defaultBreakpoints) => {
    return width >= defaultBreakpoints[min] && width < defaultBreakpoints[max];
  }, [width]);

  return {
    current: currentBreakpoint,
    isUp,
    isDown,
    isBetween,
    breakpoints: defaultBreakpoints,
  };
}