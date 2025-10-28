import { type DeviceType } from '@/hooks/useResponsive';

// Breakpoint constants
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1024,
} as const;

// Grid configurations for different devices
export const GRID_CONFIGS = {
  mobile: {
    columns: 1,
    gap: '0.75rem',
    padding: '1rem',
  },
  tablet: {
    columns: 2,
    gap: '1rem',
    padding: '1.5rem',
  },
  desktop: {
    columns: 'auto-fit',
    gap: '1.5rem',
    padding: '2rem',
  },
} as const;

// Typography scales
export const TYPOGRAPHY_SCALES = {
  mobile: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    '4xl': '1.875rem',
  },
  tablet: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '0.9375rem',
    lg: '1rem',
    xl: '1.125rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    '4xl': '1.875rem',
  },
  desktop: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

// Touch target sizes
export const TOUCH_TARGETS = {
  minimum: 44,
  comfortable: 48,
  large: 56,
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  mobile: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  tablet: {
    fast: '200ms',
    normal: '250ms',
    slow: '350ms',
  },
  desktop: {
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
  },
} as const;

/**
 * Get grid configuration based on device type
 */
export function getGridConfig(deviceType: DeviceType) {
  return GRID_CONFIGS[deviceType];
}

/**
 * Get typography scale based on device type
 */
export function getTypographyScale(deviceType: DeviceType) {
  return TYPOGRAPHY_SCALES[deviceType];
}

/**
 * Get animation duration based on device type
 */
export function getAnimationDuration(deviceType: DeviceType, speed: 'fast' | 'normal' | 'slow' = 'normal') {
  return ANIMATION_DURATIONS[deviceType][speed];
}

/**
 * Check if a value is within breakpoint range
 */
export function isWithinBreakpoint(width: number, min: number, max?: number): boolean {
  return width >= min && (max === undefined || width < max);
}

/**
 * Get device type from width
 */
export function getDeviceTypeFromWidth(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Generate responsive CSS classes
 */
export function getResponsiveClasses(deviceType: DeviceType, baseClasses: string = ''): string {
  const deviceClass = `device-${deviceType}`;
  const touchClass = deviceType === 'mobile' ? 'touch-enabled' : '';
  const hoverClass = deviceType === 'desktop' ? 'hover-enabled' : '';
  
  return [baseClasses, deviceClass, touchClass, hoverClass].filter(Boolean).join(' ');
}

/**
 * Generate responsive grid styles
 */
export function getResponsiveGridStyles(deviceType: DeviceType) {
  const config = getGridConfig(deviceType);
  
  return {
    display: 'grid',
    gap: config.gap,
    padding: config.padding,
    gridTemplateColumns: typeof config.columns === 'number' 
      ? `repeat(${config.columns}, 1fr)` 
      : `auto-fit, minmax(300px, 1fr)`,
  };
}

/**
 * Generate responsive typography styles
 */
export function getResponsiveTypographyStyles(deviceType: DeviceType, size: keyof typeof TYPOGRAPHY_SCALES.mobile) {
  const scale = getTypographyScale(deviceType);
  
  return {
    fontSize: scale[size],
    lineHeight: size === 'xs' ? 1.4 : size === 'sm' ? 1.45 : 1.5,
  };
}

/**
 * Check if element is touch-friendly
 */
export function isTouchFriendly(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);
  const width = parseInt(styles.width, 10);
  const height = parseInt(styles.height, 10);
  
  return width >= TOUCH_TARGETS.minimum && height >= TOUCH_TARGETS.minimum;
}

/**
 * Make element touch-friendly
 */
export function makeTouchFriendly(element: HTMLElement, size: number = TOUCH_TARGETS.minimum): void {
  element.style.minWidth = `${size}px`;
  element.style.minHeight = `${size}px`;
  element.style.padding = `${size / 4}px ${size / 2}px`;
}

/**
 * Generate responsive image attributes
 */
export function getResponsiveImageAttributes(deviceType: DeviceType) {
  const sizes = {
    mobile: '(max-width: 767px) 100vw',
    tablet: '(min-width: 768px) and (max-width: 1023px) 50vw',
    desktop: '(min-width: 1024px) 33vw',
  };
  
  return {
    sizes: sizes[deviceType],
    loading: deviceType === 'mobile' ? 'lazy' as const : 'eager' as const,
    decoding: deviceType === 'mobile' ? 'async' as const : 'sync' as const,
  };
}

/**
 * Generate responsive chart dimensions
 */
export function getResponsiveChartDimensions(deviceType: DeviceType, containerWidth?: number) {
  const baseDimensions = {
    mobile: { width: containerWidth || 300, height: 200 },
    tablet: { width: containerWidth || 400, height: 250 },
    desktop: { width: containerWidth || 500, height: 300 },
  };
  
  return baseDimensions[deviceType];
}

/**
 * Generate responsive table configuration
 */
export function getResponsiveTableConfig(deviceType: DeviceType) {
  return {
    mobile: {
      pagination: true,
      pageSize: 5,
      scrollable: true,
      compact: true,
    },
    tablet: {
      pagination: true,
      pageSize: 10,
      scrollable: true,
      compact: false,
    },
    desktop: {
      pagination: true,
      pageSize: 20,
      scrollable: false,
      compact: false,
    },
  }[deviceType];
}

/**
 * Generate responsive navigation configuration
 */
