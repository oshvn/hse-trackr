import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/hooks/useSessionRole';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { CompletionByContractorBar } from '@/components/Charts/CompletionByContractorChart';
import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MustHaveSplitChart } from '@/components/dashboard/MustHaveSplitChart';
import { CriticalAlertsCard } from '@/components/dashboard/CriticalAlertsCard';
import { CategoryProgressChart } from '@/components/dashboard/CategoryProgressChart';
import { PlannedVsActualCompact } from '@/components/dashboard/PlannedVsActualCompact';
import { SnapshotTable } from '@/components/dashboard/SnapshotTable';
import type { FilterState, KpiData, DocProgressData, CategoryProgressSummary, ProcessSnapshotItem } from '@/lib/dashboardHelpers';
import {
  calculateOverallCompletion,
  calculateMustHaveReady,
  calculateOverdueMustHaves,
  calculateAvgPrepTime,
  calculateAvgApprovalTime,
  getRedCards,
  getAmberAlerts,
  getCategoryProgress,
  getProcessSnapshot,
  filterData,
} from '@/lib/dashboardHelpers';

interface Contractor {
  id: string;
  name: string;
}

interface DocTypeRow {
  id: string;
  name: string;
  code?: string | null;
  category: string;
  is_critical?: boolean | null;
}

const CATEGORY_CONFIG = [
  {
    name: 'Document Register',
    codes: ['MT_CM', 'MT_HSE', 'MT_PM', 'MT_SM', 'MT_SV', 'MP', 'EQ', 'IT_DOC', 'IT_SIG'],
    fallbackCategories: ['Management Teams', 'Management Plans', 'Workforce'],
  },
  {
    name: 'Risk Assessment',
    codes: ['RA'],
    fallbackCategories: ['Risk Management'],
  },
  {
    name: 'JHA',
    codes: ['JHA'],
    fallbackCategories: [],
  },
  {
    name: 'Safe Method Statement',
    codes: ['SMS'],
    fallbackCategories: ['Operations'],
  },
  {
    name: 'Emergency Action Plan',
    codes: ['ERP_TR', 'ERP_DR', 'ERP_EQ'],
    fallbackCategories: ['Emergency Response'],
  },
] as const;

const CATEGORY_ORDER = CATEGORY_CONFIG.map(config => config.name);

const CODE_CATEGORY_MAP = CATEGORY_CONFIG.reduce<Record<string, string>>((acc, config) => {
  config.codes.forEach(code => {
    acc[code] = config.name;
  });
  return acc;
}, {});

const FALLBACK_CATEGORY_MAP = CATEGORY_CONFIG.reduce<Record<string, string>>((acc, config) => {
  config.fallbackCategories.forEach(cat => {
    acc[cat] = config.name;
  });
  return acc;
}, {});

