import { vi } from 'vitest';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  clearResourceTimings: vi.fn(),
  navigation: {
    type: 'navigate',
    redirectCount: 0,
  },
  timing: {
    navigationStart: 0,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: 0,
    domainLookupStart: 0,
    domainLookupEnd: 0,
    connectStart: 0,
    connectEnd: 0,
    secureConnectionStart: 0,
    secureConnectionEnd: 0,
    requestStart: 0,
    responseStart: 0,
    responseEnd: 0,
    domLoading: 0,
    domInteractive: 0,
    domContentLoadedEventStart: 0,
    domContentLoadedEventEnd: 0,
    domComplete: 0,
    loadEventStart: 0,
    loadEventEnd: 0,
  },
  memory: {
    usedJSHeapSize: 10485760, // 10MB
    totalJSHeapSize: 20971520, // 20MB
    jsHeapSizeLimit: 41943040, // 40MB
  },
};

// Override global performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: mockPerformance,
});

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

Object.defineProperty(window, 'PerformanceObserver', {
  writable: true,
  value: mockPerformanceObserver,
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16);
});

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: mockRequestAnimationFrame,
});

// Mock cancelAnimationFrame
const mockCancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: mockCancelAnimationFrame,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [0, 0.25, 0.5, 0.75, 1],
}));

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver,
});

// Mock ResizeObserver
const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: mockResizeObserver,
});

// Mock MutationObserver
const mockMutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  value: mockMutationObserver,
});

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g',
  type: 'wifi',
  downlink: 10,
  rtt: 50,
  saveData: false,
};

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: mockConnection,
});

// Mock navigator.deviceMemory
const mockDeviceMemory = {
  deviceMemory: 8, // 8GB
};

Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: mockDeviceMemory,
});

// Mock navigator.hardwareConcurrency
const mockHardwareConcurrency = {
  hardwareConcurrency: 4,
};

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: mockHardwareConcurrency,
});

// Performance test utilities
export const performanceTestUtils = {
  /**
   * Create a mock performance entry
   */
  createPerformanceEntry: (name: string, entryType: string, startTime: number, duration: number) => ({
    name,
    entryType,
    startTime,
    duration,
    toJSON: () => ({ name, entryType, startTime, duration }),
  }),

  /**
   * Create a mock paint timing entry
   */
  createPaintTimingEntry: (name: string, startTime: number) => ({
    name,
    entryType: 'paint',
    startTime,
    duration: 0,
    toJSON: () => ({ name, entryType: 'paint', startTime }),
  }),

  /**
   * Create a mock navigation timing entry
   */
  createNavigationTimingEntry: () => ({
    name: 'document',
    entryType: 'navigation',
    startTime: 0,
    duration: 1000,
    toJSON: () => ({ name: 'document', entryType: 'navigation' }),
  }),

  /**
   * Create a mock resource timing entry
   */
  createResourceTimingEntry: (name: string, size: number) => ({
    name,
    entryType: 'resource',
    startTime: 100,
    duration: 200,
    initiatorType: 'script',
    nextHopProtocol: 'http/1.1',
    transferSize: size,
    encodedBodySize: size,
    decodedBodySize: size,
    toJSON: () => ({ name, entryType: 'resource', transferSize: size }),
  }),

  /**
   * Create a mock layout shift entry
   */
  createLayoutShiftEntry: (value: number) => ({
    name: '',
    entryType: 'layout-shift',
    startTime: 0,
    duration: 0,
    value,
    hadRecentInput: false,
    toJSON: () => ({ value, hadRecentInput: false }),
  }),

  /**
   * Create a mock first input entry
   */
  createFirstInputEntry: (processingStart: number, processingEnd: number) => ({
    name: '',
    entryType: 'first-input',
    startTime: 0,
    duration: processingEnd - processingStart,
    processingStart,
    processingEnd,
    toJSON: () => ({ processingStart, processingEnd }),
  }),

  /**
   * Reset all performance mocks
   */
  resetMocks: () => {
    mockPerformance.now.mockClear();
    mockPerformance.mark.mockClear();
    mockPerformance.measure.mockClear();
    mockPerformance.getEntriesByType.mockClear();
    mockPerformance.getEntriesByName.mockClear();
    mockPerformance.clearMarks.mockClear();
    mockPerformance.clearMeasures.mockClear();
    mockPerformance.clearResourceTimings.mockClear();
    
    mockRequestAnimationFrame.mockClear();
    mockCancelAnimationFrame.mockClear();
    
    mockIntersectionObserver.mockClear();
    mockResizeObserver.mockClear();
    mockMutationObserver.mockClear();
  },

  /**
   * Setup performance mocks for a specific test
   */
  setupPerformanceMocks: (options: {
    renderTime?: number;
    loadTime?: number;
    memoryUsage?: number;
    bundleSize?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  } = {}) => {
    // Reset all mocks first
    performanceTestUtils.resetMocks();

    // Setup performance.now mock
    if (options.renderTime !== undefined) {
      const startTime = Date.now();
      mockPerformance.now.mockReturnValue(startTime + options.renderTime);
    }

    // Setup memory mock
    if (options.memoryUsage !== undefined) {
      mockPerformance.memory.usedJSHeapSize = options.memoryUsage * 1048576; // Convert MB to bytes
    }

    // Setup paint timing mocks
    if (options.firstContentfulPaint !== undefined || options.largestContentfulPaint !== undefined) {
      const mockPaintEntries = [];
      
      if (options.firstContentfulPaint !== undefined) {
        mockPaintEntries.push(
          performanceTestUtils.createPaintTimingEntry('first-contentful-paint', options.firstContentfulPaint)
        );
      }
      
      if (options.largestContentfulPaint !== undefined) {
        mockPaintEntries.push(
          performanceTestUtils.createPaintTimingEntry('largest-contentful-paint', options.largestContentfulPaint)
        );
      }
      
      mockPerformance.getEntriesByType.mockReturnValue(mockPaintEntries);
    }

    // Setup layout shift mock
    if (options.cumulativeLayoutShift !== undefined) {
      const mockLayoutShiftEntries = [
        performanceTestUtils.createLayoutShiftEntry(options.cumulativeLayoutShift)
      ];
      
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return mockLayoutShiftEntries;
        }
        return [];
      });
    }

    // Setup first input delay mock
    if (options.firstInputDelay !== undefined) {
      const processingStart = 100;
      const processingEnd = processingStart + options.firstInputDelay;
      
      const mockFirstInputEntries = [
        performanceTestUtils.createFirstInputEntry(processingStart, processingEnd)
      ];
      
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'first-input') {
          return mockFirstInputEntries;
        }
        return [];
      });
    }

    // Setup resource timing mock for bundle size
    if (options.bundleSize !== undefined) {
      const mockResourceEntries = [
        performanceTestUtils.createResourceTimingEntry('main.js', options.bundleSize * 1024) // Convert KB to bytes
      ];
      
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return mockResourceEntries;
        }
        return [];
      });
    }
  },
};

// Setup performance mocks before each test
beforeEach(() => {
  performanceTestUtils.resetMocks();
});

// Cleanup performance mocks after each test
afterEach(() => {
  performanceTestUtils.resetMocks();
});