import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/performance.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'src/test/**',
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Performance-specific configuration
    benchmark: {
      include: ['src/**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      outputFile: './bench-results.json',
    },
    // Performance thresholds
    performance: {
      thresholds: {
        // Render time thresholds (ms)
        renderTime: {
          warning: 16,
          error: 33,
        },
        // Bundle size thresholds (KB)
        bundleSize: {
          warning: 250,
          error: 500,
        },
        // Memory usage thresholds (MB)
        memoryUsage: {
          warning: 50,
          error: 100,
        },
        // First Contentful Paint thresholds (ms)
        firstContentfulPaint: {
          warning: 1500,
          error: 3000,
        },
        // Largest Contentful Paint thresholds (ms)
        largestContentfulPaint: {
          warning: 2500,
          error: 4000,
        },
        // Cumulative Layout Shift thresholds
        cumulativeLayoutShift: {
          warning: 0.1,
          error: 0.25,
        },
        // First Input Delay thresholds (ms)
        firstInputDelay: {
          warning: 100,
          error: 300,
        },
      },
      // Performance reporting
      reporters: ['default', 'json'],
      outputFile: './performance-results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});