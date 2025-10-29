import { useState, useEffect, useCallback, useRef } from 'react';

export interface ContractorData {
  id: string;
  name: string;
  completionRate: number;
  onTimeDelivery: number;
  qualityScore: number;
  compliance: number;
  responseTime: number;
  status: 'excellent' | 'good' | 'needs-attention';
}

export interface AlertData {
  id: string;
  severity: 'blocking' | 'overdue' | 'missing';
  contractor: string;
  documentName: string;
  category: string;
  impact: string;
  deadline: Date;
  daysOverdue?: number;
}

export interface ActionData {
  id: string;
  title: string;
  description: string;
  urgency: 'urgent' | 'this-week' | 'planned';
  contractor: string;
  actionType: 'email' | 'meeting' | 'support' | 'escalate';
}

export interface DashboardData {
  contractors: ContractorData[];
  alerts: AlertData[];
  actions: ActionData[];
  overallCompletion: number;
  avgProcessingTime: number;
  categories: Array<{ id: string; name: string; approved: number; pending: number; missing: number }>;
  lastUpdated: Date;
}

interface UseDashboardDataState {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedData: DashboardData | null = null;
let cacheTimestamp = 0;

/**
 * Hook to fetch and manage dashboard data
 * - Auto-refresh every 5 minutes
 * - Caching with 5-min TTL
 * - Error handling with retry
 */
export const useDashboardData = () => {
  const [state, setState] = useState<UseDashboardDataState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
        setState(prev => ({ ...prev, data: cachedData, isLoading: false }));
        return;
      }

      // Mock data matching prototype
      const mockData: DashboardData = {
        contractors: [
          {
            id: 'contractor-a',
            name: 'Contractor A',
            completionRate: 92,
            onTimeDelivery: 88,
            qualityScore: 95,
            compliance: 90,
            responseTime: 89,
            status: 'excellent',
          },
          {
            id: 'contractor-b',
            name: 'Contractor B',
            completionRate: 65,
            onTimeDelivery: 72,
            qualityScore: 68,
            compliance: 58,
            responseTime: 70,
            status: 'needs-attention',
          },
          {
            id: 'contractor-c',
            name: 'Contractor C',
            completionRate: 78,
            onTimeDelivery: 85,
            qualityScore: 82,
            compliance: 75,
            responseTime: 80,
            status: 'good',
          },
        ],
        alerts: [
          {
            id: 'alert-1',
            severity: 'blocking',
            contractor: 'Contractor B',
            documentName: 'Safety Plan - Excavation Method',
            category: 'Safety',
            impact: 'Cannot start foundation work',
            deadline: new Date('2025-11-05'),
            daysOverdue: 7,
          },
          {
            id: 'alert-2',
            severity: 'blocking',
            contractor: 'Contractor A',
            documentName: 'Environmental Impact Assessment',
            category: 'Environmental',
            impact: 'Cannot proceed with site clearing',
            deadline: new Date('2025-11-09'),
            daysOverdue: 3,
          },
          {
            id: 'alert-3',
            severity: 'blocking',
            contractor: 'Contractor C',
            documentName: 'Quality Control Plan',
            category: 'Quality',
            impact: 'Cannot start quality inspections',
            deadline: new Date('2025-11-07'),
            daysOverdue: 5,
          },
          {
            id: 'alert-4',
            severity: 'overdue',
            contractor: 'Contractor B',
            documentName: 'Site Safety Inspection Report',
            category: 'Safety',
            impact: 'Moderate - needed for compliance',
            deadline: new Date('2025-11-01'),
            daysOverdue: 10,
          },
          {
            id: 'alert-5',
            severity: 'missing',
            contractor: 'Contractor A',
            documentName: 'Construction Schedule',
            category: 'Planning',
            impact: 'Low - informational',
            deadline: new Date('2025-11-10'),
          },
        ],
        actions: [
          {
            id: 'action-1',
            title: 'Send Deadline Reminder',
            description: 'Email alert to Contractor B about 5 missing docs',
            urgency: 'urgent',
            contractor: 'Contractor B',
            actionType: 'email',
          },
          {
            id: 'action-2',
            title: 'Escalate Critical Docs',
            description: '3 critical docs blocking construction start',
            urgency: 'urgent',
            contractor: 'Multiple',
            actionType: 'escalate',
          },
          {
            id: 'action-3',
            title: 'Schedule Review Meeting',
            description: 'Review process with Contractor A (overdue approvals)',
            urgency: 'this-week',
            contractor: 'Contractor A',
            actionType: 'meeting',
          },
          {
            id: 'action-4',
            title: 'Provide Document Templates',
            description: 'Share safety doc templates to Contractor C',
            urgency: 'this-week',
            contractor: 'Contractor C',
            actionType: 'support',
          },
          {
            id: 'action-5',
            title: 'Quality Audit Review',
            description: 'Contractor B quality metrics are below standard',
            urgency: 'planned',
            contractor: 'Contractor B',
            actionType: 'meeting',
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Safety Plans',
            approved: 12,
            pending: 3,
            missing: 1,
          },
          {
            id: 'cat-2',
            name: 'Quality Docs',
            approved: 17,
            pending: 2,
            missing: 1,
          },
          {
            id: 'cat-3',
            name: 'Environmental',
            approved: 12,
            pending: 5,
            missing: 3,
          },
        ],
        overallCompletion: 75,
        avgProcessingTime: 8.5,
        lastUpdated: new Date(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update cache
      cachedData = mockData;
      cacheTimestamp = Date.now();

      setState(prev => ({ ...prev, data: mockData, isLoading: false }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, error: err, isLoading: false }));

      // Retry after 3 seconds on error
      setTimeout(fetchData, 3000);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshIntervalRef.current = setInterval(fetchData, 5 * 60 * 1000);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
};
