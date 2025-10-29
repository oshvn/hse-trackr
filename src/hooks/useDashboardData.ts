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

      // Simulate API call - replace with actual endpoint
      const response = await fetch('/api/dashboard/data');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data: DashboardData = await response.json();

      // Update cache
      cachedData = data;
      cacheTimestamp = Date.now();

      setState(prev => ({ ...prev, data, isLoading: false }));
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
