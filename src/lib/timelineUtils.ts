/**
 * Timeline Modal Utilities
 * - Data validation
 * - Color management
 * - Export functionality
 * - Error handling
 */

import { ContractorTimelineData } from '@/components/modals/TimelineModal';

// Color constants
export const CONTRACTOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] as const;

// Data validation
export const validateContractorData = (contractors: ContractorTimelineData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(contractors)) {
    errors.push('Contractors data must be an array');
    return { valid: false, errors };
  }
  
  contractors.forEach((contractor, index) => {
    if (!contractor.id) {
      errors.push(`Contractor at index ${index} missing id`);
    }
    if (!contractor.name) {
      errors.push(`Contractor at index ${index} missing name`);
    }
    if (!Array.isArray(contractor.expectedProgress)) {
      errors.push(`Contractor ${contractor.name} has invalid expectedProgress`);
    }
    if (!Array.isArray(contractor.actualProgress)) {
      errors.push(`Contractor ${contractor.name} has invalid actualProgress`);
    }
    if (contractor.expectedProgress?.length !== contractor.actualProgress?.length) {
      errors.push(`Contractor ${contractor.name} has mismatched progress array lengths`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};

// Color management
export const getContractorColor = (contractor: ContractorTimelineData, index: number): string => {
  return contractor.color || CONTRACTOR_COLORS[index % CONTRACTOR_COLORS.length];
};

export const generateColorMap = (contractors: ContractorTimelineData[]): Record<string, string> => {
  return contractors.reduce((acc, contractor, index) => {
    acc[contractor.id] = getContractorColor(contractor, index);
    return acc;
  }, {} as Record<string, string>);
};

// Data processing
export const calculateTimelineSummary = (contractors: ContractorTimelineData[]) => {
  if (contractors.length === 0) {
    return {
      overallProgress: 0,
      onTrack: 0,
      needsAttention: 0,
      averageCompletion: 0,
      totalContractors: 0
    };
  }
  
  const completions = contractors.map(c => c.actualProgress[c.actualProgress.length - 1] || 0);
  const averageCompletion = Math.round(completions.reduce((sum, val) => sum + val, 0) / completions.length);
  
  return {
    overallProgress: averageCompletion,
    onTrack: contractors.filter(c => (c.actualProgress[c.actualProgress.length - 1] || 0) >= 80).length,
    needsAttention: contractors.filter(c => (c.actualProgress[c.actualProgress.length - 1] || 0) < 60).length,
    averageCompletion,
    totalContractors: contractors.length
  };
};

// Export functionality
export interface ExportData {
  chartData: any[];
  contractors: ContractorTimelineData[];
  viewMode: 'day' | 'week' | 'month';
  timestamp: string;
  summary: ReturnType<typeof calculateTimelineSummary>;
}

export const prepareExportData = (
  chartData: any[],
  contractors: ContractorTimelineData[],
  viewMode: 'day' | 'week' | 'month'
): ExportData => {
  return {
    chartData,
    contractors,
    viewMode,
    timestamp: new Date().toISOString(),
    summary: calculateTimelineSummary(contractors)
  };
};

// Error types
export class TimelineError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TimelineError';
  }
}

export const createTimelineError = (message: string, code: string) => {
  return new TimelineError(message, code);
};

// Chart configuration
export const getChartConfig = (viewMode: 'day' | 'week' | 'month') => {
  const configs = {
    day: {
      days: 7,
      tickInterval: 1,
      xAxisLabel: 'Days',
      height: 300
    },
    week: {
      days: 30,
      tickInterval: 3,
      xAxisLabel: 'Days',
      height: 400
    },
    month: {
      days: 90,
      tickInterval: 7,
      xAxisLabel: 'Days',
      height: 500
    }
  };
  
  return configs[viewMode];
};
