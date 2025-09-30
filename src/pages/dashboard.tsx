import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/hooks/useSessionRole';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { Heatmap } from '@/components/Heatmap';
import { PlannedVsActual } from '@/components/Charts/PlannedVsActualChart';
import { RedCardList } from '@/components/RedCardList';
import { CompletionByContractorBar } from '@/components/Charts/CompletionByContractorChart';
import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
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

const DashboardPage: React.FC = () => {
  const { session, role, loading, error, retry } = useSessionRole();
  const [filters, setFilters] = useState<FilterState>({
    contractor: 'all',
    category: 'all'
  });
  const [selectedCell, setSelectedCell] = useState<{ contractorId: string; docTypeId: string } | null>(null);

  // Fetch contractors - guest accessible
  const { data: contractors = [], isLoading: contractorsLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch document types for category filter - guest accessible
  const { data: docTypes = [], isLoading: docTypesLoading } = useQuery({
    queryKey: ["doc_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doc_types")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    retry: 2
  });

  // Fetch KPI data - requires auth
  const { data: kpiData = [], isLoading: kpiLoading }: { data: KpiData[]; isLoading: boolean } = useQuery({
    queryKey: ["contractor_kpi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contractor_kpi")
        .select("*");

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    retry: 1
  });

  // Fetch progress data - requires auth
  const { data: progressData = [], isLoading: progressLoading }: { data: DocProgressData[]; isLoading: boolean } = useQuery({
    queryKey: ["doc_progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_doc_progress")
        .select("*")
        .order("contractor_name")
        .order("doc_type_name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    retry: 1
  });

  // Fetch requirements for planned vs actual
  const { data: requirements = [] } = useQuery({
    queryKey: ["contractor_requirements", filters.contractor],
    queryFn: async () => {
      if (filters.contractor === 'all') return [];

      const { data, error } = await supabase
        .from("contractor_requirements")
        .select("doc_type_id, required_count, planned_due_date")
        .eq("contractor_id", filters.contractor);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session && role !== 'guest' && filters.contractor !== 'all',
  });

  // Fetch submissions for planned vs actual
  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", filters.contractor],
    queryFn: async () => {
      if (filters.contractor === 'all') return [];

      const { data, error } = await supabase
        .from("submissions")
        .select("doc_type_id, approved_at, cnt")
        .eq("contractor_id", filters.contractor)
        .not("approved_at", "is", null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session && role !== 'guest' && filters.contractor !== 'all',
  });

  // Calculate KPIs based on current filters
  const filteredProgressData = filterData(progressData, filters);

  const overallCompletion = calculateOverallCompletion(progressData, filters, kpiData);
  const mustHaveReady = calculateMustHaveReady(progressData, filters, kpiData);
  const overdueMustHaves = calculateOverdueMustHaves(progressData, filters);
  const avgPrepTime = calculateAvgPrepTime(progressData, filters, kpiData);
  const avgApprovalTime = calculateAvgApprovalTime(progressData, filters, kpiData);

  // Get red cards
  const redCards = getRedCards(progressData, filters);

  // Get unique categories
  const categories = Array.from(new Set(docTypes.map(dt => dt.category))).sort();

  // Get selected contractor name
  const selectedContractor = contractors.find(c => c.id === filters.contractor);
  const contractorName = selectedContractor ? selectedContractor.name : 'All Contractors';

  const handleCellClick = (contractorId: string, docTypeId: string) => {
    setSelectedCell({ contractorId, docTypeId });
  };

  const handleRedCardClick = (contractorId: string, docTypeId: string) => {
    setSelectedCell({ contractorId, docTypeId });
  };

  const isDataLoading = contractorsLoading || docTypesLoading || kpiLoading || progressLoading;

  // Loading states
  if (loading || (!session && !error)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error with retry
  if (error && !session) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto text-center space-y-4 mt-20">
          <h1 className="text-2xl font-bold">Lỗi tải dữ liệu</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <Button onClick={retry}>Thử lại</Button>
            <Button variant="outline" onClick={() => window.location.href = "/auth"}>
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
        {/* Auth warning for guests */}
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

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">HSE Document Register</h1>
          <p className="text-muted-foreground">
            Track contractor compliance and document status
            {role === "guest" && " (Chế độ xem khách)"}
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          contractors={contractors}
          categories={categories}
          contractorFilter={filters.contractor}
          categoryFilter={filters.category}
          onContractorChange={(value) => setFilters(prev => ({ ...prev, contractor: value }))}
          onCategoryChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
        />

        {/* KPI Cards */}
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isDataLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <Heatmap
              data={filteredProgressData}
              contractors={contractors}
              docTypes={docTypes}
              filters={filters}
              onCellClick={handleCellClick}
            />
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

          {isDataLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <RedCardList
              redCards={redCards}
              onCardClick={handleRedCardClick}
            />
          )}

          {isDataLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <CompletionByContractorBar
              kpiData={kpiData}
            />
          )}
        </div>

        {/* Detail Side Panel */}
        <DetailSidePanel
          open={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          contractorId={selectedCell?.contractorId || null}
          docTypeId={selectedCell?.docTypeId || null}
          docProgressData={progressData}
        />
      </div>
    </div>
  );
};

export default DashboardPage;