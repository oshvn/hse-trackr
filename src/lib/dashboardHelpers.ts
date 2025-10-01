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
  doc_type_code?: string | null;
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
  search?: string;
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

  const searchTerm = filters.search?.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(item => {
      const record = item as {
        doc_type_name?: string;
        doc_type_code?: string | null;
        contractor_name?: string;
      };

      const docName = record.doc_type_name?.toLowerCase() ?? "";
      const docCode = record.doc_type_code?.toLowerCase() ?? "";
      const contractorName = record.contractor_name?.toLowerCase() ?? "";
      return docName.includes(searchTerm) || docCode.includes(searchTerm) || contractorName.includes(searchTerm);
    });
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
  const eligibleCritical = criticalItems.filter(item => item.required_count > 0);
  const readyCritical = eligibleCritical.filter(item => item.approved_count >= item.required_count);

  return eligibleCritical.length > 0
    ? Math.round((readyCritical.length / eligibleCritical.length) * 100)
    : 0;
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

// Calculate days until due date (non-negative)
export const calculateDueInDays = (plannedDueDate: string | null): number | null => {
  if (!plannedDueDate) return null;
  const today = getCurrentDateBangkok();
  const dueDate = parseISO(plannedDueDate);
  const diff = calculateDaysDifference(today, dueDate);
  return diff >= 0 ? diff : null;
};

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

export const getAmberAlerts = (
  data: DocProgressData[],
  filters: FilterState,
  daysThreshold = 3
): (DocProgressData & { dueInDays: number })[] => {
  const filtered = filterData(data, filters);
  const today = getCurrentDateBangkok();

  return filtered
    .filter(item => item.is_critical && item.status_color === "amber" && item.planned_due_date)
    .map(item => ({
      ...item,
      dueInDays: Math.max(0, calculateDaysDifference(today, parseISO(item.planned_due_date!)))
    }))
    .filter(item => item.dueInDays <= daysThreshold)
    .sort((a, b) => a.dueInDays - b.dueInDays);
};

const STATUS_SEVERITY_RANK: Record<string, number> = {
  red: 3,
  amber: 2,
  green: 1,
};

export interface CategoryProgressSummary {
  category: string;
  approved: number;
  required: number;
  completion: number;
}

export const getCategoryProgress = (
  data: DocProgressData[],
  filters: FilterState
): CategoryProgressSummary[] => {
  const filtered = filterData(data, filters);
  const totals = new Map<string, { approved: number; required: number }>();

  filtered.forEach(item => {
    const entry = totals.get(item.category) ?? { approved: 0, required: 0 };
    entry.approved += item.approved_count;
    entry.required += item.required_count;
    totals.set(item.category, entry);
  });

  return Array.from(totals.entries())
    .map(([category, totalsEntry]) => {
      const { approved, required } = totalsEntry;
      const completion = required > 0 ? Math.round((approved / required) * 100) : 0;
      return { category, approved, required, completion };
    })
    .sort((a, b) => a.completion - b.completion);
};

export interface ProcessSnapshotItem extends DocProgressData {
  overdueDays: number;
  dueInDays: number | null;
  progressPercent: number;
  severityRank: number;
}

const getSeverityRank = (statusColor: string): number => {
  return STATUS_SEVERITY_RANK[statusColor] ?? 0;
};

export const getProcessSnapshot = (
  data: DocProgressData[],
  filters: FilterState,
  limit = 5
): ProcessSnapshotItem[] => {
  const filtered = filterData(data, filters);

  const snapshot = filtered.map(item => {
    const overdueDays = calculateOverdueDays(item.planned_due_date);
    const dueInDays = calculateDueInDays(item.planned_due_date);
    const progressPercent = item.required_count > 0
      ? Math.round((item.approved_count / item.required_count) * 100)
      : 100;

    return {
      ...item,
      overdueDays,
      dueInDays,
      progressPercent,
      severityRank: getSeverityRank(item.status_color),
    };
  });

  snapshot.sort((a, b) => {
    if (b.severityRank !== a.severityRank) {
      return b.severityRank - a.severityRank;
    }

    if (a.severityRank === 3 || b.severityRank === 3) {
      if (b.overdueDays !== a.overdueDays) {
        return b.overdueDays - a.overdueDays;
      }
    }

    if (a.severityRank === 2 && b.severityRank === 2) {
      const dueA = a.dueInDays ?? Number.MAX_SAFE_INTEGER;
      const dueB = b.dueInDays ?? Number.MAX_SAFE_INTEGER;
      if (dueA !== dueB) {
        return dueA - dueB;
      }
    }

    if (a.progressPercent !== b.progressPercent) {
      return a.progressPercent - b.progressPercent;
    }

    const dueTimeA = a.planned_due_date ? parseISO(a.planned_due_date).getTime() : Number.MAX_SAFE_INTEGER;
    const dueTimeB = b.planned_due_date ? parseISO(b.planned_due_date).getTime() : Number.MAX_SAFE_INTEGER;
    return dueTimeA - dueTimeB;
  });

  return snapshot.slice(0, Math.max(limit, 0));
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
