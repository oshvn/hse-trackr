/**
 * Chart Performance Utilities
 * - Caching for chart data
 * - Performance monitoring for chart rendering
 * - Memory optimization
 */

import { measurePerformance, MemoCache } from './performanceOptimization';

// Cache for chart data with 50 items max
const chartDataCache = new MemoCache<string, any>(50);

// Cache for contractor timeline data
const contractorTimelineCache = new MemoCache<string, any>(20);

/**
 * Get cached chart data or generate new data
 */
export const getCachedChartData = (key: string, generator: () => any) => {
  if (chartDataCache.has(key)) {
    return chartDataCache.get(key);
  }
  
  const data = measurePerformance(`chart-data-${key}`, generator);
  chartDataCache.set(key, data);
  return data;
};

/**
 * Get cached contractor timeline data
 */
export const getCachedContractorTimeline = (contractors: any[], colors: string[]) => {
  const cacheKey = `contractor-timeline-${contractors.map(c => c.id).join('-')}`;
  
  if (contractorTimelineCache.has(cacheKey)) {
    return contractorTimelineCache.get(cacheKey);
  }
  
  const data = measurePerformance('contractor-timeline-generation', () => {
    return contractors.map((contractor, index) => {
      // Generate expected and actual progress arrays
      const expectedProgress = Array.from({ length: 31 }, (_, i) => (i / 30) * 100);
      const actualProgress = Array.from({ length: 31 }, (_, i) => {
        const base = (i / 30) * contractor.completionRate;
        return Math.min(100, base + (Math.random() - 0.5) * 5);
      });
      
      return {
        id: contractor.id,
        name: contractor.name,
        color: colors[index % colors.length],
        expectedProgress,
        actualProgress,
      };
    });
  });
  
  contractorTimelineCache.set(cacheKey, data);
  return data;
};

/**
 * Generate timeline chart data for modal
 */
export const generateTimelineChartData = (contractors: any[], viewMode: 'day' | 'week' | 'month') => {
  const cacheKey = `timeline-chart-${contractors.map(c => c.id).join('-')}-${viewMode}`;
  
  return getCachedChartData(cacheKey, () => {
    const data = [];
    const days = viewMode === 'day' ? 7 : viewMode === 'week' ? 30 : 90;
    
    for (let i = 0; i <= days; i++) {
      const dataPoint: any = { 
        day: i === 0 ? 'Start' : i === days ? 'End' : `Day ${i}`,
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
      };

      contractors.forEach((contractor) => {
        const expected = (i / days) * 100;
        const actual = (i / days) * contractor.completionRate + (Math.random() - 0.5) * 10;
        
        dataPoint[`${contractor.name} Expected`] = Math.round(expected);
        dataPoint[`${contractor.name} Actual`] = Math.round(Math.max(0, Math.min(100, actual)));
      });

      data.push(dataPoint);
    }
    
    return data;
  });
};

/**
 * Clear all chart caches
 */
export const clearChartCache = () => {
  chartDataCache.clear();
  contractorTimelineCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    chartDataSize: chartDataCache['cache'].size,
    contractorTimelineSize: contractorTimelineCache['cache'].size,
  };
};
