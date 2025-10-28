import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  delay?: number;
}

interface ImageOptimizationProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Simple intersection observer hook
 */
const useIntersectionObserver = (options: {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
} = {}) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0,
      }
    );

    if (ref) {
      observer.observe(ref);
    }

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [ref, options.rootMargin, options.threshold]);

  return { ref, isIntersecting };
};

/**
 * Virtual scrolling component for large lists
 */
export const VirtualScroll = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
}: VirtualScrollProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  // Handle scroll events with throttling based on device
  const handleScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  }, []);
  
  // Throttle scroll events based on device performance
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;
    
    let timeoutId: NodeJS.Timeout;
    const throttleTime = 16; // ~60fps
    
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, throttleTime);
    };
    
    scrollElement.addEventListener('scroll', throttledHandleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);
  
  // Render visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, visibleRange]);
  
  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: visibleRange.startIndex * itemHeight,
            width: '100%',
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="w-full"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Lazy load component with intersection observer
 */
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
  rootMargin = '50px',
  threshold = 0.1,
  delay = 0,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    threshold,
    triggerOnce: true,
  });
  
  useEffect(() => {
    if (isIntersecting && !isLoaded) {
      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          setIsLoaded(true);
        }, delay);
        return () => clearTimeout(timeoutId);
      } else {
        setIsLoaded(true);
      }
    }
  }, [isIntersecting, isLoaded, delay]);
  
  return (
    <div ref={ref} className="w-full">
      {isLoaded ? children : fallback}
    </div>
  );
};

/**
 * Optimized image component with lazy loading
 */
