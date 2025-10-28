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

// Enhanced Red Card interface with 3 warning levels
export interface RedCardItem extends CriticalAlertItem {
  // Warning level: 1 (Early), 2 (Urgent), 3 (Overdue)
  warningLevel: 1 | 2 | 3;
  
  // Progress percentage
  progressPercentage: number;
  
  // Recommended actions based on warning level
  recommendedActions: string[];
  
  // Color coding for UI
  colorCode: 'amber' | 'orange' | 'red';
  
  // Time metrics
  daysUntilDue: number | null;
  daysOverdue: number;
  
  // Risk assessment
  riskScore: number; // 0-100
  
  // AI recommendations (if available)
  aiRecommendations?: string[];
  
  // Action buttons configuration
  actionButtons: {
    label: string;
    action: string;
    severity: 'primary' | 'secondary' | 'destructive';
  }[];
}

// Red Card Level configuration
export interface RedCardLevelConfig {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  colorCode: 'amber' | 'orange' | 'red';
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
  progressThreshold: number;
  timeThreshold: number;
  actions: string[];
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

// Calculate total approved and required documents
export const calculateTotalDocuments = (
  data: DocProgressData[],
  filters: FilterState
): { approved: number; required: number } => {
  const filtered = filterData(data, filters);
  const totalRequired = filtered.reduce((sum, item) => sum + item.required_count, 0);
  const totalApproved = filtered.reduce((sum, item) => sum + item.approved_count, 0);
  
  return { approved: totalApproved, required: totalRequired };
};

// Estimate completion time based on current progress rate
export const estimateCompletionTime = (
  data: DocProgressData[],
  filters: FilterState
): string => {
  const filtered = filterData(data, filters);
  const totalRequired = filtered.reduce((sum, item) => sum + item.required_count, 0);
  const totalApproved = filtered.reduce((sum, item) => sum + item.approved_count, 0);
  
  if (totalApproved === 0 || totalRequired === totalApproved) {
    return 'Không thể xác định';
  }
  
  // Calculate approval rate per week (simplified calculation)
  const today = getCurrentDateBangkok();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentApprovals = filtered.filter(item =>
    item.first_approved_at && parseISO(item.first_approved_at) >= oneWeekAgo
  ).length;
  
  if (recentApprovals === 0) {
    return 'Không thể xác định';
  }
  
  const remaining = totalRequired - totalApproved;
  const weeksNeeded = Math.ceil(remaining / recentApprovals);
  
  const completionDate = new Date(today);
  completionDate.setDate(completionDate.getDate() + (weeksNeeded * 7));
  
  return completionDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Calculate red cards data
export const calculateRedCardsData = (
  data: DocProgressData[],
  filters: FilterState
): {
  total: number;
  missing: number;
  overdue: number;
  contractorsCantStart: number;
} => {
  const filtered = filterData(data, filters);
  const criticalItems = filtered.filter(item => item.is_critical);
  
  // Missing documents (required but not submitted)
  const missing = criticalItems.filter(item =>
    item.required_count > 0 && item.approved_count === 0
  ).length;
  
  // Overdue documents (past due date)
  const overdue = criticalItems.filter(item => {
    if (!item.planned_due_date) return false;
    const overdueDays = calculateOverdueDays(item.planned_due_date);
    return overdueDays > 0 && item.approved_count < item.required_count;
  }).length;
  
  // Contractors who can't start (missing critical documents)
  const contractorsWithCriticalIssues = new Set(
    criticalItems
      .filter(item => item.required_count > 0 && item.approved_count < item.required_count)
      .map(item => item.contractor_id)
  );
  
  return {
    total: missing + overdue,
    missing,
    overdue,
    contractorsCantStart: contractorsWithCriticalIssues.size
  };
};

// Calculate approval time comparison with previous week
export const calculateApprovalTimeComparison = (
  data: DocProgressData[],
  filters: FilterState
): { current: number; lastWeek: number } => {
  const filtered = filterData(data, filters);
  const today = getCurrentDateBangkok();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  // Current week approvals
  const currentWeekApprovals = filtered.filter(item =>
    item.first_submitted_at && item.first_approved_at &&
    parseISO(item.first_approved_at) >= oneWeekAgo
  );
  
  // Last week approvals
  const lastWeekApprovals = filtered.filter(item =>
    item.first_submitted_at && item.first_approved_at &&
    parseISO(item.first_approved_at) >= twoWeeksAgo &&
    parseISO(item.first_approved_at) < oneWeekAgo
  );
  
  const calculateAverageTime = (approvals: any[]) => {
    if (approvals.length === 0) return 0;
    
    const totalTime = approvals.reduce((sum, item) => {
      const days = calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!);
      return sum + Math.max(0, days);
    }, 0);
    
    return Math.round(totalTime / approvals.length);
  };
  
  return {
    current: calculateAverageTime(currentWeekApprovals),
    lastWeek: calculateAverageTime(lastWeekApprovals)
  };
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

// Red Card Level configurations
export const RED_CARD_LEVELS: Record<1 | 2 | 3, RedCardLevelConfig> = {
  1: {
    level: 1,
    name: 'Cảnh báo sớm',
    description: 'Tài liệu sẽ đến hạn trong 7 ngày',
    colorCode: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    icon: 'Clock',
    progressThreshold: 20,
    timeThreshold: 7,
    actions: [
      'Gửi email nhắc nhở',
      'Lên lịch họp review',
      'Cung cấp hỗ trợ kỹ thuật'
    ]
  },
  2: {
    level: 2,
    name: 'Cảnh báo khẩn',
    description: 'Tài liệu sẽ đến hạn trong 3 ngày',
    colorCode: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    icon: 'AlertTriangle',
    progressThreshold: 50,
    timeThreshold: 3,
    actions: [
      'Họp hàng ngày',
      'Escalation cho quản lý',
      'Gán mentor hỗ trợ'
    ]
  },
  3: {
    level: 3,
    name: 'Quá hạn',
    description: 'Tài liệu đã quá hạn',
    colorCode: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    icon: 'XCircle',
    progressThreshold: 80,
    timeThreshold: 0,
    actions: [
      'NGƯNG thi công',
      'Họp với ban lãnh đạo',
      'Xem xét thay thế nhà thầu'
    ]
  }
};

// Calculate warning level based on progress and time
export const calculateWarningLevel = (
  progressPercentage: number,
  daysUntilDue: number | null,
  overdueDays: number
): 1 | 2 | 3 => {
  // Level 3: Overdue
  if (overdueDays > 0) {
    return 3;
  }
  
  // Level 2: Urgent (due in 3 days or less with low progress)
  if (daysUntilDue !== null && daysUntilDue <= 3 && progressPercentage < 50) {
    return 2;
  }
  
  // Level 1: Early warning (due in 7 days or less with very low progress)
  if (daysUntilDue !== null && daysUntilDue <= 7 && progressPercentage < 20) {
    return 1;
  }
  
  // Default to level 3 if overdue but not caught by above conditions
  if (overdueDays > 0) {
    return 3;
  }
  
  // Default to level 2 if due soon but not caught by above conditions
  if (daysUntilDue !== null && daysUntilDue <= 3) {
    return 2;
  }
  
  // Default to level 1 if due in 7 days but not caught by above conditions
  if (daysUntilDue !== null && daysUntilDue <= 7) {
    return 1;
  }
  
  // Default to lowest level if no specific conditions met
  return 1;
};

// Calculate risk score (0-100)
export const calculateRiskScore = (
  progressPercentage: number,
  daysUntilDue: number | null,
  overdueDays: number,
  isCritical: boolean
): number => {
  let riskScore = 0;
  
  // Base risk from progress (inverse - lower progress = higher risk)
  riskScore += (100 - progressPercentage) * 0.4;
  
  // Risk from overdue days
  if (overdueDays > 0) {
    riskScore += Math.min(overdueDays * 5, 40); // Max 40 points from overdue
  }
  
  // Risk from approaching deadline
  if (daysUntilDue !== null && daysUntilDue <= 7) {
    riskScore += (7 - daysUntilDue) * 4; // Max 28 points from approaching deadline
  }
  
  // Bonus risk for critical documents
  if (isCritical) {
    riskScore += 20;
  }
  
  return Math.min(100, Math.round(riskScore));
};

// Convert CriticalAlertItem to RedCardItem with enhanced properties
export const convertToRedCardItem = (
  item: CriticalAlertItem,
  isCritical: boolean = true
): RedCardItem => {
  const progressPercentage = item.requiredCount > 0
    ? Math.round((item.approvedCount / item.requiredCount) * 100)
    : 0;
  
  const daysUntilDue = item.dueInDays;
  const overdueDays = item.overdueDays;
  
  const warningLevel = calculateWarningLevel(progressPercentage, daysUntilDue, overdueDays);
  const levelConfig = RED_CARD_LEVELS[warningLevel];
  
  const riskScore = calculateRiskScore(progressPercentage, daysUntilDue, overdueDays, isCritical);
  
  // Generate action buttons based on warning level
  const actionButtons = levelConfig.actions.map((action, index) => ({
    label: action,
    action: `execute-${action.toLowerCase().replace(/\s+/g, '-')}`,
    severity: warningLevel === 3 ? 'destructive' as const :
              warningLevel === 2 ? 'secondary' as const : 'primary' as const
  }));
  
  return {
    ...item,
    warningLevel,
    progressPercentage,
    recommendedActions: levelConfig.actions,
    colorCode: levelConfig.colorCode,
    daysUntilDue,
    daysOverdue: overdueDays,
    riskScore,
    actionButtons
  };
};

// Enhanced function to extract and categorize red cards by level
export const extractRedCardsByLevel = (
  data: DocProgressData[],
  criticalDocTypeIds: Iterable<string> = []
): {
  level1: RedCardItem[];
  level2: RedCardItem[];
  level3: RedCardItem[];
  all: RedCardItem[];
} => {
  const criticalAlerts = extractCriticalAlerts(data, criticalDocTypeIds);
  
  const redCards = criticalAlerts.map(item => {
    // Check if this is a critical document type
    const criticalIds = new Set(Array.from(criticalDocTypeIds));
    const isCritical = criticalIds.size === 0
      ? data.find(d => d.doc_type_id === item.docTypeId)?.is_critical || false
      : criticalIds.has(item.docTypeId);
    
    return convertToRedCardItem(item, isCritical);
  });
  
  // Categorize by warning level
  const level1 = redCards.filter(card => card.warningLevel === 1);
  const level2 = redCards.filter(card => card.warningLevel === 2);
  const level3 = redCards.filter(card => card.warningLevel === 3);
  
  // Sort each level by risk score (highest first)
  level1.sort((a, b) => b.riskScore - a.riskScore);
  level2.sort((a, b) => b.riskScore - a.riskScore);
  level3.sort((a, b) => b.riskScore - a.riskScore);
  
  return {
    level1,
    level2,
    level3,
    all: redCards
  };
};

// Get red cards statistics
export const getRedCardsStatistics = (
  redCardsByLevel: {
    level1: RedCardItem[];
    level2: RedCardItem[];
    level3: RedCardItem[];
    all: RedCardItem[];
  }
): {
  total: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  highRiskCount: number;
  contractorsAffected: number;
  averageRiskScore: number;
} => {
  const { level1, level2, level3, all } = redCardsByLevel;
  
  // Count unique contractors affected
  const contractorsAffected = new Set(all.map(card => card.contractorId)).size;
  
  // Count high risk items (risk score > 70)
  const highRiskCount = all.filter(card => card.riskScore > 70).length;
  
  // Calculate average risk score
  const averageRiskScore = all.length > 0
    ? Math.round(all.reduce((sum, card) => sum + card.riskScore, 0) / all.length)
    : 0;
  
  return {
    total: all.length,
    level1Count: level1.length,
    level2Count: level2.length,
    level3Count: level3.length,
    highRiskCount,
    contractorsAffected,
    averageRiskScore
  };
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

// Contractor Performance Comparison Functions

// Calculate contractor performance scores for comparison
export const calculateContractorPerformanceScores = (
  kpiData: KpiData[],
  docProgressData?: DocProgressData[]
): {
  contractorId: string;
  contractorName: string;
  completion: number;
  quality: number;
  speed: number;
  compliance: number;
  weightedScore: number;
  rank: number;
}[] => {
  const weights = {
    completion: 0.3,
    quality: 0.25,
    speed: 0.2,
    compliance: 0.25
  };

  const scores = kpiData.map(kpi => {
    // Calculate individual KPIs
    const completion = Math.round(kpi.completion_ratio * 100);
    
    // Calculate must-have ready (compliance)
    let mustHaveReady = 100;
    if (kpi.red_items > 0 && docProgressData) {
      const contractorDocs = docProgressData.filter(doc => doc.contractor_id === kpi.contractor_id);
      const criticalDocs = contractorDocs.filter(doc => doc.is_critical);
      const totalCritical = criticalDocs.reduce((sum, doc) => sum + doc.required_count, 0);
      
      if (totalCritical > 0) {
        mustHaveReady = Math.max(0, 100 - (kpi.red_items / totalCritical) * 100);
      }
    }
    
    const quality = Math.round(kpi.completion_ratio * 100);
    const speed = kpi.avg_approval_days > 0
      ? Math.min(100, Math.round(100 / (kpi.avg_approval_days + 1)))
      : 100;
    
    // Calculate weighted score
    const weightedScore = Math.round(
      completion * weights.completion +
      quality * weights.quality +
      speed * weights.speed +
      mustHaveReady * weights.compliance
    );

    return {
      contractorId: kpi.contractor_id,
      contractorName: kpi.contractor_name,
      completion,
      quality,
      speed,
      compliance: Math.round(mustHaveReady),
      weightedScore,
      rank: 0 // Will be calculated after sorting
    };
  });

  // Sort by weighted score and assign ranks
  scores.sort((a, b) => b.weightedScore - a.weightedScore);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
};

// Generate trend data for contractors over time
export const generateContractorTrendData = (
  kpiData: KpiData[],
  docProgressData?: DocProgressData[],
  days: number = 7
): {
  date: string;
  [key: string]: number | string;
}[] => {
  const today = new Date();
  const trendData: { date: string; [key: string]: number | string }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dataPoint: { date: string; [key: string]: number | string } = { date: dateStr };
    
    kpiData.forEach(kpi => {
      const completion = Math.round(kpi.completion_ratio * 100);
      // Add some variation to simulate trend
      const variation = Math.random() * 20 - 10; // ±10% variation
      const value = Math.max(0, Math.min(100, completion + variation));
      dataPoint[kpi.contractor_name] = Math.round(value);
    });
    
    trendData.push(dataPoint);
  }
  
  return trendData;
};

// Calculate heatmap data for contractors by document type
export const calculateContractorHeatmapData = (
  docProgressData: DocProgressData[],
  contractorIds?: string[]
): {
  contractorId: string;
  contractorName: string;
  docType: string;
  docTypeId: string;
  value: number;
  status: 'good' | 'average' | 'poor';
  approved: number;
  required: number;
}[] => {
  const heatmapData: {
    contractorId: string;
    contractorName: string;
    docType: string;
    docTypeId: string;
    value: number;
    status: 'good' | 'average' | 'poor';
    approved: number;
    required: number;
  }[] = [];

  const filteredData = contractorIds?.length
    ? docProgressData.filter(doc => contractorIds.includes(doc.contractor_id))
    : docProgressData;

  // Group by contractor and document type
  const grouped = new Map<string, {
    contractorId: string;
    contractorName: string;
    docType: string;
    docTypeId: string;
    approved: number;
    required: number;
  }>();

  filteredData.forEach(doc => {
    const key = `${doc.contractor_id}-${doc.doc_type_id}`;
    const existing = grouped.get(key);
    
    if (existing) {
      existing.approved += doc.approved_count;
      existing.required += doc.required_count;
    } else {
      grouped.set(key, {
        contractorId: doc.contractor_id,
        contractorName: doc.contractor_name,
        docType: doc.doc_type_name,
        docTypeId: doc.doc_type_id,
        approved: doc.approved_count,
        required: doc.required_count
      });
    }
  });

  // Convert to heatmap data with status
  grouped.forEach((data, key) => {
    const completion = data.required > 0 ? Math.round((data.approved / data.required) * 100) : 0;
    const status = completion >= 80 ? 'good' : completion >= 60 ? 'average' : 'poor';
    
    heatmapData.push({
      ...data,
      value: completion,
      status
    });
  });

  return heatmapData;
};

// Calculate performance predictions based on trends
export const calculatePerformancePredictions = (
  trendData: { date: string; [key: string]: number | string }[],
  contractorNames: string[]
): {
  contractor: string;
  current: number;
  prediction: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}[] => {
  return contractorNames.map(name => {
    const values = trendData.map(d => d[name]).filter(v => v !== undefined) as number[];
    
    if (values.length < 2) {
      return {
        contractor: name,
        current: 0,
        prediction: 0,
        confidence: 0,
        trend: 'stable' as const
      };
    }

    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    
    // Simple linear prediction
    const prediction = Math.max(0, Math.min(100, current + change));
    
    // Calculate confidence based on consistency
    const recentValues = values.slice(-5); // Last 5 data points
    const avgChange = recentValues.length > 1
      ? recentValues.reduce((sum, val, i) => i > 0 ? sum + (val - recentValues[i-1]) : sum, 0) / (recentValues.length - 1)
      : 0;
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - (recentValues.reduce((s, v) => s + v, 0) / recentValues.length), 2), 0) / recentValues.length;
    const consistency = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';
    
    return {
      contractor: name,
      current,
      prediction: Math.round(prediction),
      confidence: Math.round(consistency),
      trend
    };
  });
};

