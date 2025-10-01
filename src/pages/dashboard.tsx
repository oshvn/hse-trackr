import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/hooks/useSessionRole';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { PlannedVsActual } from '@/components/Charts/PlannedVsActualChart';
import { CompletionByContractorBar } from '@/components/Charts/CompletionByContractorChart';
import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
import { ProgressByCategory } from '@/components/dashboard/ProgressByCategory';
import { CompletionMatrix } from '@/components/dashboard/CompletionMatrix';
import type { CompletionMatrixCell } from '@/components/dashboard/CompletionMatrix';
import { CriticalDocsSection } from '@/components/dashboard/CriticalDocsSection';
import { CategoryDrilldownPanel } from '@/components/dashboard/CategoryDrilldownPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { FilterState, KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import {
  calculateOverallCompletion,
  calculateMustHaveReady,
  calculateOverdueMustHaves,
  calculateAvgPrepTime,
  calculateAvgApprovalTime,
  getRedCards,
  filterData
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
  const { session, role, loading, error, retry } = useSessionRole();
  const [filters, setFilters] = useState<FilterState>({
    contractor: 'all',
    category: 'all',
    search: '',
  });
  const [drilldown, setDrilldown] = useState<{ category: string | null; contractorId: string | null }>({
    category: null,
    contractorId: null,
  });
  const [selectedDetail, setSelectedDetail] = useState<{ contractorId: string; docTypeId: string } | null>(null);

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

  const { data: requirements = [] } = useQuery({
    queryKey: ['contractor_requirements', filters.contractor],
    queryFn: async () => {
      if (filters.contractor === 'all') return [];

      const { data, error: queryError } = await supabase
        .from('contractor_requirements')
        .select('doc_type_id, required_count, planned_due_date')
        .eq('contractor_id', filters.contractor);

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session && role !== 'guest' && filters.contractor !== 'all',
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', filters.contractor],
    queryFn: async () => {
      if (filters.contractor === 'all') return [];

      const { data, error: queryError } = await supabase
        .from('submissions')
        .select('doc_type_id, approved_at, cnt')
        .eq('contractor_id', filters.contractor)
        .not('approved_at', 'is', null);

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!session && role !== 'guest' && filters.contractor !== 'all',
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

  const categoriesForView = (filters.category === 'all'
    ? availableCategories
    : availableCategories.filter(category => category === filters.category)) as typeof CATEGORY_ORDER;

  const visibleContractors = filters.contractor === 'all'
    ? contractors
    : contractors.filter(contractor => contractor.id === filters.contractor);

  const categoryProgressItems = useMemo(() => {
    const totals = new Map<string, { approved: number; required: number }>();

    baseFilteredData.forEach(item => {
      const summary = totals.get(item.category) ?? { approved: 0, required: 0 };
      summary.approved += item.approved_count;
      summary.required += item.required_count;
      totals.set(item.category, summary);
    });

    return categoriesForView.map(category => {
      const summary = totals.get(category) ?? { approved: 0, required: 0 };
      const completion = summary.required > 0
        ? (summary.approved / summary.required) * 100
        : 0;

      return {
        category,
        approved: summary.approved,
        required: summary.required,
        completion,
      };
    });
  }, [baseFilteredData, categoriesForView]);

  const matrixCells = useMemo(() => {
    const map = new Map<string, CompletionMatrixCell>();

    baseFilteredData.forEach(item => {
      const key = `${item.category}__${item.contractor_id}`;
      const existing = map.get(key) ?? {
        category: item.category,
        contractorId: item.contractor_id,
        contractorName: item.contractor_name,
        approved: 0,
        required: 0,
        completion: 0,
      };

      existing.approved += item.approved_count;
      existing.required += item.required_count;
      existing.completion = existing.required > 0
        ? (existing.approved / existing.required) * 100
        : 0;

      map.set(key, existing);
    });

    return Array.from(map.values()).filter(cell => categoriesForView.includes(cell.category as any));
  }, [baseFilteredData, categoriesForView]);

  const redCards = useMemo(() => {
    return getRedCards(enrichedProgressData, filters).filter(item => item.overdueDays > 0);
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

  const isDataLoading = contractorsLoading || docTypesLoading || kpiLoading || progressLoading;

  const contractorName = filters.contractor === 'all'
    ? 'All Contractors'
    : contractors.find(contractor => contractor.id === filters.contractor)?.name ?? 'Contractor';

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto text-center space-y-4 mt-20">
          <h1 className="text-2xl font-bold">Lỗi tải dữ liệu</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <Button onClick={retry}>Thử lại</Button>
            <Button variant="outline" onClick={() => window.location.href = '/auth'}>
              Đăng nhập
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
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h1 className="text-3xl font-bold">HSE Document Register</h1>
          <p className="text-muted-foreground">
            Track contractor compliance and document status
            {role === 'guest' && ' (Chế độ khách)'}
          </p>
        </div>

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

        {isDataLoading ? (
          <Skeleton className="h-52" />
        ) : (
          <ProgressByCategory
            items={categoryProgressItems}
            onCategoryClick={category => setDrilldown({
              category,
              contractorId: filters.contractor === 'all' ? null : filters.contractor,
            })}
          />
        )}

        {isDataLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <CompletionMatrix
            categories={categoriesForView}
            contractors={visibleContractors}
            cells={matrixCells}
            onCellClick={(category, contractorId) => setDrilldown({ category, contractorId })}
          />
        )}

        {isDataLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <CriticalDocsSection
            items={redCards}
            onDocClick={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {isDataLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <CompletionByContractorBar kpiData={kpiData} />
          )}

          {isDataLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <PlannedVsActual
              contractorId={filters.contractor}
              contractorName={contractorName}
              requirements={requirements}
              submissions={submissions}
            />
          )}
        </div>

        <CategoryDrilldownPanel
          open={!!drilldown.category}
          onClose={() => setDrilldown({ category: null, contractorId: null })}
          category={drilldown.category}
          contractors={contractors}
          docTypes={normalizedDocTypes}
          progressData={baseFilteredData}
          focusedContractorId={drilldown.contractorId}
          onSelectDoc={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
        />

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
