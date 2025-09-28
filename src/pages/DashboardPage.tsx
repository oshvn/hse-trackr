import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ensureSession } from '@/lib/autoGuest';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { PlannedVsActual } from '@/components/dashboard/PlannedVsActual';
import { RedCards } from '@/components/dashboard/RedCards';
import { CompletionByContractorBar } from '@/components/dashboard/CompletionByContractorBar';
import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [sessionReady, setSessionReady] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    contractor: 'all',
    category: 'all'
  });
  const [selectedCell, setSelectedCell] = useState<{ contractorId: string; docTypeId: string } | null>(null);

  // Ensure guest session before any queries
  useEffect(() => {
    ensureSession().then(() => {
      setSessionReady(true);
    });
  }, []);

  // Fetch contractors
  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: sessionReady,
  });

  // Fetch document types for category filter
  const { data: docTypes = [] } = useQuery({
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
    enabled: sessionReady,
  });

  // Fetch KPI data
  const { data: kpiData = [] }: { data: KpiData[] } = useQuery({
    queryKey: ["contractor_kpi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contractor_kpi")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
    enabled: sessionReady,
  });

  // Fetch progress data
  const { data: progressData = [] }: { data: DocProgressData[] } = useQuery({
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
    enabled: sessionReady,
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
    enabled: sessionReady && filters.contractor !== 'all',
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
    enabled: sessionReady && filters.contractor !== 'all',
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

  if (!sessionReady) {
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">HSE Document Register</h1>
          <p className="text-muted-foreground">Track contractor compliance and document status</p>
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
        <KpiCards
          overallCompletion={overallCompletion}
          mustHaveReady={mustHaveReady}
          overdueMustHaves={overdueMustHaves}
          avgPrepTime={avgPrepTime}
          avgApprovalTime={avgApprovalTime}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Heatmap
            data={filteredProgressData}
            contractors={contractors}
            docTypes={docTypes}
            filters={filters}
            onCellClick={handleCellClick}
          />
          
          <PlannedVsActual
            contractorId={filters.contractor}
            contractorName={contractorName}
            requirements={requirements}
            submissions={submissions}
          />
          
          <RedCards
            redCards={redCards}
            onCardClick={handleRedCardClick}
          />
          
          <CompletionByContractorBar
            kpiData={kpiData}
          />
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