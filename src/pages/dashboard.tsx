import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/hooks/useSessionRole';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { ContractorPerformanceRadar } from '@/components/dashboard/ContractorPerformanceRadar';
import { CompletionByContractorBar } from '@/components/Charts/CompletionByContractorChart';
import { MilestoneGanttChart } from '@/components/dashboard/MilestoneGanttChart';
import { MilestoneOverviewCard } from '@/components/dashboard/MilestoneOverviewCard';
import { ProcessingTimeTable } from '@/components/dashboard/ProcessingTimeTable';
import { ActionSuggestions } from '@/components/dashboard/ActionSuggestions';
import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MustHaveSplitChart } from '@/components/dashboard/MustHaveSplitChart';
import { CriticalAlertsCard } from '@/components/dashboard/CriticalAlertsCard';
import { CategoryProgressChart } from '@/components/dashboard/CategoryProgressChart';
import { BulletChart } from '@/components/dashboard/BulletChart';
import { PlannedVsActualCompact } from '@/components/dashboard/PlannedVsActualCompact';
import { SnapshotTable } from '@/components/dashboard/SnapshotTable';
import { CategoryDrilldownPanel } from '@/components/dashboard/CategoryDrilldownPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  FilterState,
  KpiData,
  DocProgressData,
  ProcessSnapshotItem,
} from '@/lib/dashboardHelpers';
import {
  calculateOverallCompletion,
  calculateMustHaveReady,
  calculateOverdueMustHaves,
  calculateAvgPrepTime,
  calculateAvgApprovalTime,
  getProcessSnapshot,
  filterData,
  calculateDetailedProgressByContractor,
  calculateMilestoneProgress,
  calculateProcessingTimes,
  generateActionSuggestions,
  extractCriticalAlerts,
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

interface RequirementRow {
  doc_type_id: string;
  required_count: number;
  planned_due_date: string | null;
}

interface SubmissionRow {
  doc_type_id: string;
  approved_at: string | null;
  cnt: number;
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
  const [categoryDrilldown, setCategoryDrilldown] = useState<{ category: string; contractorId: string | null; contractorName: string | null } | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const {
    data: criticalDocuments = [],
    isLoading: criticalDocumentsLoading,
  } = useQuery<{ doc_type_id: string }[]>({
    queryKey: ['critical_documents'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('doc_types')
        .select('id')
        .eq('is_critical', true);
      if (queryError) throw queryError;
      return (data || []).map(item => ({ doc_type_id: item.id }));
    },
    enabled: !!session,
    retry: 1,
  });

  const normalizedDocTypes = useMemo(() => docTypes.map(docType => {
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
  }), [docTypes]);

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

  const enrichedProgressData = useMemo(() => progressData.map(item => {
    const meta = docTypeMeta.get(item.doc_type_id);
    const primaryCategory = meta?.primaryCategory ?? item.category;

    return {
      ...item,
      doc_type_code: meta?.code ?? item.doc_type_code ?? null,
      category: primaryCategory,
      is_critical: item.is_critical || meta?.isCritical || false,
    };
  }), [progressData, docTypeMeta]);

  const baseFilteredData = useMemo(() => filterData(enrichedProgressData, {
    contractor: filters.contractor,
    category: 'all',
    search: filters.search,
  }), [enrichedProgressData, filters.contractor, filters.search]);

  const filteredProgressData = useMemo(() => filterData(enrichedProgressData, filters), [enrichedProgressData, filters]);

  const categoriesPresent = useMemo(() => {
    const present = new Set(baseFilteredData.map(item => item.category));
    return CATEGORY_ORDER.filter(category => present.has(category));
  }, [baseFilteredData]);

  const availableCategories = categoriesPresent.length > 0 ? categoriesPresent : CATEGORY_ORDER;

  const detailedProgressByContractor = useMemo(() => calculateDetailedProgressByContractor(filteredProgressData), [filteredProgressData]);

  const milestoneProgressItems = useMemo(() => calculateMilestoneProgress(filteredProgressData), [filteredProgressData]);

  const processingTimeStats = useMemo(() => calculateProcessingTimes(filteredProgressData), [filteredProgressData]);

  const criticalDocTypeIds = useMemo(() => (criticalDocuments || []).map(doc => doc.doc_type_id), [criticalDocuments]);

  const criticalAlerts = useMemo(() => extractCriticalAlerts(filteredProgressData, criticalDocTypeIds), [filteredProgressData, criticalDocTypeIds]);

  const redAlerts = useMemo(() => criticalAlerts.filter(alert => alert.overdueDays > 0), [criticalAlerts]);

  const amberAlerts = useMemo(() => criticalAlerts.filter(alert => alert.overdueDays === 0 && alert.dueInDays !== null && alert.dueInDays <= 3), [criticalAlerts]);

  const actionSuggestions = useMemo(() => generateActionSuggestions(criticalAlerts), [criticalAlerts]);

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

  const snapshotItems: ProcessSnapshotItem[] = useMemo(() => (
    getProcessSnapshot(enrichedProgressData, filters, 5)
  ), [enrichedProgressData, filters]);

  const planOptions = useMemo(() => {
    const options = [{ id: 'all', name: 'All contractors' }];
    contractors.forEach(contractor => {
      options.push({ id: contractor.id, name: contractor.name });
    });
    return options;
  }, [contractors]);

  const planContractorName = useMemo(() => (
    planOptions.find(option => option.id === planContractorId)?.name ?? 'Contractor'
  ), [planOptions, planContractorId]);

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

  const planDataEnabled = !!session && planContractorId !== 'all';

  const {
    data: planRequirements = [],
    isLoading: planRequirementsLoading,
  } = useQuery<RequirementRow[]>({
    queryKey: ['plan_requirements', planContractorId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('contractor_requirements')
        .select('doc_type_id, required_count, planned_due_date')
        .eq('contractor_id', planContractorId);
      if (queryError) throw queryError;
      return data || [];
    },
    enabled: planDataEnabled,
  });

  const {
    data: planSubmissions = [],
    isLoading: planSubmissionsLoading,
  } = useQuery<SubmissionRow[]>({
    queryKey: ['plan_submissions', planContractorId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('submissions')
        .select('doc_type_id, approved_at, cnt')
        .eq('contractor_id', planContractorId)
        .not('approved_at', 'is', null)
        .order('approved_at', { ascending: true });
      if (queryError) throw queryError;
      return data || [];
    },
    enabled: planDataEnabled,
  });

  const categoryDrilldownItems = useMemo(() => {
    if (!categoryDrilldown?.category) return [] as DocProgressData[];
    return filterData(enrichedProgressData, {
      contractor: categoryDrilldown.contractorId ?? filters.contractor,
      category: categoryDrilldown.category,
      search: filters.search,
    });
  }, [categoryDrilldown, enrichedProgressData, filters.contractor, filters.search]);

  const mustHaveCount = normalizedDocTypes.filter(docType => docType.isCritical).length;
  const standardCount = normalizedDocTypes.length - mustHaveCount;

  const isDataLoading = contractorsLoading || docTypesLoading || kpiLoading || progressLoading || criticalDocumentsLoading;

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

        {/* KPI Zone */}
        {isDataLoading ? (
          <Skeleton className="h-[380px] w-full" />
        ) : (
          <ContractorPerformanceRadar
            data={kpiData}
            summary={{
              overallCompletion,
              mustHaveReady,
              overdueMustHaves,
              avgPrepTime,
              avgApprovalTime,
            }}
          />
        )}

        {/* Priority Zone */}
        <div className="rounded-lg border-2 border-status-warning/30 bg-priority-bg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-status-warning animate-pulse" />
            <h2 className="text-xl font-bold text-foreground">Priority Actions</h2>
          </div>
          
          <div className="grid gap-4 lg:grid-cols-2">
            {isDataLoading ? (
              <>
                <Skeleton className="h-[220px]" />
                <Skeleton className="h-[220px]" />
              </>
            ) : (
              <>
                <CriticalAlertsCard
                  redItems={redAlerts}
                  amberItems={amberAlerts}
                  onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
                />
                <ActionSuggestions suggestions={actionSuggestions} />
              </>
            )}
          </div>
        </div>

        {/* Analysis Zone */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Analysis & Insights</h2>
          <div className="grid gap-4 xl:grid-cols-3 auto-rows-[220px]">
            {isDataLoading ? (
              <>
                <Skeleton className="min-h-[220px]" />
                <Skeleton className="min-h-[220px]" />
                <Skeleton className="min-h-[220px]" />
              </>
            ) : (
              <>
                <BulletChart
                  className="min-h-[220px]"
                  data={detailedProgressByContractor}
                  onSelect={(category, contractorId) => {
                    const contractorName = contractors.find(contractor => contractor.id === contractorId)?.name ?? null;
                    setCategoryDrilldown({ category, contractorId, contractorName });
                  }}
                />
                <MustHaveSplitChart
                  className="min-h-[220px]"
                  mustHaveCount={mustHaveCount}
                  standardCount={standardCount}
                />
                <CompletionByContractorBar
                  className="min-h-[220px]"
                  kpiData={kpiData}
                />
              </>
            )}

            <PlannedVsActualCompact
              className="min-h-[220px]"
              contractorId={planContractorId}
              contractorName={planContractorName}
              contractorOptions={planOptions}
              requirements={planRequirements}
              submissions={planSubmissions}
              onContractorChange={setPlanContractorId}
              isLoading={planContractorId !== 'all' ? (planRequirementsLoading || planSubmissionsLoading) : false}
            />

            <SnapshotTable
              className="min-h-[220px]"
              items={snapshotItems}
              isLoading={isDataLoading}
              onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
            />
          </div>
        </div>

        {/* Details Zone - Collapsible */}
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <div className="rounded-lg border bg-card">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 hover:bg-accent"
              >
                <h2 className="text-xl font-bold text-foreground">Detailed Analytics</h2>
                <ChevronDown className={`h-5 w-5 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                {isDataLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-[220px]" />
                    <Skeleton className="h-[320px]" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <MilestoneOverviewCard items={milestoneProgressItems} onViewDetails={() => setIsMilestoneModalOpen(true)} />
                    <ProcessingTimeTable data={processingTimeStats} />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Milestone timeline</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <MilestoneGanttChart items={milestoneProgressItems} />
            </div>
          </DialogContent>
        </Dialog>

        <DetailSidePanel
          open={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          contractorId={selectedDetail?.contractorId || null}
          docTypeId={selectedDetail?.docTypeId || null}
          docProgressData={enrichedProgressData}
        />

        <CategoryDrilldownPanel
          open={!!categoryDrilldown}
          category={categoryDrilldown?.category ?? null}
          contractorId={categoryDrilldown?.contractorId ?? null}
          contractorName={categoryDrilldown?.contractorName ?? null}
          onClose={() => setCategoryDrilldown(null)}
          items={categoryDrilldownItems}
          onSelectDoc={(contractorId, docTypeId) => {
            setCategoryDrilldown(null);
            setSelectedDetail({ contractorId, docTypeId });
          }}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
