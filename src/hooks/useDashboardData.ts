import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContractorData {
  id: string;
  name: string;
  completionRate: number;
  onTimeDelivery: number;
  qualityScore: number;
  compliance: number;
  responseTime: number;
  status: 'excellent' | 'good' | 'needs-attention';
  // Trend data
  previousCompletionRate?: number;
  previousOnTimeDelivery?: number;
  previousQualityScore?: number;
  previousCompliance?: number;
  previousResponseTime?: number;
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
  categories: Array<{ id: string; name: string; approved: number; pending: number; missing: number; isCritical?: boolean }>;
  contractorCategories?: Record<string, Array<{ id: string; name: string; approved: number; pending: number; missing: number; isCritical?: boolean }>>;
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

// Force clear cache for categories fix
export const clearDashboardCache = () => {
  cachedData = null;
  cacheTimestamp = 0;
};

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

      // Fetch real categories from database
      let categoriesData: Array<{ id: string; name: string; approved: number; pending: number; missing: number; isCritical?: boolean }> = [];
      let contractorCategoriesMap: Record<string, Array<{ id: string; name: string; approved: number; pending: number; missing: number; isCritical?: boolean }>> = {};
      let contractorsData: Array<{ id: string; name: string }> | null = null;
      
      try {
        // Get all doc_types to extract unique categories
        const { data: docTypesData } = await supabase
          .from('doc_types')
          .select('category, is_critical')
          .order('category');

        if (docTypesData && docTypesData.length > 0) {
          // Get unique categories from doc_types
          const uniqueCategories = new Map<string, boolean>();
          docTypesData.forEach(dt => {
            if (dt.category) {
              // Keep critical flag if any doc_type in this category is critical
              if (!uniqueCategories.has(dt.category)) {
                uniqueCategories.set(dt.category, dt.is_critical || false);
              } else if (dt.is_critical) {
                uniqueCategories.set(dt.category, true);
              }
            }
          });
          
          // Get all contractors
          const { data: dbContractorsData } = await supabase
            .from('contractors')
            .select('id, name');
          
          contractorsData = dbContractorsData || null;

          // Get category progress aggregated from v_doc_progress (all contractors)
          const { data: progressData } = await supabase
            .from('v_doc_progress')
            .select('contractor_id, doc_type_id, category, is_critical, required_count, approved_count');

          // Get pending submissions count
          const { data: submissionsData } = await supabase
            .from('submissions')
            .select('doc_type_id, status, cnt, contractor_id')
            .in('status', ['submitted', 'revision']);

          // Get doc_type_id to category mapping
          const { data: docTypeMapping } = await supabase
            .from('doc_types')
            .select('id, category');

          // Helper function to map sub-categories to parent categories
          const getParentCategory = (category: string): string => {
            if (!category) return 'Unknown';
            // Group all 1.1.x sub-categories under "1.1 Document Register"
            if (category.startsWith('1.1.')) return '1.1 Document Register';
            // Keep other categories as-is (1.2, 1.3, 1.4, 1.5)
            return category;
          };

          const docTypeToCategory = new Map<string, string>();
          const docTypeToParentCategory = new Map<string, string>();
          docTypeMapping?.forEach(dt => {
            if (dt.id && dt.category) {
              docTypeToCategory.set(dt.id, dt.category);
              docTypeToParentCategory.set(dt.id, getParentCategory(dt.category));
            }
          });

          // Aggregate by parent category (all contractors combined)
          const categoryMap = new Map<string, { approved: number; required: number; pending: number; isCritical: boolean }>();
          
          // Process progress data - group by parent category
          progressData?.forEach(item => {
            const parentCat = getParentCategory(item.category || 'Unknown');
            const existing = categoryMap.get(parentCat) || { approved: 0, required: 0, pending: 0, isCritical: false };
            existing.approved += item.approved_count || 0;
            existing.required += item.required_count || 0;
            // Mark as critical if any sub-category is critical
            if (item.is_critical) existing.isCritical = true;
            categoryMap.set(parentCat, existing);
          });

          // Process pending submissions (count only if not yet approved enough)
          if (submissionsData && progressData) {
            // Create a map of contractor_id -> doc_type_id -> approved_count
            const approvedMap = new Map<string, Map<string, number>>();
            progressData.forEach(item => {
              if (!approvedMap.has(item.contractor_id)) {
                approvedMap.set(item.contractor_id, new Map());
              }
              const contractorMap = approvedMap.get(item.contractor_id)!;
              // We need doc_type_id here, but progressData doesn't have it directly
              // So we'll use a different approach
            });

            // Count pending by parent category
            submissionsData.forEach(sub => {
              const parentCategory = docTypeToParentCategory.get(sub.doc_type_id) || 'Unknown';
              const existing = categoryMap.get(parentCategory);
              if (existing) {
                // Count pending submissions (simplified: count all submitted/revision)
                existing.pending += sub.cnt || 0;
              }
            });
          }

          // Convert to categories array (all contractors) - sorted by category number
          categoriesData = Array.from(categoryMap.entries())
            .map(([name, stats], index) => ({
              id: `cat-${index}`,
              name,
              approved: stats.approved,
              pending: stats.pending,
              missing: Math.max(0, stats.required - stats.approved - stats.pending),
              isCritical: stats.isCritical,
            }))
            .sort((a, b) => {
              // Sort by category number (1.1, 1.2, 1.3, etc.)
              const getCategoryNumber = (name: string): number => {
                const match = name.match(/^(\d+\.\d+)/);
                return match ? parseFloat(match[1]) : 999;
              };
              return getCategoryNumber(a.name) - getCategoryNumber(b.name);
            });

          // Calculate categories per contractor - group by parent category
          contractorsData?.forEach(contractor => {
            const contractorMap = new Map<string, { approved: number; required: number; pending: number; isCritical: boolean }>();
            
            // Filter progress data for this contractor and group by parent category
            progressData?.filter(p => p.contractor_id === contractor.id).forEach(item => {
              const parentCat = getParentCategory(item.category || 'Unknown');
              const existing = contractorMap.get(parentCat) || { approved: 0, required: 0, pending: 0, isCritical: false };
              existing.approved += item.approved_count || 0;
              existing.required += item.required_count || 0;
              // Mark as critical if any sub-category is critical
              if (item.is_critical) existing.isCritical = true;
              contractorMap.set(parentCat, existing);
            });

            // Add pending submissions for this contractor - group by parent category
            submissionsData?.filter(s => s.contractor_id === contractor.id).forEach(sub => {
              const parentCategory = docTypeToParentCategory.get(sub.doc_type_id) || 'Unknown';
              const existing = contractorMap.get(parentCategory);
              if (existing) {
                existing.pending += sub.cnt || 0;
              }
            });

            // Convert to categories array for this contractor - sorted by category number
            const contractorCategories = Array.from(contractorMap.entries())
              .map(([name, stats], index) => ({
                id: `cat-${contractor.id}-${index}`,
                name,
                approved: stats.approved,
                pending: stats.pending,
                missing: Math.max(0, stats.required - stats.approved - stats.pending),
                isCritical: stats.isCritical,
              }))
              .sort((a, b) => {
                // Sort by category number (1.1, 1.2, 1.3, etc.)
                const getCategoryNumber = (name: string): number => {
                  const match = name.match(/^(\d+\.\d+)/);
                  return match ? parseFloat(match[1]) : 999;
                };
                return getCategoryNumber(a.name) - getCategoryNumber(b.name);
              });

            contractorCategoriesMap[contractor.id] = contractorCategories;
          });
        }
      } catch (categoryError) {
        console.error('Error fetching categories:', categoryError);
        // Fallback to empty categories if fetch fails
      }

      // Mock data matching prototype (keep contractors and other data as mock for now)
      // Map database contractors to mock contractor IDs for compatibility
      const contractorIdMap = new Map<string, string>();
      if (contractorsData && contractorsData.length > 0) {
        const mockContractorIds = ['contractor-a', 'contractor-b', 'contractor-c'];
        contractorsData.forEach((dbContractor, index) => {
          if (mockContractorIds[index]) {
            contractorIdMap.set(dbContractor.id, mockContractorIds[index]);
          }
        });
      }
      
      // Map contractorCategoriesMap keys to mock IDs
      const mappedContractorCategories: Record<string, Array<{ id: string; name: string; approved: number; pending: number; missing: number; isCritical?: boolean }>> = {};
      if (contractorIdMap.size > 0) {
        Object.entries(contractorCategoriesMap).forEach(([dbId, categories]) => {
          const mockId = contractorIdMap.get(dbId);
          if (mockId) {
            mappedContractorCategories[mockId] = categories;
          }
        });
      }
      
      const mockData: DashboardData = {
        contractors: [
          {
            id: 'contractor-a',
            name: 'ABC Construction',
            completionRate: 92,
            onTimeDelivery: 88,
            qualityScore: 95,
            compliance: 90,
            responseTime: 89,
            status: 'excellent',
            // Trend data (previous period)
            previousCompletionRate: 88,
            previousOnTimeDelivery: 85,
            previousQualityScore: 92,
            previousCompliance: 87,
            previousResponseTime: 85,
          },
          {
            id: 'contractor-b',
            name: 'XYZ Builders',
            completionRate: 65,
            onTimeDelivery: 72,
            qualityScore: 68,
            compliance: 58,
            responseTime: 70,
            status: 'needs-attention',
            // Trend data (previous period)
            previousCompletionRate: 70,
            previousOnTimeDelivery: 75,
            previousQualityScore: 72,
            previousCompliance: 65,
            previousResponseTime: 75,
          },
          {
            id: 'contractor-c',
            name: 'DEF Contractors',
            completionRate: 78,
            onTimeDelivery: 85,
            qualityScore: 82,
            compliance: 75,
            responseTime: 80,
            status: 'good',
            // Trend data (previous period)
            previousCompletionRate: 75,
            previousOnTimeDelivery: 78,
            previousQualityScore: 82,
            previousCompliance: 70,
            previousResponseTime: 78,
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
        categories: categoriesData.length > 0 ? categoriesData : [
          // Fallback mock data if no categories found
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
        contractorCategories: Object.keys(mappedContractorCategories).length > 0 ? mappedContractorCategories : (Object.keys(contractorCategoriesMap).length > 0 ? contractorCategoriesMap : undefined),
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
