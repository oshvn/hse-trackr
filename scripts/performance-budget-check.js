const fs = require('fs');
const path = require('path');

// Performance budget configuration
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (KB)
  bundleSize: {
    total: 500, // Total bundle size
    vendor: 300, // Vendor bundle size
    app: 200, // App bundle size
    chunks: {
      max: 100, // Maximum chunk size
      average: 50, // Average chunk size
    },
  },
  // Performance metrics budgets
  performance: {
    // First Contentful Paint (ms)
    firstContentfulPaint: {
      mobile: 1500,
      tablet: 1200,
      desktop: 1000,
    },
    // Largest Contentful Paint (ms)
    largestContentfulPaint: {
      mobile: 3000,
      tablet: 2500,
      desktop: 2000,
    },
    // Cumulative Layout Shift
    cumulativeLayoutShift: {
      mobile: 0.25,
      tablet: 0.2,
      desktop: 0.1,
    },
    // First Input Delay (ms)
    firstInputDelay: {
      mobile: 200,
      tablet: 150,
      desktop: 100,
    },
    // Time to Interactive (ms)
    timeToInteractive: {
      mobile: 5000,
      tablet: 4000,
      desktop: 3000,
    },
  },
  // Memory usage budgets (MB)
  memory: {
    initialLoad: 50, // Initial load memory
    peakUsage: 100, // Peak memory usage
    growthRate: 10, // Memory growth rate per minute
  },
  // Network budgets
  network: {
    totalRequests: 50, // Total number of requests
    totalSize: 2000, // Total size in KB
    compressionRatio: 0.7, // Minimum compression ratio
  },
};

// Read bundle analysis from file
function readBundleAnalysis() {
  try {
    const bundleReportPath = path.join(process.cwd(), 'bundle-report.json');
    if (fs.existsSync(bundleReportPath)) {
      const bundleReport = JSON.parse(fs.readFileSync(bundleReportPath, 'utf8'));
      return bundleReport;
    }
  } catch (error) {
    console.error('Error reading bundle report:', error);
    return null;
  }
}

// Read performance metrics from file
function readPerformanceMetrics() {
  try {
    const performanceReportPath = path.join(process.cwd(), 'performance-results.json');
    if (fs.existsSync(performanceReportPath)) {
      const performanceReport = JSON.parse(fs.readFileSync(performanceReportPath, 'utf8'));
      return performanceReport;
    }
  } catch (error) {
    console.error('Error reading performance report:', error);
    return null;
  }
}

