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
  quality_score?: number | null;
  speed_score?: number | null;
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
  planned_date?: string | null;
  status_color: string;
  first_started_at: string | null;
  first_submitted_at: string | null;
  first_approved_at: string | null;
}

export interface ContractorCategoryProgressItem {
  contractorId: string;
  contractorName: string;
  categoryName: string;
  completionPercentage: number;
  approved: number;
  required: number;
}

export interface MilestoneProgressItem {
  id: string;
  contractorId: string;
  contractorName: string;
  docTypeId: string;
  docTypeName: string;
  plannedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  completionPercentage: number;
  statusColor: string;
  approvedCount: number;
  requiredCount: number;
}

export interface CriticalAlertItem {
  contractorId: string;
  contractorName: string;
  docTypeId: string;
  docTypeName: string;
  plannedDueDate: string | null;
  approvedCount: number;
  requiredCount: number;
  overdueDays: number;
  dueInDays: number | null;
}

export interface ContractorProcessingTimeStats {
  contractorId: string;
  contractorName: string;
  averagePrepDays: number | null;
  longestPrepDays: number | null;
  averageApprovalDays: number | null;
  longestApprovalDays: number | null;
}

export type ActionSuggestionSeverity = "high" | "medium" | "low";

export interface ActionSuggestion {
  id: string;
  contractorId: string;
  contractorName: string;
  severity: ActionSuggestionSeverity;
  message: string;
  relatedDocuments: string[];
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

export const calculateDetailedProgressByContractor = (
  data: DocProgressData[]
): ContractorCategoryProgressItem[] => {
  const aggregates = new Map<string, {
    contractorId: string;
    contractorName: string;
    categoryName: string;
    approved: number;
    required: number;
  }>();

  data.forEach(item => {
    const key = `${item.contractor_id}__${item.category}`;
    const entry = aggregates.get(key);

    if (entry) {
      entry.approved += item.approved_count;
      entry.required += item.required_count;
      return;
    }

    aggregates.set(key, {
      contractorId: item.contractor_id,
      contractorName: item.contractor_name,
      categoryName: item.category,
      approved: item.approved_count,
      required: item.required_count,
    });
  });

  return Array.from(aggregates.values())
    .map(item => ({
      contractorId: item.contractorId,
      contractorName: item.contractorName,
      categoryName: item.categoryName,
      approved: item.approved,
      required: item.required,
      completionPercentage: item.required > 0
        ? Math.round((item.approved / item.required) * 100)
        : 0,
    }))
    .sort((a, b) => {
      const byContractor = a.contractorName.localeCompare(b.contractorName);
      if (byContractor !== 0) {
        return byContractor;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });
};

export const calculateMilestoneProgress = (
  data: DocProgressData[]
): MilestoneProgressItem[] => {
  return data
    .filter(item => (item.planned_date ?? item.planned_due_date) !== null)
    .map(item => {
      const plannedDate = item.planned_date ?? item.planned_due_date;
      const completion = item.required_count > 0
        ? Math.min(100, Math.round((item.approved_count / item.required_count) * 100))
        : 0;
      const startDate = item.first_started_at ?? item.first_submitted_at ?? plannedDate;
      const endDate = item.first_approved_at ?? plannedDate;

      return {
        id: `${item.contractor_id}-${item.doc_type_id}`,
        contractorId: item.contractor_id,
        contractorName: item.contractor_name,
        docTypeId: item.doc_type_id,
        docTypeName: item.doc_type_name,
        plannedDate,
        startDate,
        endDate,
        completionPercentage: completion,
        statusColor: item.status_color,
        approvedCount: item.approved_count,
        requiredCount: item.required_count,
      };
    })
    .sort((a, b) => {
      if (!a.plannedDate || !b.plannedDate) {
        return a.plannedDate ? -1 : b.plannedDate ? 1 : 0;
      }
      return parseISO(a.plannedDate).getTime() - parseISO(b.plannedDate).getTime();
    });
};

export const extractCriticalAlerts = (
  data: DocProgressData[],
  criticalDocTypeIds: Iterable<string> = []
): CriticalAlertItem[] => {
  const criticalIds = new Set(Array.from(criticalDocTypeIds));
  const shouldFallbackToLegacy = criticalIds.size === 0;

  return data
    .filter(item => {
      const isCritical = shouldFallbackToLegacy ? item.is_critical : criticalIds.has(item.doc_type_id);
      if (!isCritical) {
        return false;
      }

      return item.required_count > 0 && item.approved_count < item.required_count;
    })
    .map(item => {
      const overdueDays = calculateOverdueDays(item.planned_due_date);
      const dueInDays = calculateDueInDays(item.planned_due_date);

      return {
        contractorId: item.contractor_id,
        contractorName: item.contractor_name,
        docTypeId: item.doc_type_id,
        docTypeName: item.doc_type_name,
        plannedDueDate: item.planned_due_date,
        approvedCount: item.approved_count,
        requiredCount: item.required_count,
        overdueDays,
        dueInDays,
      } as CriticalAlertItem;
    })
    .sort((a, b) => {
      if (a.overdueDays !== b.overdueDays) {
        return b.overdueDays - a.overdueDays;
      }
      if (a.dueInDays === null || b.dueInDays === null) {
        return a.dueInDays === null ? 1 : -1;
      }
      return a.dueInDays - b.dueInDays;
    });
};

export const calculateProcessingTimes = (
  data: DocProgressData[]
): ContractorProcessingTimeStats[] => {
  const grouped = new Map<string, {
    contractorId: string;
    contractorName: string;
    prepDurations: number[];
    approvalDurations: number[];
  }>();

  data.forEach(item => {
    let bucket = grouped.get(item.contractor_id);
    if (!bucket) {
      bucket = {
        contractorId: item.contractor_id,
        contractorName: item.contractor_name,
        prepDurations: [],
        approvalDurations: [],
      };
      grouped.set(item.contractor_id, bucket);
    }

    if (item.first_started_at && item.first_submitted_at) {
      const diff = calculateDaysDifference(item.first_started_at, item.first_submitted_at);
      if (!Number.isNaN(diff)) {
        bucket.prepDurations.push(Math.max(0, diff));
      }
    }

    if (item.first_submitted_at && item.first_approved_at) {
      const diff = calculateDaysDifference(item.first_submitted_at, item.first_approved_at);
      if (!Number.isNaN(diff)) {
        bucket.approvalDurations.push(Math.max(0, diff));
      }
    }
  });

  const average = (vals: number[]): number | null => {
    if (vals.length === 0) {
      return null;
    }
    const total = vals.reduce((sum, value) => sum + value, 0);
    return Math.round((total / vals.length) * 10) / 10;
  };

  const longest = (vals: number[]): number | null => {
    if (vals.length === 0) {
      return null;
    }
    return Math.max(...vals);
  };

  return Array.from(grouped.values()).map(item => ({
    contractorId: item.contractorId,
    contractorName: item.contractorName,
    averagePrepDays: average(item.prepDurations),
    longestPrepDays: longest(item.prepDurations),
    averageApprovalDays: average(item.approvalDurations),
    longestApprovalDays: longest(item.approvalDurations),
  }));
};

export const generateActionSuggestions = (
  alerts: CriticalAlertItem[]
): ActionSuggestion[] => {
  if (!alerts || alerts.length === 0) {
    return [];
  }

  const groups = new Map<string, { contractorName: string; alerts: CriticalAlertItem[] }>();

  alerts.forEach(alert => {
    const group = groups.get(alert.contractorId);
    if (group) {
      group.alerts.push(alert);
      return;
    }

    groups.set(alert.contractorId, {
      contractorName: alert.contractorName,
      alerts: [alert],
    });
  });

  const severityRank: Record<ActionSuggestionSeverity, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const suggestions: ActionSuggestion[] = [];

  groups.forEach((group, contractorId) => {
    const contractorName = group.contractorName;
    const alertsForContractor = group.alerts;
    const overdueAlerts = alertsForContractor.filter(alert => alert.overdueDays > 0);
    const overdueHeavy = overdueAlerts.filter(alert => alert.overdueDays >= 7);
    const dueSoon = alertsForContractor.filter(alert => alert.overdueDays === 0 && alert.dueInDays !== null && alert.dueInDays <= 2);

    if (alertsForContractor.length >= 3) {
      suggestions.push({
        id: `${contractorId}-war-room`,
        contractorId,
        contractorName,
        severity: 'high',
        message: `Schedule an escalation meeting with ${contractorName} to address ${alertsForContractor.length} outstanding critical documents immediately.`,
        relatedDocuments: alertsForContractor.map(alert => alert.docTypeName),
      });
    }

    if (overdueHeavy.length > 0) {
      const names = overdueHeavy.map(alert => alert.docTypeName).join(', ');
      suggestions.push({
        id: `${contractorId}-escalate`,
        contractorId,
        contractorName,
        severity: 'high',
        message: `Initiate executive escalation for ${names}; these items are over 7 days late.`,
        relatedDocuments: overdueHeavy.map(alert => alert.docTypeName),
      });
    }

    if (dueSoon.length > 0) {
      const names = dueSoon.map(alert => alert.docTypeName).join(', ');
      suggestions.push({
        id: `${contractorId}-daily-followup`,
        contractorId,
        contractorName,
        severity: 'medium',
        message: `Set up daily progress checkpoints for ${contractorName} on ${names} before the deadline hits.`,
        relatedDocuments: dueSoon.map(alert => alert.docTypeName),
      });
    }

    const remaining = alertsForContractor.length - overdueHeavy.length - dueSoon.length;
    if (remaining > 0) {
      suggestions.push({
        id: `${contractorId}-support`,
        contractorId,
        contractorName,
        severity: 'low',
        message: `Provide checklist guidance to ${contractorName} for the remaining ${remaining} critical documents in progress.`,
        relatedDocuments: alertsForContractor.map(alert => alert.docTypeName),
      });
    }
  });

  return suggestions.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
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
