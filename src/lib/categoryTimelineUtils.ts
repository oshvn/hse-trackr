import { Category } from '@/components/dashboard/CategoryProgress';
import { ContractorData } from '@/components/dashboard/CategoryProgress';
import { CategoryTimelineData } from '@/hooks/useDashboardIntegration';
import { measurePerformance } from './performanceOptimization';

export const CATEGORY_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

/**
 * Generate timeline data for a specific category
 * Shows how approved/pending/missing counts change over time
 */
export const generateCategoryTimeline = (
  category: Category,
  contractors: ContractorData[],
  days: number = 30
): CategoryTimelineData => {
  return measurePerformance(`generate-category-timeline-${category.id}`, () => {

    // Ensure category has required properties with fallbacks
    const safeCategory = {
      id: category.id,
      name: category.name,
      approved: category.approved || 0,
      pending: category.pending || 0,
      missing: category.missing || 0,
      isCritical: category.isCritical || false,
      criticalReason: category.criticalReason || ''
    };


    const timelineData = [];
    const categoryColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
    
    // Generate daily progress for the category
    for (let i = 0; i <= days; i++) {
      const dayLabel = i === 0 ? 'Start' : i === days ? 'Today' : `Day ${i}`;
      
      // Simulate progress over time
      const progressFactor = i / days;
      const baseApproved = Math.floor(safeCategory.approved * progressFactor);
      const basePending = Math.floor(safeCategory.pending * (0.5 + progressFactor * 0.5));
      const baseMissing = Math.max(0, safeCategory.missing - Math.floor(safeCategory.missing * progressFactor));
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.1;
      const approved = Math.max(0, Math.min(safeCategory.approved, Math.floor(baseApproved * (1 + variation))));
      const pending = Math.max(0, Math.min(safeCategory.pending, Math.floor(basePending * (1 + variation))));
      const missing = Math.max(0, Math.min(safeCategory.missing, Math.floor(baseMissing * (1 + variation))));
      const total = approved + pending + missing;
      
      timelineData.push({
        day: dayLabel,
        approved,
        pending,
        missing,
        total,
      });
    }

    // Generate contractor-specific progress for this category
    const contractorProgress = contractors.map((contractor, index) => {
      const contractorColor = CATEGORY_COLORS[(index + 1) % CATEGORY_COLORS.length];
      const progress = [];
      
      for (let i = 0; i <= days; i++) {
        const progressFactor = i / days;
        const matchedCategory = contractor.categories.find(c => c.id === safeCategory.id || c.name === safeCategory.name);
        let contractorCompletionRate = 0;
        if (matchedCategory) {
          const denom = (matchedCategory.approved || 0) + (matchedCategory.pending || 0) + (matchedCategory.missing || 0);
          contractorCompletionRate = denom > 0 ? (matchedCategory.approved / denom) * 100 : 0;
        } else {
          const denom = (safeCategory.approved || 0) + (safeCategory.pending || 0) + (safeCategory.missing || 0);
          contractorCompletionRate = denom > 0 ? (safeCategory.approved / denom) * 100 : 0;
        }
        const baseProgress = contractorCompletionRate * progressFactor;
        const variation = (Math.random() - 0.5) * 0.15;
        const finalProgress = Math.max(0, Math.min(100, baseProgress * (1 + variation)));
        progress.push(Math.round(finalProgress));
      }
      
      return {
        id: contractor.id,
        name: contractor.name,
        color: contractorColor,
        progress,
      };
    });

    const result = {
      categoryId: safeCategory.id,
      categoryName: safeCategory.name,
      categoryColor,
      timelineData,
      contractors: contractorProgress,
    };

    return result;
  });
};

/**
 * Generate timeline data for multiple categories
 */
export const generateMultiCategoryTimeline = (
  categories: Category[],
  contractors: ContractorData[],
  days: number = 30
): CategoryTimelineData[] => {
  return measurePerformance('generate-multi-category-timeline', () => {
    return categories.map(category => 
      generateCategoryTimeline(category, contractors, days)
    );
  });
};

/**
 * Get category timeline data for chart display
 * Converts CategoryTimelineData to Recharts format
 */
export const formatCategoryTimelineForChart = (categoryData: CategoryTimelineData) => {
  return measurePerformance(`format-category-timeline-chart-${categoryData.categoryId}`, () => {
    return categoryData.timelineData.map((dayData, index) => {
      const chartData: any = {
        day: dayData.day,
        approved: dayData.approved,
        pending: dayData.pending,
        missing: dayData.missing,
        total: dayData.total,
        completionRate: dayData.total > 0 ? Math.round((dayData.approved / dayData.total) * 100) : 0,
      };

      // Add contractor progress lines
      categoryData.contractors.forEach(contractor => {
        chartData[`${contractor.name} Progress`] = contractor.progress[index] || 0;
      });

      return chartData;
    });
  });
};

/**
 * Calculate category timeline summary statistics
 */
export const calculateCategoryTimelineSummary = (categoryData: CategoryTimelineData) => {
  const { timelineData, contractors } = categoryData;
  const latest = timelineData[timelineData.length - 1];
  const first = timelineData[0];
  
  const totalImprovement = latest.approved - first.approved;
  const pendingReduction = first.pending - latest.pending;
  const missingReduction = first.missing - latest.missing;
  
  const avgContractorProgress = contractors.length > 0 
    ? contractors.reduce((sum, c) => sum + (c.progress[c.progress.length - 1] || 0), 0) / contractors.length
    : 0;
  
  return {
    currentCompletion: latest.total > 0 ? Math.round((latest.approved / latest.total) * 100) : 0,
    totalImprovement,
    pendingReduction,
    missingReduction,
    avgContractorProgress: Math.round(avgContractorProgress),
    totalDays: timelineData.length - 1,
    isOnTrack: avgContractorProgress >= 80,
    needsAttention: avgContractorProgress < 60,
  };
};

/**
 * Filter contractors by category performance
 */
export const filterContractorsByCategoryPerformance = (
  contractors: ContractorData[],
  categoryId: string,
  minProgress: number = 0
) => {
  return contractors.filter(contractor => {
    const category = contractor.categories.find(c => c.id === categoryId);
    if (!category) return false;
    
    const completionRate = category.approved + category.pending + category.missing > 0
      ? (category.approved / (category.approved + category.pending + category.missing)) * 100
      : 0;
    
    return completionRate >= minProgress;
  });
};

/**
 * Create category timeline error
 */
export const createCategoryTimelineError = (message: string, categoryId?: string) => {
  console.error('Category Timeline Error:', message, categoryId ? `Category: ${categoryId}` : '');
  return {
    message,
    categoryId,
    timestamp: new Date().toISOString(),
  };
};