// Check bundle size against budgets
function checkBundleSize(bundleAnalysis) {
  const violations = [];
  const warnings = [];

  if (!bundleAnalysis) {
    return { violations, warnings };
  }

  const { totalSize, gzippedSize, chunks } = bundleAnalysis;

  // Check total bundle size
  if (totalSize > PERFORMANCE_BUDGETS.bundleSize.total * 1024) {
    violations.push({
      type: 'bundle-size',
      severity: 'error',
      message: `Total bundle size ${(totalSize / 1024).toFixed(2)}KB exceeds budget of ${PERFORMANCE_BUDGETS.bundleSize.total}KB`,
      actual: totalSize / 1024,
      budget: PERFORMANCE_BUDGETS.bundleSize.total,
    });
  } else if (totalSize > PERFORMANCE_BUDGETS.bundleSize.total * 1024 * 0.8) {
    warnings.push({
      type: 'bundle-size',
      severity: 'warning',
      message: `Total bundle size ${(totalSize / 1024).toFixed(2)}KB is approaching budget of ${PERFORMANCE_BUDGETS.bundleSize.total}KB`,
      actual: totalSize / 1024,
      budget: PERFORMANCE_BUDGETS.bundleSize.total,
    });
  }

  // Check gzipped bundle size
  if (gzippedSize > PERFORMANCE_BUDGETS.bundleSize.total * 1024 * 0.5) {
    violations.push({
      type: 'bundle-size-gzipped',
      severity: 'error',
      message: `Gzipped bundle size ${(gzippedSize / 1024).toFixed(2)}KB exceeds budget of ${PERFORMANCE_BUDGETS.bundleSize.total * 0.5}KB`,
      actual: gzippedSize / 1024,
      budget: PERFORMANCE_BUDGETS.bundleSize.total * 0.5,
    });
  }

  // Check individual chunks
  if (chunks) {
    chunks.forEach((chunk, index) => {
      const chunkSizeKB = chunk.size / 1024;
      
      if (chunkSizeKB > PERFORMANCE_BUDGETS.bundleSize.chunks.max) {
        violations.push({
          type: 'chunk-size',
          severity: 'error',
          message: `Chunk ${chunk.name} size ${chunkSizeKB.toFixed(2)}KB exceeds budget of ${PERFORMANCE_BUDGETS.bundleSize.chunks.max}KB`,
          actual: chunkSizeKB,
          budget: PERFORMANCE_BUDGETS.bundleSize.chunks.max,
          chunkIndex: index,
        });
      } else if (chunkSizeKB > PERFORMANCE_BUDGETS.bundleSize.chunks.max * 0.8) {
        warnings.push({
          type: 'chunk-size',
          severity: 'warning',
          message: `Chunk ${chunk.name} size ${chunkSizeKB.toFixed(2)}KB is approaching budget of ${PERFORMANCE_BUDGETS.bundleSize.chunks.max}KB`,
          actual: chunkSizeKB,
          budget: PERFORMANCE_BUDGETS.bundleSize.chunks.max,
          chunkIndex: index,
        });
      }
    });
  }

  return { violations, warnings };
}

// Check performance metrics against budgets
function checkPerformanceMetrics(performanceReport) {
  const violations = [];
  const warnings = [];

  if (!performanceReport) {
    return { violations, warnings };
  }

  // Check First Contentful Paint
  if (performanceReport.firstContentfulPaint > PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop) {
    violations.push({
      type: 'first-contentful-paint',
      severity: 'error',
      message: `First Contentful Paint ${performanceReport.firstContentfulPaint}ms exceeds budget of ${PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop}ms`,
      actual: performanceReport.firstContentfulPaint,
      budget: PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop,
    });
  } else if (performanceReport.firstContentfulPaint > PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop * 0.8) {
    warnings.push({
      type: 'first-contentful-paint',
      severity: 'warning',
      message: `First Contentful Paint ${performanceReport.firstContentfulPaint}ms is approaching budget of ${PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop}ms`,
      actual: performanceReport.firstContentfulPaint,
      budget: PERFORMANCE_BUDGETS.performance.firstContentfulPaint.desktop,
    });
  }

  // Check Largest Contentful Paint
  if (performanceReport.largestContentfulPaint > PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop) {
    violations.push({
      type: 'largest-contentful-paint',
      severity: 'error',
      message: `Largest Contentful Paint ${performanceReport.largestContentfulPaint}ms exceeds budget of ${PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop}ms`,
      actual: performanceReport.largestContentfulPaint,
      budget: PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop,
    });
  } else if (performanceReport.largestContentfulPaint > PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop * 0.8) {
    warnings.push({
      type: 'largest-contentful-paint',
      severity: 'warning',
      message: `Largest Contentful Paint ${performanceReport.largestContentfulPaint}ms is approaching budget of ${PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop}ms`,
      actual: performanceReport.largestContentfulPaint,
      budget: PERFORMANCE_BUDGETS.performance.largestContentfulPaint.desktop,
    });
  }

  // Check Cumulative Layout Shift
  if (performanceReport.cumulativeLayoutShift > PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop) {
    violations.push({
      type: 'cumulative-layout-shift',
      severity: 'error',
      message: `Cumulative Layout Shift ${performanceReport.cumulativeLayoutShift} exceeds budget of ${PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop}`,
      actual: performanceReport.cumulativeLayoutShift,
      budget: PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop,
    });
  } else if (performanceReport.cumulativeLayoutShift > PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop * 0.8) {
    warnings.push({
      type: 'cumulative-layout-shift',
      severity: 'warning',
      message: `Cumulative Layout Shift ${performanceReport.cumulativeLayoutShift} is approaching budget of ${PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop}`,
      actual: performanceReport.cumulativeLayoutShift,
      budget: PERFORMANCE_BUDGETS.performance.cumulativeLayoutShift.desktop,
    });
  }

  // Check First Input Delay
  if (performanceReport.firstInputDelay > PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop) {
    violations.push({
      type: 'first-input-delay',
      severity: 'error',
      message: `First Input Delay ${performanceReport.firstInputDelay}ms exceeds budget of ${PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop}ms`,
      actual: performanceReport.firstInputDelay,
      budget: PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop,
    });
  } else if (performanceReport.firstInputDelay > PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop * 0.8) {
    warnings.push({
      type: 'first-input-delay',
      severity: 'warning',
      message: `First Input Delay ${performanceReport.firstInputDelay}ms is approaching budget of ${PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop}ms`,
      actual: performanceReport.firstInputDelay,
      budget: PERFORMANCE_BUDGETS.performance.firstInputDelay.desktop,
    });
  }

  return { violations, warnings };
}

