/**
 * Performance Optimization Utilities
 * - Memoization helpers
 * - Debouncing/Throttling
 * - Performance monitoring
 */

/**
 * Debounce function - delays execution until calls stop
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function - executes at most once per interval
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Performance monitoring - measure function execution time
 */
export const measurePerformance = <T>(
  name: string,
  fn: () => T
): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  // Log only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
};

/**
 * Async performance monitoring
 */
export const measureAsyncPerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
};

/**
 * Calculate bundle size
 */
export const calculateBundleSize = (): string => {
  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) return 'N/A';

  const navigationTiming = entries[0] as PerformanceNavigationTiming;
  const transferSize = navigationTiming.transferSize || 0;
  const sizeInKB = transferSize / 1024;

  return `${sizeInKB.toFixed(2)} KB`;
};

/**
 * Performance report
 */
export interface PerformanceReport {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
  bundleSize: string;
  timestamp: Date;
}

export const generatePerformanceReport = (): PerformanceReport => {
  const report: PerformanceReport = {
    bundleSize: calculateBundleSize(),
    timestamp: new Date(),
  };

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
  if (fcp) report.firstContentfulPaint = fcp.startTime;

  // Largest Contentful Paint (feature-detected)
  try {
    const supported = (PerformanceObserver as any)?.supportedEntryTypes?.includes?.('largest-contentful-paint');
    if (supported) {
      // Prefer observer to avoid deprecated warnings
      const lcpList = performance.getEntriesByType('largest-contentful-paint');
      if (lcpList && lcpList.length > 0) {
        report.largestContentfulPaint = (lcpList[lcpList.length - 1] as any).startTime;
      }
    }
  } catch {
    // Ignore if not supported
  }

  // Time to Interactive
  const navigationEntries = performance.getEntriesByType('navigation');
  if (navigationEntries.length > 0) {
    const nav = navigationEntries[0] as PerformanceNavigationTiming;
    if (nav.domContentLoadedEventEnd) {
      report.timeToInteractive = nav.domContentLoadedEventEnd;
    }
  }

  return report;
};

/**
 * Log performance report
 */
export const logPerformanceReport = () => {
  if (process.env.NODE_ENV === 'development') {
    const report = generatePerformanceReport();
    console.group('[Performance Report]');
    console.log('First Contentful Paint:', report.firstContentfulPaint?.toFixed(2), 'ms');
    console.log('Largest Contentful Paint:', report.largestContentfulPaint?.toFixed(2), 'ms');
    console.log('Time to Interactive:', report.timeToInteractive?.toFixed(2), 'ms');
    console.log('Bundle Size:', report.bundleSize);
    console.log('Timestamp:', report.timestamp);
    console.groupEnd();
  }
};

/**
 * Memoization cache for expensive calculations
 */
export class MemoCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
  (typeof window !== 'undefined' && window.requestIdleCallback) ||
  ((cb: IdleRequestCallback) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      } as IdleDeadline);
    }, 1);
  });

/**
 * Defer work to idle time
 */
export const deferToIdleCallback = (callback: () => void): void => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};
