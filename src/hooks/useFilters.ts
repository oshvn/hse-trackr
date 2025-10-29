import { useState, useCallback, useEffect } from 'react';

export interface FilterState {
  contractors: string[];
  categories: string[];
  statuses: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Hook to manage filters across dashboard
 * - Filter by contractors
 * - Filter by categories
 * - Filter by status
 * - Date range filtering
 * - Sync filters to localStorage
 */
export const useFilters = (initialFilters?: Partial<FilterState>) => {
  const [filters, setFilters] = useState<FilterState>({
    contractors: initialFilters?.contractors ?? [],
    categories: initialFilters?.categories ?? [],
    statuses: initialFilters?.statuses ?? [],
    dateRange: initialFilters?.dateRange,
  });

  // Persist filters to localStorage
  useEffect(() => {
    const serialized = JSON.stringify(filters);
    localStorage.setItem('dashboardFilters', serialized);
  }, [filters]);

  const updateContractors = useCallback((contractors: string[]) => {
    setFilters(prev => ({
      ...prev,
      contractors,
    }));
  }, []);

  const updateCategories = useCallback((categories: string[]) => {
    setFilters(prev => ({
      ...prev,
      categories,
    }));
  }, []);

  const updateStatuses = useCallback((statuses: string[]) => {
    setFilters(prev => ({
      ...prev,
      statuses,
    }));
  }, []);

  const updateDateRange = useCallback((start: Date, end: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      contractors: [],
      categories: [],
      statuses: [],
      dateRange: undefined,
    });
    localStorage.removeItem('dashboardFilters');
  }, []);

  const toggleContractor = useCallback((id: string) => {
    setFilters(prev => ({
      ...prev,
      contractors: prev.contractors.includes(id)
        ? prev.contractors.filter(c => c !== id)
        : [...prev.contractors, id],
    }));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter(c => c !== id)
        : [...prev.categories, id],
    }));
  }, []);

  const isFilterActive = filters.contractors.length > 0 ||
    filters.categories.length > 0 ||
    filters.statuses.length > 0 ||
    !!filters.dateRange;

  return {
    filters,
    updateContractors,
    updateCategories,
    updateStatuses,
    updateDateRange,
    clearFilters,
    toggleContractor,
    toggleCategory,
    isFilterActive,
  };
};
