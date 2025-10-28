/**
 * Optimization utilities for dashboard performance and bundle size
 */

import React from 'react';

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
    modules: string[];
  }>;
  assets: Array<{
    name: string;
    size: number;
    type: 'js' | 'css' | 'image' | 'font';
  }>;
  recommendations: string[];
}

export interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  enableCompression: boolean;
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  chunkSizeLimit: number;
  compressionLevel: number;
}

export interface CacheStrategy {
  name: string;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum size in MB
  strategy: 'lru' | 'fifo' | 'custom';
}

class OptimizationManager {
  private static instance: OptimizationManager;
  private config: OptimizationConfig;
  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private cacheStrategies: Map<string, CacheStrategy> = new Map();

  private constructor() {
    this.config = {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableMinification: true,
      enableCompression: true,
      enableImageOptimization: true,
      enableLazyLoading: true,
      chunkSizeLimit: 250000, // 250KB
      compressionLevel: 6,
    };

    this.initializeCacheStrategies();
  }

  public static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }

  private initializeCacheStrategies(): void {
    this.cacheStrategies.set('api', {
      name: 'api',
      ttl: 300, // 5 minutes
      maxSize: 10, // 10MB
      strategy: 'lru',
    });

    this.cacheStrategies.set('images', {
      name: 'images',
      ttl: 3600, // 1 hour
      maxSize: 50, // 50MB
      strategy: 'lru',
    });

    this.cacheStrategies.set('components', {
      name: 'components',
      ttl: 1800, // 30 minutes
      maxSize: 5, // 5MB
      strategy: 'fifo',
    });
  }

  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cache data with specified strategy
   */
  public setCache(
    key: string,
    data: any,
    strategyName: string = 'api'
  ): void {
    const strategy = this.cacheStrategies.get(strategyName);
    if (!strategy) {
      console.warn(`Cache strategy '${strategyName}' not found`);
      return;
    }

    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size / (1024 * 1024); // Size in MB

    // Check cache size limit
    const currentCacheSize = this.calculateCacheSize();
    if (currentCacheSize + size > strategy.maxSize) {
      this.evictCache(strategy);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });
  }

  /**
   * Get cached data
   */
  public getCache<T>(key: string, strategyName: string = 'api'): T | null {
    const strategy = this.cacheStrategies.get(strategyName);
    if (!strategy) {
      console.warn(`Cache strategy '${strategyName}' not found`);
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > strategy.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Clear cache for specific strategy
   */
  public clearCache(strategyName?: string): void {
    if (strategyName) {
      const keysToDelete: string[] = [];
      
      for (const [key, cached] of this.cache.entries()) {
        // This is a simplified approach - in production, you'd track which keys belong to which strategy
        if (key.includes(strategyName)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private calculateCacheSize(): number {
    let totalSize = 0;
    for (const cached of this.cache.values()) {
      totalSize += cached.size;
    }
    return totalSize;
  }

  private evictCache(strategy: CacheStrategy): void {
    const entries = Array.from(this.cache.entries());
    
    switch (strategy.strategy) {
      case 'lru':
        // Sort by timestamp (oldest first) and remove until under limit
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'fifo':
        // First In, First Out - maintain insertion order
        break;
    }

    let currentSize = this.calculateCacheSize();
    const targetSize = strategy.maxSize * 0.8; // Evict to 80% of max size

    for (const [key] of entries) {
      if (currentSize <= targetSize) break;
      
      const cached = this.cache.get(key);
      if (cached) {
        currentSize -= cached.size;
        this.cache.delete(key);
      }
    }
  }

  /**
   * Analyze bundle for optimization opportunities
   */
  public analyzeBundle(): BundleAnalysis {
    // This would typically be done with webpack-bundle-analyzer or similar tools
    // Here we provide a mock implementation
    
    const mockAnalysis: BundleAnalysis = {
      totalSize: 1500000, // 1.5MB
      gzippedSize: 450000, // 450KB
      chunks: [
        {
          name: 'vendor',
          size: 800000,
          gzippedSize: 250000,
          modules: ['react', 'react-dom', 'recharts', 'date-fns'],
        },
        {
          name: 'dashboard',
          size: 400000,
          gzippedSize: 120000,
          modules: ['ResponsiveDashboard', 'KpiCards', 'ContractorComparison'],
        },
        {
          name: 'utils',
          size: 300000,
          gzippedSize: 80000,
          modules: ['performance', 'optimization', 'errorHandling'],
        },
      ],
      assets: [
        { name: 'main.css', size: 50000, type: 'css' },
        { name: 'logo.svg', size: 5000, type: 'image' },
        { name: 'font.woff2', size: 80000, type: 'font' },
      ],
      recommendations: this.generateRecommendations(),
    };

    return mockAnalysis;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.config.enableCodeSplitting) {
      recommendations.push('Consider implementing route-based code splitting for better initial load performance');
    }

    if (!this.config.enableTreeShaking) {
      recommendations.push('Enable tree shaking to remove unused code');
    }

    if (!this.config.enableCompression) {
      recommendations.push('Enable gzip compression to reduce bundle size');
    }

    if (!this.config.enableLazyLoading) {
      recommendations.push('Implement lazy loading for heavy components and images');
    }

    recommendations.push('Consider using dynamic imports for rarely used components');
    recommendations.push('Optimize images with modern formats (WebP, AVIF)');
    recommendations.push('Implement service worker for offline caching');

    return recommendations;
  }

  /**
   * Optimize images based on device capabilities
   */
  public optimizeImageUrl(
    url: string,
    deviceType: 'mobile' | 'tablet' | 'desktop',
    connectionType: string = 'unknown'
  ): string {
    // This would typically involve image CDN parameters
    const params = new URLSearchParams();

    // Adjust image quality based on connection
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      params.set('quality', '50');
      params.set('format', 'webp');
    } else if (connectionType === '3g') {
      params.set('quality', '70');
      params.set('format', 'webp');
    } else {
      params.set('quality', '85');
    }

    // Adjust image size based on device
    switch (deviceType) {
      case 'mobile':
        params.set('width', '800');
        break;
      case 'tablet':
        params.set('width', '1200');
        break;
      case 'desktop':
        params.set('width', '1920');
        break;
    }

    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  }

  /**
   * Create lazy load wrapper for components
   */
  public createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ): React.LazyExoticComponent<T> {
    return React.lazy(importFunc);
  }

  /**
   * Create optimized debounce function
   */
  public createDebounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    let result: any;

    const later = (context: any, args: Parameters<T>) => {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };

    const callNow = (context: any, args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => later(context, args), wait);
      if (immediate) result = func.apply(context, args);
    };

    return (...args: Parameters<T>) => callNow(this, args);
  }

  /**
   * Create optimized throttle function
   */
  public createThrottle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
    options: { leading?: boolean; trailing?: boolean } = {}
  ): (...args: Parameters<T>) => void {
    let lastArgs: Parameters<T>;
    let lastThis: any;
    let lastRan: number;
    let timeoutId: NodeJS.Timeout | null = null;

    const { leading = true, trailing = true } = options;

    const runFunc = (context: any) => {
      lastRan = Date.now();
      func.apply(context, lastArgs);
    };

    return (...args: Parameters<T>) => {
      lastArgs = args;
      lastThis = this;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const now = Date.now();
      const shouldRunLeading = leading && !timeoutId;
      const shouldRunTrailing = trailing;

      if (now - lastRan >= limit) {
        if (shouldRunLeading) {
          runFunc(lastThis);
        }
      } else if (shouldRunTrailing) {
        timeoutId = setTimeout(() => {
          runFunc(lastThis);
          timeoutId = null;
        }, limit - (now - lastRan));
      }
    };
  }
}

