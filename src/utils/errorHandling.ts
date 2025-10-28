/**
 * Error handling and tracking utilities
 */

import React from 'react';

export interface ErrorInfo {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  source: 'component' | 'service' | 'api' | 'network' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  resolved: boolean;
  resolutionTime?: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  retryCount: number;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  totalErrors: number;
  errorsBySource: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: ErrorInfo[];
  resolutionRate: number;
  averageResolutionTime: number;
}

export interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  fallbackData?: any;
  onRetry?: (error: Error, attempt: number) => void;
  onFallback?: (error: Error) => void;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorInfo[] = [];
  private maxErrors = 1000;
  private errorCallbacks: Array<(error: ErrorInfo) => void> = [];
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorTracking(): void {
    // Global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError({
          message: event.message,
          stack: event.error?.stack,
          source: 'unknown',
          severity: 'medium',
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          source: 'unknown',
          severity: 'high',
          context: { reason: event.reason },
        });
      });
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public onError(callback: (error: ErrorInfo) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  public handleError(error: Partial<ErrorInfo>): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      source: error.source || 'unknown',
      severity: error.severity || 'medium',
      context: error.context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      resolved: false,
    };

    // Add to errors array
    this.errors.push(errorInfo);

    // Limit array size
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify callbacks
    for (const callback of this.errorCallbacks) {
      try {
        callback(errorInfo);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }

    // Log to console
    this.logError(errorInfo);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: ErrorInfo): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.severity.toUpperCase()}] ${error.message}`;
    
    if (error.context) {
      console.group(logMessage);
      console.log('Context:', error.context);
      console.log('Error ID:', error.id);
      console.log('Source:', error.source);
      if (error.stack) {
        console.log('Stack:', error.stack);
      }
      console.groupEnd();
    } else {
      console[logLevel](logMessage, {
        id: error.id,
        source: error.source,
        stack: error.stack,
      });
    }
  }

  private getLogLevel(severity: ErrorInfo['severity']): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'log';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'log';
    }
  }

  public resolveError(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error && !error.resolved) {
      error.resolved = true;
      error.resolutionTime = Date.now() - error.timestamp.getTime();
    }
  }

  public getErrors(filter?: {
    source?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): ErrorInfo[] {
    let filteredErrors = [...this.errors];

    if (filter) {
      if (filter.source) {
        filteredErrors = filteredErrors.filter(e => e.source === filter.source);
      }
      if (filter.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filter.severity);
      }
      if (filter.resolved !== undefined) {
        filteredErrors = filteredErrors.filter(e => e.resolved === filter.resolved);
      }
      if (filter.startDate) {
        filteredErrors = filteredErrors.filter(e => e.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filteredErrors = filteredErrors.filter(e => e.timestamp <= filter.endDate!);
      }
    }

    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public generateReport(): ErrorReport {
    const totalErrors = this.errors.length;
    const errorsBySource: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    for (const error of this.errors) {
      errorsBySource[error.source] = (errorsBySource[error.source] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    }

    const resolvedErrors = this.errors.filter(e => e.resolved);
    const resolutionRate = totalErrors > 0 ? (resolvedErrors.length / totalErrors) * 100 : 0;
    
    const averageResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, e) => sum + (e.resolutionTime || 0), 0) / resolvedErrors.length
      : 0;

    const topErrors = this.errors
      .sort((a, b) => {
        // Sort by severity first, then by frequency
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, 10);

    return {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      totalErrors,
      errorsBySource,
      errorsBySeverity,
      topErrors,
      resolutionRate,
      averageResolutionTime,
    };
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  public importErrors(errorData: string): void {
    try {
      const importedErrors = JSON.parse(errorData) as ErrorInfo[];
      this.errors = [...this.errors, ...importedErrors];
    } catch (error) {
      console.error('Failed to import errors:', error);
    }
  }
}

// Error boundary utilities
export const createErrorBoundary = (
  fallbackComponent: React.ComponentType<{ error?: Error; retry: () => void }>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  return class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    ErrorBoundaryState
  > {
    constructor(props: React.PropsWithChildren<{}>) {
      super(props);
      this.state = {
        hasError: false,
        retryCount: 0,
      };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return {
        hasError: true,
        error,
        retryCount: 0,
      };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const errorHandler = ErrorHandler.getInstance();
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.setState({
        error,
        errorInfo,
        errorId,
      });

      errorHandler.handleError({
        id: errorId,
        message: error.message,
        stack: error.stack,
        source: 'component',
        severity: 'high',
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });

      if (onError) {
        onError(error, errorInfo);
      }
    }

    handleRetry = () => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    };

    render() {
      if (this.state.hasError) {
        return React.createElement(fallbackComponent, {
          error: this.state.error,
          retry: this.handleRetry,
        });
      }

      return this.props.children;
    }
  };
};

// Retry utilities
export const createRetryWrapper = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: FallbackConfig
): T => {
  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    let delay = config.retryDelay;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < config.maxRetries) {
          if (config.onRetry) {
            config.onRetry(lastError, attempt);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (config.exponentialBackoff) {
            delay *= 2;
          }
        }
      }
    }

    if (config.onFallback) {
      config.onFallback(lastError);
    }

    if (config.fallbackData) {
      return config.fallbackData;
    }

    throw lastError;
  }) as T;
};

// Async error handling utilities
export const asyncErrorHandler = async <T>(
  promise: Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<[T | null, Error | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const errorObj = error as Error;
    
    if (errorHandler) {
      errorHandler(errorObj);
    } else {
      const handler = ErrorHandler.getInstance();
      handler.handleError({
        message: errorObj.message,
        stack: errorObj.stack,
        source: 'unknown',
        severity: 'medium',
      });
    }
    
    return [null, errorObj];
  }
};

// React hooks for error handling
export const useErrorHandler = () => {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = (error: Partial<ErrorInfo>) => {
    errorHandler.handleError(error);
  };

  const resolveError = (errorId: string) => {
    errorHandler.resolveError(errorId);
  };

  const getErrors = (filter?: Parameters<typeof errorHandler.getErrors>[0]) => {
    return errorHandler.getErrors(filter);
  };

  const generateReport = () => {
    return errorHandler.generateReport();
  };

  return {
    handleError,
    resolveError,
    getErrors,
    generateReport,
    errors: errorHandler.getErrors(),
  };
};

export const useErrorBoundary = (
  fallbackComponent: React.ComponentType<{ error?: Error; retry: () => void }>
) => {
  return createErrorBoundary(fallbackComponent);
};

// Error reporting utilities
export const errorReportingUtils = {
  /**
   * Send error report to monitoring service
   */
  sendReport: async (report: ErrorReport): Promise<boolean> => {
    try {
      // This would typically send to a monitoring service
      // For now, we'll just log it
      console.log('Error Report:', report);
      
      // Store in localStorage for demo purposes
      const reports = JSON.parse(localStorage.getItem('error_reports') || '[]');
      reports.push(report);
      localStorage.setItem('error_reports', JSON.stringify(reports.slice(-10))); // Keep last 10 reports
      
      return true;
    } catch (error) {
      console.error('Failed to send error report:', error);
      return false;
    }
  },

  /**
   * Get error reports from storage
   */
  getReports: (): ErrorReport[] => {
    try {
      return JSON.parse(localStorage.getItem('error_reports') || '[]');
    } catch (error) {
      console.error('Failed to get error reports:', error);
      return [];
    }
  },

  /**
   * Clear error reports
   */
  clearReports: (): void => {
    localStorage.removeItem('error_reports');
  },

  /**
   * Generate error summary
   */
  generateSummary: (reports: ErrorReport[]): string => {
    if (reports.length === 0) {
      return 'No error reports available.';
    }

    const latestReport = reports[reports.length - 1];
    const totalErrors = reports.reduce((sum, report) => sum + report.totalErrors, 0);
    const avgResolutionRate = reports.reduce((sum, report) => sum + report.resolutionRate, 0) / reports.length;

    let summary = `# Error Summary\n\n`;
    summary += `**Latest Report:** ${latestReport.timestamp.toLocaleString()}\n`;
    summary += `**Total Errors:** ${totalErrors}\n`;
    summary += `**Average Resolution Rate:** ${avgResolutionRate.toFixed(1)}%\n\n`;

    summary += `## Top Error Sources\n`;
    const allSources = reports.flatMap(report => Object.keys(report.errorsBySource));
    const sourceCounts = allSources.reduce((counts, source) => {
      counts[source] = (counts[source] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([source, count]) => {
        summary += `- ${source}: ${count}\n`;
      });

    return summary;
  },
};

export default ErrorHandler;