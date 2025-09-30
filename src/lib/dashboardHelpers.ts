import { differenceInDays, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Bangkok';

export interface KpiData {
  contractor_id: string;
  contractor_name: string;
  completion_ratio: number;
  must_have_ready_ratio: number;
  avg_prep_days: number;
  avg_approval_days: number;
  red_items: number;
}

export interface DocProgressData {
  contractor_id: string;
  contractor_name: string;
  doc_type_id: string;
  doc_type_name: string;
  category: string;
  is_critical: boolean;
  required_count: number;
  approved_count: number;
  planned_due_date: string | null;
  status_color: string;
  first_started_at: string | null;
  first_submitted_at: string | null;
  first_approved_at: string | null;
}

export interface FilterState {
  contractor: string;
  category: string;
}

// Get current date in Bangkok timezone
export const getCurrentDateBangkok = () => {
  return toZonedTime(new Date(), TIMEZONE);
};

// Calculate days between two dates, timezone-safe
export const calculateDaysDifference = (startDate: string | Date, endDate: string | Date) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(toZonedTime(end, TIMEZONE), toZonedTime(start, TIMEZONE));
};

// Filter data based on current filters
export const filterData = <T extends { contractor_id: string; category?: string | null }>(
  data: T[],
  filters: FilterState
): T[] => {
  let filtered = data;

  if (filters.contractor !== "all") {
    filtered = filtered.filter(item => item.contractor_id === filters.contractor);
  }

  if (filters.category !== "all") {
    filtered = filtered.filter(item => ("category" in item ? item.category === filters.category : true));
  }

  return filtered;
};

// Calculate Overall Completion %
export const calculateOverallCompletion = (
  data: DocProgressData[],
  filters: FilterState,
  kpiData: KpiData[]
): number => {
  if (filters.contractor !== 'all') {
    // Single contractor - use KPI data
    const contractor = kpiData.find(k => k.contractor_id === filters.contractor);
    return contractor ? Math.round(contractor.completion_ratio * 100) : 0;
  }

  // All contractors - calculate from doc progress
  const filtered = filterData(data, filters);
  const totalRequired = filtered.reduce((sum, item) => sum + item.required_count, 0);
  const totalApproved = filtered.reduce((sum, item) => sum + item.approved_count, 0);
  
  return totalRequired > 0 ? Math.round((totalApproved / totalRequired) * 100) : 0;
};

// Calculate Must-have Ready %
export const calculateMustHaveReady = (
  data: DocProgressData[],
  filters: FilterState,
  kpiData: KpiData[]
): number => {
  if (filters.contractor !== 'all') {
    // Single contractor - use KPI data
    const contractor = kpiData.find(k => k.contractor_id === filters.contractor);
    return contractor ? Math.round(contractor.must_have_ready_ratio * 100) : 0;
  }

  // All contractors - calculate from doc progress
  const filtered = filterData(data, filters);
  const criticalItems = filtered.filter(item => item.is_critical);
  const readyCritical = criticalItems.filter(item => item.approved_count > 0);
  
  return criticalItems.length > 0 ? Math.round((readyCritical.length / criticalItems.length) * 100) : 0;
};

// Calculate Overdue Must-Haves count
export const calculateOverdueMustHaves = (
  data: DocProgressData[],
  filters: FilterState
): number => {
  const filtered = filterData(data, filters);
  return filtered.filter(item => 
    item.is_critical && item.status_color === 'red'
  ).length;
};

// Calculate Average Prep Time
export const calculateAvgPrepTime = (
  data: DocProgressData[],
  filters: FilterState,
  kpiData: KpiData[]
): number => {
  if (filters.contractor !== 'all') {
    // Single contractor - use KPI data
    const contractor = kpiData.find(k => k.contractor_id === filters.contractor);
    return contractor ? Math.round(contractor.avg_prep_days) : 0;
  }

  // All contractors - calculate from timestamps
  const filtered = filterData(data, filters);
  const itemsWithBothDates = filtered.filter(item => 
    item.first_started_at && item.first_submitted_at
  );

  if (itemsWithBothDates.length === 0) return 0;

  const totalDays = itemsWithBothDates.reduce((sum, item) => {
    return sum + calculateDaysDifference(item.first_started_at!, item.first_submitted_at!);
  }, 0);

  return Math.round(totalDays / itemsWithBothDates.length);
};

// Calculate Average Approval Time
export const calculateAvgApprovalTime = (
  data: DocProgressData[],
  filters: FilterState,
  kpiData: KpiData[]
): number => {
  if (filters.contractor !== 'all') {
    // Single contractor - use KPI data
    const contractor = kpiData.find(k => k.contractor_id === filters.contractor);
    return contractor ? Math.round(contractor.avg_approval_days) : 0;
  }

  // All contractors - calculate from timestamps
  const filtered = filterData(data, filters);
  const itemsWithBothDates = filtered.filter(item => 
    item.first_submitted_at && item.first_approved_at
  );

  if (itemsWithBothDates.length === 0) return 0;

  const totalDays = itemsWithBothDates.reduce((sum, item) => {
    return sum + calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!);
  }, 0);

  return Math.round(totalDays / itemsWithBothDates.length);
};

// Calculate overdue days for an item
export const calculateOverdueDays = (plannedDueDate: string | null): number => {
  if (!plannedDueDate) return 0;
  const today = getCurrentDateBangkok();
  const dueDate = parseISO(plannedDueDate);
  return Math.max(0, calculateDaysDifference(dueDate, today));
};

// Get red cards (overdue must-haves)
export const getRedCards = (
  data: DocProgressData[],
  filters: FilterState
): (DocProgressData & { overdueDays: number })[] => {
  const filtered = filterData(data, filters);
  return filtered
    .filter(item => item.is_critical && item.status_color === "red")
    .map(item => ({
      ...item,
      overdueDays: calculateOverdueDays(item.planned_due_date)
    }))
    .filter(item => item.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

// Format days
export const formatDays = (value: number): string => {
  if (value === 0) return '—';
  return `${value} day${value !== 1 ? 's' : ''}`;
};

// Format count
export const formatCount = (value: number): string => {
  return value.toString();
};

// Get status color CSS class
export const getStatusColorClass = (statusColor: string): string => {
  switch (statusColor) {
    case 'green':
      return 'bg-green-100 border-green-200';
    case 'amber':
      return 'bg-amber-100 border-amber-200';
    case 'red':
      return 'bg-red-100 border-red-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};