const DashboardPage: React.FC = () => {
  const { session, role, error, retry } = useSessionRole();
  const [filters, setFilters] = useState<FilterState>({
    contractor: 'all',
    category: 'all',
    search: '',
  });
  const [selectedDetail, setSelectedDetail] = useState<{ contractorId: string; docTypeId: string } | null>(null);
  const [planContractorId, setPlanContractorId] = useState<string>('all');

  const {
    data: contractors = [],
    isLoading: contractorsLoading,
  } = useQuery<Contractor[]>({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('contractors')
        .select('id, name')
        .order('name');

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session,
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: docTypes = [],
    isLoading: docTypesLoading,
  } = useQuery<DocTypeRow[]>({
    queryKey: ['doc_types'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('doc_types')
        .select('id, name, code, category, is_critical')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session,
    retry: 2,
  });

  const {
    data: kpiData = [],
    isLoading: kpiLoading,
  } = useQuery<KpiData[]>({
    queryKey: ['contractor_kpi'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('v_contractor_kpi')
        .select('*');

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session,
    retry: 1,
  });

  const {
    data: progressData = [],
    isLoading: progressLoading,
  } = useQuery<DocProgressData[]>({
    queryKey: ['doc_progress'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('v_doc_progress')
        .select('*')
        .order('contractor_name')
        .order('doc_type_name');

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session,
    retry: 1,
  });

  const normalizedDocTypes = useMemo(() => {
    return docTypes.map(docType => {
      const upperCode = docType.code ? docType.code.toUpperCase() : '';
      const primaryCategory =
        CODE_CATEGORY_MAP[upperCode] ||
        FALLBACK_CATEGORY_MAP[docType.category] ||
        CATEGORY_ORDER[0];

      return {
        id: docType.id,
        name: docType.name,
        code: upperCode || null,
        primaryCategory,
        isCritical: !!docType.is_critical,
      };
    });
  }, [docTypes]);

  const docTypeMeta = useMemo(() => {
    const map = new Map<string, {
      name: string;
      code: string | null;
      primaryCategory: string;
      isCritical: boolean;
    }>();

    normalizedDocTypes.forEach(docType => {
      map.set(docType.id, docType);
    });

    return map;
  }, [normalizedDocTypes]);

  const enrichedProgressData = useMemo(() => {
    return progressData.map(item => {
      const meta = docTypeMeta.get(item.doc_type_id);
      const primaryCategory = meta?.primaryCategory ?? item.category;

      return {
        ...item,
        doc_type_code: meta?.code ?? item.doc_type_code ?? null,
        category: primaryCategory,
        is_critical: item.is_critical || meta?.isCritical || false,
      };
    });
  }, [progressData, docTypeMeta]);

  const baseFilteredData = useMemo(() => {
    return filterData(enrichedProgressData, {
      contractor: filters.contractor,
      category: 'all',
      search: filters.search,
    });
  }, [enrichedProgressData, filters.contractor, filters.search]);

  const categoriesPresent = useMemo(() => {
    const present = new Set(baseFilteredData.map(item => item.category));
    return CATEGORY_ORDER.filter(category => present.has(category));
  }, [baseFilteredData]);

  const availableCategories = categoriesPresent.length > 0 ? categoriesPresent : CATEGORY_ORDER;

  const filteredData = useMemo(() => {
    return filterData(enrichedProgressData, filters);
  }, [enrichedProgressData, filters]);

  const overallCompletion = useMemo(() => (
    calculateOverallCompletion(enrichedProgressData, filters, kpiData)
  ), [enrichedProgressData, filters, kpiData]);

  const mustHaveReady = useMemo(() => (
    calculateMustHaveReady(enrichedProgressData, filters, kpiData)
  ), [enrichedProgressData, filters, kpiData]);

  const overdueMustHaves = useMemo(() => (
    calculateOverdueMustHaves(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const avgPrepTime = useMemo(() => (
    calculateAvgPrepTime(enrichedProgressData, filters, kpiData)
  ), [enrichedProgressData, filters, kpiData]);

  const avgApprovalTime = useMemo(() => (
    calculateAvgApprovalTime(enrichedProgressData, filters, kpiData)
  ), [enrichedProgressData, filters, kpiData]);

  const redAlerts = useMemo(() => (
    getRedCards(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const amberAlerts = useMemo(() => (
    getAmberAlerts(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const categoryProgress: CategoryProgressSummary[] = useMemo(() => (
    getCategoryProgress(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const snapshotItems: ProcessSnapshotItem[] = useMemo(() => (
    getProcessSnapshot(enrichedProgressData, filters, 5)
  ), [enrichedProgressData, filters]);

  const planTotals = useMemo(() => {
    const totals: Record<string, { planned: number; actual: number }> = {
      all: { planned: 0, actual: 0 },
    };

    filteredData.forEach(item => {
      const planned = item.required_count;
      const actual = item.approved_count;

      totals.all.planned += planned;
      totals.all.actual += actual;

      const entry = totals[item.contractor_id] ?? { planned: 0, actual: 0 };
      entry.planned += planned;
      entry.actual += actual;
      totals[item.contractor_id] = entry;
    });

    return totals;
  }, [filteredData]);

  const planOptions = useMemo(() => {
    const options = [{ id: 'all', name: 'All contractors' }];
    contractors.forEach(contractor => {
      options.push({ id: contractor.id, name: contractor.name });
    });
    return options;
  }, [contractors]);

  useEffect(() => {
    const validIds = new Set(planOptions.map(option => option.id));
    if (!validIds.has(planContractorId)) {
      setPlanContractorId(planOptions[0]?.id ?? 'all');
    }
  }, [planOptions, planContractorId]);

  useEffect(() => {
    if (filters.contractor !== 'all' && planContractorId !== filters.contractor) {
      setPlanContractorId(filters.contractor);
    }
  }, [filters.contractor, planContractorId]);

  const mustHaveCount = normalizedDocTypes.filter(docType => docType.isCritical).length;
  const standardCount = normalizedDocTypes.length - mustHaveCount;

  const isDataLoading = contractorsLoading || docTypesLoading || kpiLoading || progressLoading;

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto text-center space-y-4 mt-20">
          <h1 className="text-2xl font-bold">Data load error</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <Button onClick={retry}>Retry</Button>
            <Button variant="outline" onClick={() => window.location.href = '/auth'}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {error && session && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" size="sm" onClick={retry} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <DashboardHeader role={role} />

        <FilterBar
          contractors={contractors}
          categories={availableCategories}
          contractorFilter={filters.contractor}
          categoryFilter={filters.category}
          searchTerm={filters.search ?? ''}
          onContractorChange={value => setFilters(prev => ({ ...prev, contractor: value }))}
          onCategoryChange={value => setFilters(prev => ({ ...prev, category: value }))}
          onSearchChange={value => setFilters(prev => ({ ...prev, search: value }))}
        />

        {isDataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <KpiCards
            overallCompletion={overallCompletion}
            mustHaveReady={mustHaveReady}
            overdueMustHaves={overdueMustHaves}
            avgPrepTime={avgPrepTime}
            avgApprovalTime={avgApprovalTime}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {isDataLoading ? (
              <Skeleton className="h-[260px]" />
            ) : (
              <CriticalAlertsCard
                redItems={redAlerts}
                amberItems={amberAlerts}
                onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
              />
            )}

            {isDataLoading ? (
              <Skeleton className="h-[260px]" />
            ) : (
              <CategoryProgressChart data={categoryProgress} />
            )}

            <SnapshotTable
              items={snapshotItems}
              isLoading={isDataLoading}
              onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
            />
          </div>

          <div className="space-y-6">
            {isDataLoading ? (
              <Skeleton className="h-[260px]" />
            ) : (
              <MustHaveSplitChart mustHaveCount={mustHaveCount} standardCount={standardCount} />
            )}

            {isDataLoading ? (
              <Skeleton className="h-[260px]" />
            ) : (
              <PlannedVsActualCompact
                contractorId={planContractorId}
                onContractorChange={setPlanContractorId}
                contractorOptions={planOptions}
                totals={planTotals}
              />
            )}

            {isDataLoading ? (
              <Skeleton className="h-[260px]" />
            ) : (
              <CompletionByContractorBar kpiData={kpiData} />
            )}
          </div>
        </div>

        <DetailSidePanel
          open={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          contractorId={selectedDetail?.contractorId || null}
          docTypeId={selectedDetail?.docTypeId || null}
          docProgressData={enrichedProgressData}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