// Export functions for different formats
export const exportToPNG = async (elementId: string, filename: string = 'chart.png'): Promise<void> => {
  // This would integrate with html2canvas or similar library
  console.log(`Exporting ${elementId} to PNG as ${filename}`);
  // Implementation would depend on the specific library used
};

export const exportToPDF = async (elementId: string, filename: string = 'chart.pdf'): Promise<void> => {
  // This would integrate with jsPDF or similar library
  console.log(`Exporting ${elementId} to PDF as ${filename}`);
  // Implementation would depend on the specific library used
};

export const exportToExcel = (data: any[], filename: string = 'data.xlsx'): void => {
  // This would integrate with xlsx or similar library
  console.log(`Exporting data to Excel as ${filename}`);
  // Implementation would depend on the specific library used
};

// Accessibility helpers
export const getAriaLabel = (chartType: string, data: any): string => {
  switch (chartType) {
    case 'radar':
      return `Biểu đồ radar so sánh hiệu suất ${data.contractors?.length || 0} nhà thầu theo các chỉ số: hoàn thành, chất lượng, tốc độ, tuân thủ`;
    case 'bar':
      return `Biểu đồ cột so sánh hiệu suất theo chỉ số ${data.metric || 'chưa chọn'}`;
    case 'heatmap':
      return `Biểu đồ nhiệt hiển thị hiệu suất theo loại hồ sơ và nhà thầu`;
    case 'trend':
      return `Biểu đồ xu hướng hiệu suất trong ${data.days || 7} ngày gần đây`;
    case 'ranking':
      return `Bảng xếp hạng hiệu suất ${data.contractors?.length || 0} nhà thầu theo điểm số có trọng số`;
    default:
      return 'Biểu đồ so sánh hiệu suất nhà thầu';
  }
};