// React optimization utilities
export const reactOptimizationUtils = {
  /**
   * Memoize component with custom comparison
   */
  memoize: <P extends object>(
    Component: React.ComponentType<P>,
    areEqual?: (prevProps: P, nextProps: P) => boolean
  ) => {
    return React.memo(Component, areEqual);
  },

  /**
   * Create optimized callback
   */
  useCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ) => {
    return React.useCallback(callback, deps);
  },

  /**
   * Create optimized memo
   */
  useMemo: <T>(factory: () => T, deps: React.DependencyList) => {
    return React.useMemo(factory, deps);
  },

  /**
   * Create optimized ref with callback
   */
  useOptimizedRef: <T>(initialValue: T | null = null) => {
    const ref = React.useRef<T>(initialValue);
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    const setRef = React.useCallback((value: T | null) => {
      if (ref.current !== value) {
        ref.current = value;
        forceUpdate();
      }
    }, []);

    return [ref, setRef] as const;
  },
};

// Bundle optimization utilities
export const bundleOptimizationUtils = {
  /**
   * Check if module should be code split
   */
  shouldCodeSplit: (moduleName: string, size: number): boolean => {
    const heavyModules = ['recharts', 'date-fns', 'react-query'];
    return heavyModules.includes(moduleName) || size > 100000; // 100KB
  },

  /**
   * Get optimal chunk size based on device
   */
  getOptimalChunkSize: (deviceType: 'mobile' | 'tablet' | 'desktop'): number => {
    switch (deviceType) {
      case 'mobile':
        return 50000; // 50KB
      case 'tablet':
        return 100000; // 100KB
      case 'desktop':
        return 200000; // 200KB
    }
  },

  /**
   * Generate bundle report
   */
  generateBundleReport: (analysis: BundleAnalysis): string => {
    const { totalSize, gzippedSize, chunks, recommendations } = analysis;
    
    let report = `# Bundle Analysis Report\n\n`;
    report += `## Size Information\n`;
    report += `- Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- Gzipped Size: ${(gzippedSize / 1024).toFixed(2)} KB\n`;
    report += `- Compression Ratio: ${((1 - gzippedSize / totalSize) * 100).toFixed(1)}%\n\n`;
    
    report += `## Chunks\n`;
    for (const chunk of chunks) {
      report += `- ${chunk.name}: ${(chunk.size / 1024).toFixed(2)} KB (${(chunk.gzippedSize / 1024).toFixed(2)} KB gzipped)\n`;
    }
    
    report += `\n## Recommendations\n`;
    for (const recommendation of recommendations) {
      report += `- ${recommendation}\n`;
    }
    
    return report;
  },
};

export default OptimizationManager;