export const OptimizedImage: React.FC<ImageOptimizationProps> = ({
  src,
  alt,
  className,
  placeholder = '/placeholder.svg',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const { deviceType } = useResponsive();
  
  // Determine if should use lazy loading based on device
  const shouldUseLazyLoading = useMemo(() => {
    return deviceType === 'mobile';
  }, [deviceType]);
  
  useEffect(() => {
    if (shouldUseLazyLoading) {
      // Use Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoaded && !hasError) {
              setCurrentSrc(src);
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
      
      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    } else {
      // Load immediately for desktop
      setCurrentSrc(src);
    }
  }, [src, shouldUseLazyLoading, isLoaded, hasError]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-70',
          hasError && 'opacity-50'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

/**
 * Performance monitor component
 */
export const PerformanceMonitor: React.FC<{
  onPerformanceIssue?: (issue: string) => void;
}> = ({ onPerformanceIssue }) => {
  const { deviceType, width, height, isTouchDevice } = useResponsive();
  const [fps, setFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrameId = useRef<number>();
  
  // Measure FPS and render time
  useEffect(() => {
    const measurePerformance = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime.current + 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      // Measure render time
      const startRender = performance.now();
      
      animationFrameId.current = requestAnimationFrame(() => {
        setRenderTime(performance.now() - startRender);
        measurePerformance();
      });
    };
    
    measurePerformance();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);
  
  // Check for performance issues
  useEffect(() => {
    const issues = [];
    
    if (fps < 30) {
      issues.push(`Low FPS: ${fps}`);
    }
    
    if (renderTime > 16) {
      issues.push(`High render time: ${renderTime}ms`);
    }
    
    if (deviceType === 'mobile' && width < 360) {
      issues.push(`Very narrow viewport: ${width}px`);
    }
    
    if (issues.length > 0) {
      onPerformanceIssue?.(issues.join(', '));
    }
  }, [fps, renderTime, deviceType, width]);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      <div>FPS: {fps}</div>
      <div>Render: {renderTime.toFixed(2)}ms</div>
      <div>{deviceType}</div>
      <div>{width}x{height}</div>
      <div>Touch: {isTouchDevice ? 'Yes' : 'No'}</div>
    </div>
  );
};

/**
 * Optimized chart wrapper
 */
export const OptimizedChart: React.FC<{
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}> = ({ title, children, isLoading = false, className }) => {
  const { deviceType } = useResponsive();
  const [isInView, setIsInView] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px',
    threshold: 0.1,
    triggerOnce: true,
  });
  
  useEffect(() => {
    if (isIntersecting) {
      setIsInView(true);
    }
  }, [isIntersecting]);
  
  // Determine if should use lazy loading based on device
  const shouldUseLazyLoading = useMemo(() => {
    return deviceType === 'mobile';
  }, [deviceType]);
  
  if (shouldUseLazyLoading && !isInView) {
    return (
      <div ref={ref} className={cn('h-64 w-full', className)}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  return (
    <div ref={ref} className={cn('h-64 w-full', className)}>
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        children
      )}
    </div>
  );
};

/**
 * Optimized table component
 */
export const OptimizedTable: React.FC<{
  headers: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, any>>;
  isLoading?: boolean;
  className?: string;
  maxRows?: number;
}> = ({ headers, rows, isLoading = false, className, maxRows = 50 }) => {
  const { deviceType } = useResponsive();
  const [visibleRows, setVisibleRows] = useState(maxRows);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Use virtual scrolling for large datasets on mobile
  const shouldUseVirtualScroll = useMemo(() => {
    return deviceType === 'mobile' && rows.length > 20;
  }, [deviceType, rows.length]);
  
  const handleScroll = useCallback(() => {
    if (tableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      const rowHeight = 40; // Approximate row height
      const visibleCount = Math.ceil(clientHeight / rowHeight);
      const startIndex = Math.floor(scrollTop / rowHeight);
      const endIndex = Math.min(startIndex + visibleCount + 5, rows.length);
      
      setVisibleRows(endIndex - startIndex + visibleCount);
    }
  }, [rows.length]);
  
  const displayRows = useMemo(() => {
    if (shouldUseVirtualScroll) {
      return rows.slice(0, visibleRows);
    }
    return rows;
  }, [rows, visibleRows, shouldUseVirtualScroll]);
  
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  if (shouldUseVirtualScroll) {
    return (
      <div
        ref={tableRef}
        className={cn('overflow-auto', className)}
        style={{ height: '400px' }}
        onScroll={handleScroll}
      >
        <table className="w-full">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={cn('text-left p-2', header.width && `w-${header.width}`)}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={index} className="border-b">
                {headers.map((header) => (
                  <td key={header.key} className="p-2">
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                className={cn('text-left p-2', header.width && `w-${header.width}`)}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            <tr key={index} className="border-b">
              {headers.map((header) => (
                <td key={header.key} className="p-2">
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Performance optimization hook
 */
export const usePerformanceOptimization = () => {
  const { deviceType, isTouchDevice } = useResponsive();
  
  // Memoize expensive calculations
  const memoizedValue = useMemo(() => {
    // This is where you would put expensive calculations
    return Math.random();
  }, []);
  
  // Debounce expensive operations
  const debouncedValue = useMemo(() => {
    // This is where you would put debounced operations
    return Math.random();
  }, []);
  
  // Reduce animations on low-end devices
  const shouldReduceAnimations = useMemo(() => {
    return deviceType === 'mobile';
  }, [deviceType]);
  
  // Use appropriate debounce time based on device
  const getDebounceTime = useCallback(() => {
    return deviceType === 'mobile' ? 300 : 150;
  }, [deviceType]);
  
  // Use appropriate throttle time based on device
  const getThrottleTime = useCallback(() => {
    return deviceType === 'mobile' ? 100 : 50;
  }, [deviceType]);
  
  return {
    memoizedValue,
    debouncedValue,
    shouldReduceAnimations,
    getDebounceTime,
    getThrottleTime,
    isTouchDevice,
  };
};

/**
 * Performance optimization wrapper component
 */
export const PerformanceWrapper: React.FC<{
  children: React.ReactNode;
  reduceAnimations?: boolean;
  className?: string;
}> = ({ children, reduceAnimations, className }) => {
  const { deviceType } = useResponsive();
  
  const shouldReduceAnimations = useMemo(() => {
    if (reduceAnimations !== undefined) return reduceAnimations;
    return deviceType === 'mobile';
  }, [deviceType, reduceAnimations]);
  
  return (
    <div
      className={cn(
        shouldReduceAnimations && 'reduce-animations',
        className
      )}
      style={
        shouldReduceAnimations
          ? {
              // Disable transitions and animations
              transition: 'none',
              animation: 'none',
            }
          : {}
      }
    >
      {children}
    </div>
  );
};