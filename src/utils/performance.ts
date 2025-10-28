/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  bundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface PerformanceThresholds {
  renderTime: number; // ms
  loadTime: number; // ms
  memoryUsage: number; // MB
  bundleSize: number; // KB
  firstContentfulPaint: number; // ms
  largestContentfulPaint: number; // ms
  cumulativeLayoutShift: number; // score
  firstInputDelay: number; // ms
}

export interface PerformanceReport {
  timestamp: Date;
  url: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  metrics: PerformanceMetrics;
  thresholds: PerformanceThresholds;
  violations: PerformanceViolation[];
  score: number; // 0-100
}

export interface PerformanceViolation {
  metric: keyof PerformanceMetrics;
  actual: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];
  private startTime: number = 0;
  private measurements: Map<string, number> = new Map();

  private constructor() {
    this.metrics = {
      renderTime: 0,
      loadTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
    };

    this.thresholds = {
      renderTime: 16, // 60fps
      loadTime: 3000, // 3 seconds
      memoryUsage: 50, // 50MB
      bundleSize: 250, // 250KB
      firstContentfulPaint: 1500, // 1.5 seconds
      largestContentfulPaint: 2500, // 2.5 seconds
      cumulativeLayoutShift: 0.1, // CLS score
      firstInputDelay: 100, // 100ms
    };

    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Observer for paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observer for largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observer for layout shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.metrics.cumulativeLayoutShift += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Observer for first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  public startMeasurement(name: string): void {
    this.startTime = performance.now();
    this.measurements.set(name, this.startTime);
  }

  public endMeasurement(name: string): number {
    const endTime = performance.now();
    const startTime = this.measurements.get(name);
    
    if (startTime === undefined) {
      console.warn(`Measurement '${name}' was not started`);
      return 0;
    }
    
    const duration = endTime - startTime;
    this.measurements.delete(name);
    
    if (name === 'render') {
      this.metrics.renderTime = duration;
    } else if (name === 'load') {
      this.metrics.loadTime = duration;
    }
    
    return duration;
  }

  public measureMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
    }
  }

  public measureBundleSize(): void {
    if (typeof window !== 'undefined') {
      // Calculate bundle size based on loaded resources
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const bundleSize = resources
        .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
        .reduce((total, resource) => total + (resource.transferSize || 0), 0);
      
      this.metrics.bundleSize = Math.round(bundleSize / 1024); // Convert to KB
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  public setThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public checkViolations(): PerformanceViolation[] {
    const violations: PerformanceViolation[] = [];

    for (const [metric, value] of Object.entries(this.metrics)) {
      const threshold = this.thresholds[metric as keyof PerformanceThresholds];
      
      if (value > threshold) {
        const severity = this.calculateSeverity(value, threshold);
        violations.push({
          metric: metric as keyof PerformanceMetrics,
          actual: value,
          threshold,
          severity,
          recommendation: this.getRecommendation(metric as keyof PerformanceMetrics, value, threshold),
        });
      }
    }

    return violations;
  }

  private calculateSeverity(actual: number, threshold: number): PerformanceViolation['severity'] {
    const ratio = actual / threshold;
    
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private getRecommendation(
    metric: keyof PerformanceMetrics,
    actual: number,
    threshold: number
  ): string {
    const recommendations: Record<keyof PerformanceMetrics, string> = {
      renderTime: `Component render time (${actual}ms) exceeds threshold (${threshold}ms). Consider optimizing component logic, using React.memo, or implementing virtualization.`,
      loadTime: `Page load time (${actual}ms) exceeds threshold (${threshold}ms). Consider optimizing assets, implementing lazy loading, or using a CDN.`,
      memoryUsage: `Memory usage (${actual}MB) exceeds threshold (${threshold}MB). Check for memory leaks, optimize data structures, or implement pagination.`,
      bundleSize: `Bundle size (${actual}KB) exceeds threshold (${threshold}KB). Consider code splitting, tree shaking, or removing unused dependencies.`,
      firstContentfulPaint: `First Contentful Paint (${actual}ms) exceeds threshold (${threshold}ms). Optimize critical rendering path and minimize render-blocking resources.`,
      largestContentfulPaint: `Largest Contentful Paint (${actual}ms) exceeds threshold (${threshold}ms). Optimize image loading and reduce main-thread work.`,
      cumulativeLayoutShift: `Cumulative Layout Shift (${actual}) exceeds threshold (${threshold}). Ensure elements have defined dimensions and avoid inserting content above existing content.`,
      firstInputDelay: `First Input Delay (${actual}ms) exceeds threshold (${threshold}ms). Minimize JavaScript execution time and break up long tasks.`,
    };

    return recommendations[metric];
  }

  public generateReport(): PerformanceReport {
    this.measureMemoryUsage();
    this.measureBundleSize();
    
    const violations = this.checkViolations();
    const score = this.calculateScore(violations);

    return {
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      deviceType: this.getDeviceType(),
      metrics: this.metrics,
      thresholds: this.thresholds,
      violations,
      score,
    };
  }

  private calculateScore(violations: PerformanceViolation[]): number {
    let score = 100;
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    return Math.max(0, score);
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  public cleanup(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
  }
}

// Performance optimization utilities
export const performanceUtils = {
  /**
   * Debounce function for performance optimization
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for performance optimization
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Memoize function for performance optimization
   */
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  /**
   * Check if should use lazy loading based on device and connection
   */
  shouldUseLazyLoading(deviceType: string, connectionType: string = 'unknown'): boolean {
    if (deviceType === 'mobile') return true;
    if (connectionType === 'slow-2g' || connectionType === '2g') return true;
    if (connectionType === '3g') return deviceType !== 'desktop';
    return false;
  },

  /**
   * Check if should reduce animations based on device and preferences
   */
  shouldReduceAnimations(deviceType: string, prefersReducedMotion: boolean = false): boolean {
    if (prefersReducedMotion) return true;
    if (deviceType === 'mobile') return true;
    return false;
  },

  /**
   * Get appropriate debounce time based on device
   */
  getDebounceTime(deviceType: string): number {
    return {
      mobile: 300,
      tablet: 200,
      desktop: 150,
    }[deviceType] || 200;
  },

  /**
   * Get appropriate throttle time based on device
   */
  getThrottleTime(deviceType: string): number {
    return {
      mobile: 100,
      tablet: 50,
      desktop: 16,
    }[deviceType] || 50;
  },
};

// Performance monitoring hooks
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  const startMeasurement = (name: string) => {
    monitor.startMeasurement(name);
  };
  
  const endMeasurement = (name: string) => {
    return monitor.endMeasurement(name);
  };
  
  const getReport = () => {
    return monitor.generateReport();
  };
  
  return {
    startMeasurement,
    endMeasurement,
    getReport,
    metrics: monitor.getMetrics(),
    violations: monitor.checkViolations(),
  };
};

export default PerformanceMonitor;