export const getKeyboardNavigationHelp = (): { key: string; description: string }[] => {
  return [
    { key: 'Tab', description: 'Di chuyển giữa các element' },
    { key: 'Enter/Space', description: 'Kích hoạt button hoặc link' },
    { key: 'Arrow Keys', description: 'Điều hướng trong biểu đồ' },
    { key: 'Escape', description: 'Đóng modal hoặc popup' },
    { key: '+/-', description: 'Zoom in/out trong biểu đồ' }
  ];
};

// Processing Time Analysis Functions

export interface ProcessingTimeMetrics {
  averagePrepDays: number;
  averageApprovalDays: number;
  averageTotalDays: number;
  targetPrepDays: number;
  targetApprovalDays: number;
  targetTotalDays: number;
  prepTimeVsTarget: number; // percentage
  approvalTimeVsTarget: number; // percentage
  totalTimeVsTarget: number; // percentage
  lastWeekPrepDays: number;
  lastWeekApprovalDays: number;
  lastWeekTotalDays: number;
  prepTimeTrend: 'up' | 'down' | 'stable';
  approvalTimeTrend: 'up' | 'down' | 'stable';
  totalTimeTrend: 'up' | 'down' | 'stable';
}

export interface TimelineEvent {
  id: string;
  contractorId: string;
  contractorName: string;
  docTypeId: string;
  docTypeName: string;
  docTypeCode?: string | null;
  category: string;
  startDate: string | null;
  submitDate: string | null;
  approvalDate: string | null;
  plannedDueDate: string | null;
  prepDays: number | null;
  approvalDays: number | null;
  totalDays: number | null;
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'overdue';
  isCritical: boolean;
  bottleneckStage: 'preparation' | 'approval' | 'none';
  bottleneckDays: number;
}