// Generate performance budget report
function generateReport(bundleViolations, bundleWarnings, performanceViolations, performanceWarnings) {
  const totalViolations = bundleViolations.length + performanceViolations.length;
  const totalWarnings = bundleWarnings.length + performanceWarnings.length;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations,
      totalWarnings,
      status: totalViolations > 0 ? 'failed' : totalWarnings > 0 ? 'warning' : 'passed',
    },
    budgets: PERFORMANCE_BUDGETS,
    bundleSize: {
      violations: bundleViolations,
      warnings: bundleWarnings,
    },
    performance: {
      violations: performanceViolations,
      warnings: performanceWarnings,
    },
  };

  // Write report to file
  const reportPath = path.join(process.cwd(), 'performance-budget-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

// Main function
function main() {
  console.log('Checking performance budgets...');

  // Read analysis reports
  const bundleAnalysis = readBundleAnalysis();
  const performanceReport = readPerformanceMetrics();

  // Check against budgets
  const bundleResults = checkBundleSize(bundleAnalysis);
  const performanceResults = checkPerformanceMetrics(performanceReport);

  // Generate report
  const report = generateReport(
    bundleResults.violations,
    bundleResults.warnings,
    performanceResults.violations,
    performanceResults.warnings
  );

  // Output results
  console.log(`Performance budget check completed with status: ${report.summary.status}`);
  console.log(`Total violations: ${report.summary.totalViolations}`);
  console.log(`Total warnings: ${report.summary.totalWarnings}`);

  if (report.summary.totalViolations > 0) {
    console.error('Performance budget violations detected:');
    report.bundleSize.violations.forEach(violation => {
      console.error(`  [ERROR] ${violation.message}`);
    });
    report.performance.violations.forEach(violation => {
      console.error(`  [ERROR] ${violation.message}`);
    });
    
    // Exit with error code
    process.exit(1);
  } else if (report.summary.totalWarnings > 0) {
    console.warn('Performance budget warnings detected:');
    report.bundleSize.warnings.forEach(warning => {
      console.warn(`  [WARNING] ${warning.message}`);
    });
    report.performance.warnings.forEach(warning => {
      console.warn(`  [WARNING] ${warning.message}`);
    });
    
    // Exit with warning code
    process.exit(2);
  } else {
    console.log('All performance budgets passed!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkBundleSize,
  checkPerformanceMetrics,
  generateReport,
  PERFORMANCE_BUDGETS,
};