export function getResponsiveNavigationConfig(deviceType: DeviceType) {
  return {
    mobile: {
      type: 'bottom-tabs' as const,
      collapsible: true,
      swipeable: true,
      iconOnly: true,
    },
    tablet: {
      type: 'top-tabs' as const,
      collapsible: false,
      swipeable: true,
      iconOnly: false,
    },
    desktop: {
      type: 'sidebar' as const,
      collapsible: false,
      swipeable: false,
      iconOnly: false,
    },
  }[deviceType];
}

/**
 * Generate responsive KPI card configuration
 */
export function getResponsiveKpiConfig(deviceType: DeviceType) {
  return {
    mobile: {
      columns: 1,
      showDetails: false,
      compact: true,
      animated: false,
    },
    tablet: {
      columns: 2,
      showDetails: true,
      compact: false,
      animated: true,
    },
    desktop: {
      columns: 3,
      showDetails: true,
      compact: false,
      animated: true,
    },
  }[deviceType];
}

/**
 * Generate responsive form configuration
 */
export function getResponsiveFormConfig(deviceType: DeviceType) {
  return {
    mobile: {
      layout: 'single-column' as const,
      stickySubmit: true,
      inlineValidation: true,
      autoComplete: 'minimal' as const,
    },
    tablet: {
      layout: 'two-column' as const,
      stickySubmit: false,
      inlineValidation: true,
      autoComplete: 'full' as const,
    },
    desktop: {
      layout: 'multi-column' as const,
      stickySubmit: false,
      inlineValidation: true,
      autoComplete: 'full' as const,
    },
  }[deviceType];
}

/**
 * Generate responsive modal configuration
 */
export function getResponsiveModalConfig(deviceType: DeviceType) {
  return {
    mobile: {
      fullScreen: true,
      draggable: false,
      resizable: false,
      backdropClose: true,
    },
    tablet: {
      fullScreen: false,
      draggable: false,
      resizable: true,
      backdropClose: true,
    },
    desktop: {
      fullScreen: false,
      draggable: true,
      resizable: true,
      backdropClose: false,
    },
  }[deviceType];
}

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  /**
   * Check if should use lazy loading based on device and connection
   */
  shouldUseLazyLoading(deviceType: DeviceType, connectionType: string = 'unknown'): boolean {
    if (deviceType === 'mobile') return true;
    if (connectionType === 'slow-2g' || connectionType === '2g') return true;
    if (connectionType === '3g') return deviceType !== 'desktop';
    return false;
  },
  
  /**
   * Check if should reduce animations based on device and preferences
   */
  shouldReduceAnimations(deviceType: DeviceType, prefersReducedMotion: boolean = false): boolean {
    if (prefersReducedMotion) return true;
    if (deviceType === 'mobile') return true;
    return false;
  },
  
  /**
   * Get appropriate debounce time based on device
   */
  getDebounceTime(deviceType: DeviceType): number {
    return {
      mobile: 300,
      tablet: 200,
      desktop: 150,
    }[deviceType];
  },
  
  /**
   * Get appropriate throttle time based on device
   */
  getThrottleTime(deviceType: DeviceType): number {
    return {
      mobile: 100,
      tablet: 50,
      desktop: 16,
    }[deviceType];
  },
};

/**
 * Accessibility utilities
 */
export const accessibilityUtils = {
  /**
   * Check if should use touch-specific accessibility features
   */
  shouldUseTouchAccessibility(deviceType: DeviceType, isTouchDevice: boolean): boolean {
    return deviceType === 'mobile' || isTouchDevice;
  },
  
  /**
   * Get appropriate focus management strategy
   */
  getFocusStrategy(deviceType: DeviceType) {
    return {
      mobile: 'trap' as const,
      tablet: 'restore' as const,
      desktop: 'restore' as const,
    }[deviceType];
  },
  
  /**
   * Get appropriate keyboard navigation configuration
   */
  getKeyboardNavigationConfig(deviceType: DeviceType) {
    return {
      mobile: {
        enabled: false,
        shortcuts: {},
      },
      tablet: {
        enabled: true,
        shortcuts: { 'Tab': true, 'Enter': true, 'Space': true },
      },
      desktop: {
        enabled: true,
        shortcuts: { 'Tab': true, 'Enter': true, 'Space': true, 'ArrowKeys': true },
      },
    }[deviceType];
  },
};

/**
 * Touch gesture utilities
 */
export const touchUtils = {
  /**
   * Check if element supports swipe gestures
   */
  supportsSwipe(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    return styles.overflowX === 'auto' || styles.overflowX === 'scroll';
  },
  
  /**
   * Get swipe threshold based on device
   */
  getSwipeThreshold(deviceType: DeviceType): number {
    return {
      mobile: 50,
      tablet: 75,
      desktop: 100,
    }[deviceType];
  },
  
  /**
   * Get tap timeout based on device
   */
  getTapTimeout(deviceType: DeviceType): number {
    return {
      mobile: 300,
      tablet: 250,
      desktop: 200,
    }[deviceType];
  },
};

/**
 * Responsive testing utilities
 */
export const testingUtils = {
  /**
   * Simulate device viewport
   */
  simulateViewport(deviceType: DeviceType): { width: number; height: number } {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
    };
    
    return viewports[deviceType];
  },
  
  /**
   * Generate test data for responsive testing
   */
  generateTestData(deviceType: DeviceType) {
    const config = getGridConfig(deviceType);
    const kpiConfig = getResponsiveKpiConfig(deviceType);
    
    return {
      gridConfig: config,
      kpiConfig,
      deviceType,
      expectedColumns: kpiConfig.columns,
      expectedGap: config.gap,
    };
  },
};