export interface ContractorProcessingTimeComparison {
  contractorId: string;
  contractorName: string;
  averagePrepDays: number;
  averageApprovalDays: number;
  averageTotalDays: number;
  prepTimeRank: number;
  approvalTimeRank: number;
  totalTimeRank: number;
  overallRank: number;
  performanceScore: number;
  trendData: {
    date: string;
    prepDays: number;
    approvalDays: number;
    totalDays: number;
  }[];
}

export interface DocumentTypeProcessingTime {
  docTypeId: string;
  docTypeName: string;
  docTypeCode?: string | null;
  category: string;
  averagePrepDays: number;
  averageApprovalDays: number;
  averageTotalDays: number;
  complexity: 'low' | 'medium' | 'high';
  sampleSize: number;
  optimizationPotential: number; // percentage
  recommendations: string[];
}

export interface BottleneckAnalysis {
  stage: 'preparation' | 'approval' | 'overall';
  severity: 'low' | 'medium' | 'high' | 'critical';
  averageDelay: number;
  affectedItems: number;
  totalItems: number;
  impactPercentage: number;
  rootCauses: string[];
  recommendations: string[];
  estimatedSavings: number; // days that could be saved
}

// Calculate overall processing time metrics
export const calculateProcessingTimeMetrics = (
  data: DocProgressData[],
  filters: FilterState
): ProcessingTimeMetrics => {
  const filtered = filterData(data, filters);
  
  // Current week data
  const currentWeekItems = filtered.filter(item =>
    item.first_started_at && item.first_submitted_at && item.first_approved_at
  );
  
  const prepTimes = currentWeekItems
    .map(item => calculateDaysDifference(item.first_started_at!, item.first_submitted_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  const approvalTimes = currentWeekItems
    .map(item => calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  const totalTimes = currentWeekItems
    .map(item => calculateDaysDifference(item.first_started_at!, item.first_approved_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  // Last week data for trend analysis
  const today = getCurrentDateBangkok();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const lastWeekItems = filtered.filter(item =>
    item.first_approved_at &&
    parseISO(item.first_approved_at) >= twoWeeksAgo &&
    parseISO(item.first_approved_at) < oneWeekAgo
  );
  
  const lastWeekPrepTimes = lastWeekItems
    .map(item => calculateDaysDifference(item.first_started_at!, item.first_submitted_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  const lastWeekApprovalTimes = lastWeekItems
    .map(item => calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  const lastWeekTotalTimes = lastWeekItems
    .map(item => calculateDaysDifference(item.first_started_at!, item.first_approved_at!))
    .filter(days => !Number.isNaN(days) && days >= 0);
  
  const average = (arr: number[]) => arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
  
  const currentPrepDays = Math.round(average(prepTimes) * 10) / 10;
  const currentApprovalDays = Math.round(average(approvalTimes) * 10) / 10;
  const currentTotalDays = Math.round(average(totalTimes) * 10) / 10;
  
  const lastWeekPrepDays = Math.round(average(lastWeekPrepTimes) * 10) / 10;
  const lastWeekApprovalDays = Math.round(average(lastWeekApprovalTimes) * 10) / 10;
  const lastWeekTotalDays = Math.round(average(lastWeekTotalTimes) * 10) / 10;
  
  // Target values (can be configured)
  const targetPrepDays = 3;
  const targetApprovalDays = 2;
  const targetTotalDays = 5;
  
  // Calculate trends
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (Math.abs(current - previous) < 0.5) return 'stable';
    return current > previous ? 'up' : 'down';
  };
  
  return {
    averagePrepDays: currentPrepDays,
    averageApprovalDays: currentApprovalDays,
    averageTotalDays: currentTotalDays,
    targetPrepDays,
    targetApprovalDays,
    targetTotalDays,
    prepTimeVsTarget: targetPrepDays > 0 ? Math.round(((currentPrepDays - targetPrepDays) / targetPrepDays) * 100) : 0,
    approvalTimeVsTarget: targetApprovalDays > 0 ? Math.round(((currentApprovalDays - targetApprovalDays) / targetApprovalDays) * 100) : 0,
    totalTimeVsTarget: targetTotalDays > 0 ? Math.round(((currentTotalDays - targetTotalDays) / targetTotalDays) * 100) : 0,
    lastWeekPrepDays,
    lastWeekApprovalDays,
    lastWeekTotalDays,
    prepTimeTrend: calculateTrend(currentPrepDays, lastWeekPrepDays),
    approvalTimeTrend: calculateTrend(currentApprovalDays, lastWeekApprovalDays),
    totalTimeTrend: calculateTrend(currentTotalDays, lastWeekTotalDays),
  };
};

// Generate timeline data for visualization
export const generateTimelineData = (
  data: DocProgressData[],
  filters: FilterState,
  limit: number = 20
): TimelineEvent[] => {
  const filtered = filterData(data, filters);
  
  const timelineEvents: TimelineEvent[] = filtered.map(item => {
    const prepDays = item.first_started_at && item.first_submitted_at
      ? calculateDaysDifference(item.first_started_at, item.first_submitted_at)
      : null;
    
    const approvalDays = item.first_submitted_at && item.first_approved_at
      ? calculateDaysDifference(item.first_submitted_at, item.first_approved_at)
      : null;
    
    const totalDays = item.first_started_at && item.first_approved_at
      ? calculateDaysDifference(item.first_started_at, item.first_approved_at)
      : null;
    
    // Determine status
    let status: TimelineEvent['status'] = 'not_started';
    if (item.first_approved_at) {
      status = 'approved';
    } else if (item.first_submitted_at) {
      status = 'submitted';
    } else if (item.first_started_at) {
      status = 'in_progress';
    }
    
    // Check if overdue
    if (item.planned_due_date && calculateOverdueDays(item.planned_due_date) > 0) {
      status = 'overdue';
    }
    
    // Identify bottleneck stage
    let bottleneckStage: TimelineEvent['bottleneckStage'] = 'none';
    let bottleneckDays = 0;
    
    if (prepDays !== null && prepDays > 5) {
      bottleneckStage = 'preparation';
      bottleneckDays = prepDays - 5;
    } else if (approvalDays !== null && approvalDays > 3) {
      bottleneckStage = 'approval';
      bottleneckDays = approvalDays - 3;
    }
    
    return {
      id: `${item.contractor_id}-${item.doc_type_id}`,
      contractorId: item.contractor_id,
      contractorName: item.contractor_name,
      docTypeId: item.doc_type_id,
      docTypeName: item.doc_type_name,
      docTypeCode: item.doc_type_code,
      category: item.category,
      startDate: item.first_started_at,
      submitDate: item.first_submitted_at,
      approvalDate: item.first_approved_at,
      plannedDueDate: item.planned_due_date,
      prepDays,
      approvalDays,
      totalDays,
      status,
      isCritical: item.is_critical,
      bottleneckStage,
      bottleneckDays,
    };
  });
  
  // Sort by bottleneck severity and then by start date
  return timelineEvents
    .sort((a, b) => {
      if (a.bottleneckDays !== b.bottleneckDays) {
        return b.bottleneckDays - a.bottleneckDays;
      }
      if (a.startDate && b.startDate) {
        return parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime();
      }
      return 0;
    })
    .slice(0, limit);
};

// Calculate processing time comparison by contractor
export const calculateContractorProcessingTimeComparison = (
  data: DocProgressData[],
  filters: FilterState
): ContractorProcessingTimeComparison[] => {
  const filtered = filterData(data, filters);
  
  // Group by contractor
  const contractorGroups = new Map<string, {
    contractorName: string;
    prepTimes: number[];
    approvalTimes: number[];
    totalTimes: number[];
    items: DocProgressData[];
  }>();
  
  filtered.forEach(item => {
    if (!contractorGroups.has(item.contractor_id)) {
      contractorGroups.set(item.contractor_id, {
        contractorName: item.contractor_name,
        prepTimes: [],
        approvalTimes: [],
        totalTimes: [],
        items: [],
      });
    }
    
    const group = contractorGroups.get(item.contractor_id)!;
    group.items.push(item);
    
    if (item.first_started_at && item.first_submitted_at) {
      const prepDays = calculateDaysDifference(item.first_started_at, item.first_submitted_at);
      if (!Number.isNaN(prepDays) && prepDays >= 0) {
        group.prepTimes.push(prepDays);
      }
    }
    
    if (item.first_submitted_at && item.first_approved_at) {
      const approvalDays = calculateDaysDifference(item.first_submitted_at, item.first_approved_at);
      if (!Number.isNaN(approvalDays) && approvalDays >= 0) {
        group.approvalTimes.push(approvalDays);
      }
    }
    
    if (item.first_started_at && item.first_approved_at) {
      const totalDays = calculateDaysDifference(item.first_started_at, item.first_approved_at);
      if (!Number.isNaN(totalDays) && totalDays >= 0) {
        group.totalTimes.push(totalDays);
      }
    }
  });
  
  // Calculate averages and generate trend data
  const results: ContractorProcessingTimeComparison[] = [];
  
  contractorGroups.forEach((group, contractorId) => {
    const averagePrepDays = group.prepTimes.length > 0
      ? Math.round((group.prepTimes.reduce((sum, val) => sum + val, 0) / group.prepTimes.length) * 10) / 10
      : 0;
    
    const averageApprovalDays = group.approvalTimes.length > 0
      ? Math.round((group.approvalTimes.reduce((sum, val) => sum + val, 0) / group.approvalTimes.length) * 10) / 10
      : 0;
    
    const averageTotalDays = group.totalTimes.length > 0
      ? Math.round((group.totalTimes.reduce((sum, val) => sum + val, 0) / group.totalTimes.length) * 10) / 10
      : 0;
    
    // Generate trend data (simplified - in real implementation would use historical data)
    const trendData = generateProcessingTimeTrendData(group.items);
    
    // Calculate performance score (lower is better)
    const performanceScore = Math.max(0, 100 - (averagePrepDays * 5 + averageApprovalDays * 8 + averageTotalDays * 3));
    
    results.push({
      contractorId,
      contractorName: group.contractorName,
      averagePrepDays,
      averageApprovalDays,
      averageTotalDays,
      prepTimeRank: 0, // Will be calculated after sorting
      approvalTimeRank: 0, // Will be calculated after sorting
      totalTimeRank: 0, // Will be calculated after sorting
      overallRank: 0, // Will be calculated after sorting
      performanceScore: Math.round(performanceScore),
      trendData,
    });
  });
  
  // Sort and assign ranks
  results.sort((a, b) => a.averagePrepDays - b.averagePrepDays);
  results.forEach((item, index) => item.prepTimeRank = index + 1);
  
  results.sort((a, b) => a.averageApprovalDays - b.averageApprovalDays);
  results.forEach((item, index) => item.approvalTimeRank = index + 1);
  
  results.sort((a, b) => a.averageTotalDays - b.averageTotalDays);
  results.forEach((item, index) => item.totalTimeRank = index + 1);
  
  results.sort((a, b) => b.performanceScore - a.performanceScore);
  results.forEach((item, index) => item.overallRank = index + 1);
  
  return results;
};

// Generate trend data for a contractor
const generateProcessingTimeTrendData = (
  items: DocProgressData[]
): ContractorProcessingTimeComparison['trendData'] => {
  const today = new Date();
  const trendData: ContractorProcessingTimeComparison['trendData'] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekItems = items.filter(item => {
      if (!item.first_approved_at) return false;
      const approvedDate = parseISO(item.first_approved_at);
      return approvedDate >= weekStart && approvedDate <= weekEnd;
    });
    
    const prepTimes = weekItems
      .filter(item => item.first_started_at && item.first_submitted_at)
      .map(item => calculateDaysDifference(item.first_started_at!, item.first_submitted_at!))
      .filter(days => !Number.isNaN(days) && days >= 0);
    
    const approvalTimes = weekItems
      .filter(item => item.first_submitted_at && item.first_approved_at)
      .map(item => calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!))
      .filter(days => !Number.isNaN(days) && days >= 0);
    
    const totalTimes = weekItems
      .filter(item => item.first_started_at && item.first_approved_at)
      .map(item => calculateDaysDifference(item.first_started_at!, item.first_approved_at!))
      .filter(days => !Number.isNaN(days) && days >= 0);
    
    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
    
    trendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      prepDays: Math.round(average(prepTimes) * 10) / 10,
      approvalDays: Math.round(average(approvalTimes) * 10) / 10,
      totalDays: Math.round(average(totalTimes) * 10) / 10,
    });
  }
  
  return trendData;
};

// Calculate processing time by document type
export const calculateProcessingTimeByDocumentType = (
  data: DocProgressData[],
  filters: FilterState
): DocumentTypeProcessingTime[] => {
  const filtered = filterData(data, filters);
  
  // Group by document type
  const docTypeGroups = new Map<string, {
    docTypeName: string;
    docTypeCode: string | null;
    category: string;
    prepTimes: number[];
    approvalTimes: number[];
    totalTimes: number[];
    items: DocProgressData[];
  }>();
  
  filtered.forEach(item => {
    if (!docTypeGroups.has(item.doc_type_id)) {
      docTypeGroups.set(item.doc_type_id, {
        docTypeName: item.doc_type_name,
        docTypeCode: item.doc_type_code,
        category: item.category,
        prepTimes: [],
        approvalTimes: [],
        totalTimes: [],
        items: [],
      });
    }
    
    const group = docTypeGroups.get(item.doc_type_id)!;
    group.items.push(item);
    
    if (item.first_started_at && item.first_submitted_at) {
      const prepDays = calculateDaysDifference(item.first_started_at, item.first_submitted_at);
      if (!Number.isNaN(prepDays) && prepDays >= 0) {
        group.prepTimes.push(prepDays);
      }
    }
    
    if (item.first_submitted_at && item.first_approved_at) {
      const approvalDays = calculateDaysDifference(item.first_submitted_at, item.first_approved_at);
      if (!Number.isNaN(approvalDays) && approvalDays >= 0) {
        group.approvalTimes.push(approvalDays);
      }
    }
    
    if (item.first_started_at && item.first_approved_at) {
      const totalDays = calculateDaysDifference(item.first_started_at, item.first_approved_at);
      if (!Number.isNaN(totalDays) && totalDays >= 0) {
        group.totalTimes.push(totalDays);
      }
    }
  });
  
  const results: DocumentTypeProcessingTime[] = [];
  
  docTypeGroups.forEach((group, docTypeId) => {
    const averagePrepDays = group.prepTimes.length > 0
      ? Math.round((group.prepTimes.reduce((sum, val) => sum + val, 0) / group.prepTimes.length) * 10) / 10
      : 0;
    
    const averageApprovalDays = group.approvalTimes.length > 0
      ? Math.round((group.approvalTimes.reduce((sum, val) => sum + val, 0) / group.approvalTimes.length) * 10) / 10
      : 0;
    
    const averageTotalDays = group.totalTimes.length > 0
      ? Math.round((group.totalTimes.reduce((sum, val) => sum + val, 0) / group.totalTimes.length) * 10) / 10
      : 0;
    
    // Determine complexity based on processing time
    let complexity: DocumentTypeProcessingTime['complexity'] = 'low';
    if (averageTotalDays > 10) {
      complexity = 'high';
    } else if (averageTotalDays > 5) {
      complexity = 'medium';
    }
    
    // Calculate optimization potential
    const targetTotalDays = complexity === 'low' ? 3 : complexity === 'medium' ? 5 : 8;
    const optimizationPotential = targetTotalDays > 0
      ? Math.round(Math.max(0, ((averageTotalDays - targetTotalDays) / targetTotalDays) * 100))
      : 0;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (averagePrepDays > 4) {
      recommendations.push('Cung cấp template và hướng dẫn chi tiết hơn');
      recommendations.push('Tổ chức training cho nhà thầu');
    }
    if (averageApprovalDays > 3) {
      recommendations.push('Tối ưu hóa quy trình phê duyệt');
      recommendations.push('Gán thêm reviewer để giảm tải');
    }
    if (averageTotalDays > 8) {
      recommendations.push('Xem xét chia nhỏ quy trình thành các bước đơn giản hơn');
      recommendations.push('Áp dụng parallel processing cho các bước độc lập');
    }
    
    results.push({
      docTypeId,
      docTypeName: group.docTypeName,
      docTypeCode: group.docTypeCode,
      category: group.category,
      averagePrepDays,
      averageApprovalDays,
      averageTotalDays,
      complexity,
      sampleSize: group.items.length,
      optimizationPotential,
      recommendations,
    });
  });
  
  return results.sort((a, b) => b.averageTotalDays - a.averageTotalDays);
};

// Analyze bottlenecks in the processing workflow
export const analyzeBottlenecks = (
  data: DocProgressData[],
  filters: FilterState
): BottleneckAnalysis[] => {
  const filtered = filterData(data, filters);
  
  const bottleneckAnalyses: BottleneckAnalysis[] = [];
  
  // Analyze preparation stage bottlenecks
  const prepBottlenecks = filtered.filter(item => {
    if (!item.first_started_at || !item.first_submitted_at) return false;
    const prepDays = calculateDaysDifference(item.first_started_at, item.first_submitted_at);
    return !Number.isNaN(prepDays) && prepDays > 5;
  });
  
  const prepDelay = prepBottlenecks.length > 0
    ? prepBottlenecks.reduce((sum, item) => {
        const delay = calculateDaysDifference(item.first_started_at!, item.first_submitted_at!) - 5;
        return sum + Math.max(0, delay);
      }, 0) / prepBottlenecks.length
    : 0;
  
  bottleneckAnalyses.push({
    stage: 'preparation',
    severity: prepDelay > 10 ? 'critical' : prepDelay > 5 ? 'high' : prepDelay > 2 ? 'medium' : 'low',
    averageDelay: Math.round(prepDelay * 10) / 10,
    affectedItems: prepBottlenecks.length,
    totalItems: filtered.length,
    impactPercentage: filtered.length > 0 ? Math.round((prepBottlenecks.length / filtered.length) * 100) : 0,
    rootCauses: [
      'Thiếu template và hướng dẫn',
      'Nhà thầu chưa quen với quy trình',
      'Yêu cầu phức tạp cần thời gian chuẩn bị',
      'Thiếu nguồn lực từ nhà thầu'
    ],
    recommendations: [
      'Cung cấp template chuẩn hóa',
      'Tổ chức workshop training',
      'Gán support staff cho nhà thầu mới',
      'Phân chia yêu cầu phức tạp thành các phần nhỏ hơn'
    ],
    estimatedSavings: Math.round(prepDelay * prepBottlenecks.length),
  });
  
  // Analyze approval stage bottlenecks
  const approvalBottlenecks = filtered.filter(item => {
    if (!item.first_submitted_at || !item.first_approved_at) return false;
    const approvalDays = calculateDaysDifference(item.first_submitted_at, item.first_approved_at);
    return !Number.isNaN(approvalDays) && approvalDays > 3;
  });
  
  const approvalDelay = approvalBottlenecks.length > 0
    ? approvalBottlenecks.reduce((sum, item) => {
        const delay = calculateDaysDifference(item.first_submitted_at!, item.first_approved_at!) - 3;
        return sum + Math.max(0, delay);
      }, 0) / approvalBottlenecks.length
    : 0;
  
  bottleneckAnalyses.push({
    stage: 'approval',
    severity: approvalDelay > 7 ? 'critical' : approvalDelay > 4 ? 'high' : approvalDelay > 2 ? 'medium' : 'low',
    averageDelay: Math.round(approvalDelay * 10) / 10,
    affectedItems: approvalBottlenecks.length,
    totalItems: filtered.length,
    impactPercentage: filtered.length > 0 ? Math.round((approvalBottlenecks.length / filtered.length) * 100) : 0,
    rootCauses: [
      'Reviewer quá tải',
      'Quy trình phê duyệt phức tạp',
      'Thiếu clear escalation path',
      'Thiếu automated notifications'
    ],
    recommendations: [
      'Tăng số lượng reviewer',
      'Đơn giản hóa quy trình phê duyệt',
      'Thiết lập clear SLA cho từng bước',
      'Implement automated reminder system'
    ],
    estimatedSavings: Math.round(approvalDelay * approvalBottlenecks.length),
  });
  
  // Analyze overall bottlenecks
  const overallBottlenecks = filtered.filter(item => {
    if (!item.first_started_at || !item.first_approved_at) return false;
    const totalDays = calculateDaysDifference(item.first_started_at, item.first_approved_at);
    return !Number.isNaN(totalDays) && totalDays > 8;
  });
  
  const overallDelay = overallBottlenecks.length > 0
    ? overallBottlenecks.reduce((sum, item) => {
        const delay = calculateDaysDifference(item.first_started_at!, item.first_approved_at!) - 8;
        return sum + Math.max(0, delay);
      }, 0) / overallBottlenecks.length
    : 0;
  
  bottleneckAnalyses.push({
    stage: 'overall',
    severity: overallDelay > 15 ? 'critical' : overallDelay > 8 ? 'high' : overallDelay > 4 ? 'medium' : 'low',
    averageDelay: Math.round(overallDelay * 10) / 10,
    affectedItems: overallBottlenecks.length,
    totalItems: filtered.length,
    impactPercentage: filtered.length > 0 ? Math.round((overallBottlenecks.length / filtered.length) * 100) : 0,
    rootCauses: [
      'Thiếu coordination giữa các bộ phận',
      'Quy trình không được tối ưu',
      'Thiếu visibility vào trạng thái hồ sơ',
      'Thiếu proactive management'
    ],
    recommendations: [
      'Implement centralized tracking system',
      'Tối ưu hóa end-to-end workflow',
      'Thiết lập regular review meetings',
      'Áp dụng agile methodology cho document processing'
    ],
    estimatedSavings: Math.round(overallDelay * overallBottlenecks.length),
  });
  
  return bottleneckAnalyses;
};
