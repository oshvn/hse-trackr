import { useState, useCallback, useMemo } from 'react';
import { Category } from '@/components/dashboard/CategoryProgress';
import { ContractorData } from '@/components/dashboard/CategoryProgress';
import { ContractorTimelineData } from '@/components/dashboard/MiniTimeline';

export interface CategoryTimelineData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  timelineData: Array<{
    day: string;
    approved: number;
    pending: number;
    missing: number;
    total: number;
  }>;
  contractors: Array<{
    id: string;
    name: string;
    color: string;
    progress: number[];
  }>;
}

export interface DashboardIntegrationState {
  selectedContractor: string | null;
  selectedCategory: string | null;
  categoryTimelineData: CategoryTimelineData | null;
  syncMode: boolean;
  isDrillDownActive: boolean;
}

export interface UseDashboardIntegrationReturn {
  // State
  integrationState: DashboardIntegrationState;
  
  // Actions
  setSelectedContractor: (contractorId: string | null) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSyncMode: (enabled: boolean) => void;
  setCategoryTimelineData: (data: CategoryTimelineData | null) => void;
  
  // Drill-down actions
  handleCategoryDrillDown: (categoryId: string, contractorId?: string) => void;
  handleBackToOverview: () => void;
  
  // Sync actions
  syncContractorSelection: (contractorId: string | null) => void;
  resetIntegration: () => void;
  
  // Computed values
  isIntegrationActive: boolean;
  shouldSyncTimeline: boolean;
}

const initialState: DashboardIntegrationState = {
  selectedContractor: null,
  selectedCategory: null,
  categoryTimelineData: null,
  syncMode: true,
  isDrillDownActive: false,
};

export const useDashboardIntegration = (): UseDashboardIntegrationReturn => {
  const [integrationState, setIntegrationState] = useState<DashboardIntegrationState>(initialState);

  // Basic setters
  const setSelectedContractor = useCallback((contractorId: string | null) => {
    setIntegrationState(prev => ({
      ...prev,
      selectedContractor: contractorId,
    }));
  }, []);

  const setSelectedCategory = useCallback((categoryId: string | null) => {
    setIntegrationState(prev => ({
      ...prev,
      selectedCategory: categoryId,
    }));
  }, []);

  const setSyncMode = useCallback((enabled: boolean) => {
    setIntegrationState(prev => ({
      ...prev,
      syncMode: enabled,
    }));
  }, []);

  const setCategoryTimelineData = useCallback((data: CategoryTimelineData | null) => {
    setIntegrationState(prev => ({
      ...prev,
      categoryTimelineData: data,
    }));
  }, []);

  // Drill-down actions
  const handleCategoryDrillDown = useCallback((categoryId: string, contractorId?: string) => {
    setIntegrationState(prev => ({
      ...prev,
      selectedCategory: categoryId,
      selectedContractor: contractorId || prev.selectedContractor,
      isDrillDownActive: true,
      syncMode: true, // Enable sync when drilling down
    }));
  }, []);

  const handleBackToOverview = useCallback(() => {
    setIntegrationState(prev => ({
      ...prev,
      selectedCategory: null,
      categoryTimelineData: null,
      isDrillDownActive: false,
    }));
  }, []);

  // Sync actions
  const syncContractorSelection = useCallback((contractorId: string | null) => {
    if (integrationState.syncMode) {
      setSelectedContractor(contractorId);
    }
  }, [integrationState.syncMode, setSelectedContractor]);

  const resetIntegration = useCallback(() => {
    setIntegrationState(initialState);
  }, []);

  // Computed values
  const isIntegrationActive = useMemo(() => {
    return integrationState.isDrillDownActive || 
           integrationState.selectedCategory !== null ||
           integrationState.selectedContractor !== null;
  }, [integrationState.isDrillDownActive, integrationState.selectedCategory, integrationState.selectedContractor]);

  const shouldSyncTimeline = useMemo(() => {
    return integrationState.syncMode && integrationState.selectedContractor !== null;
  }, [integrationState.syncMode, integrationState.selectedContractor]);

  return useMemo(() => ({
    // State
    integrationState,
    
    // Actions
    setSelectedContractor,
    setSelectedCategory,
    setSyncMode,
    setCategoryTimelineData,
    
    // Drill-down actions
    handleCategoryDrillDown,
    handleBackToOverview,
    
    // Sync actions
    syncContractorSelection,
    resetIntegration,
    
    // Computed values
    isIntegrationActive,
    shouldSyncTimeline,
  }), [
    integrationState,
    setSelectedContractor,
    setSelectedCategory,
    setSyncMode,
    setCategoryTimelineData,
    handleCategoryDrillDown,
    handleBackToOverview,
    syncContractorSelection,
    resetIntegration,
    isIntegrationActive,
    shouldSyncTimeline,
  ]);
};
