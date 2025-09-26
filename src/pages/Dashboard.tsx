import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ensureSession } from "@/lib/autoGuest";
import { KpiCard } from "@/components/KpiCard";
import { DocumentHeatmap } from "@/components/DocumentHeatmap";
import { CompletionChart } from "@/components/CompletionChart";
import { PlannedVsActualChart } from "@/components/PlannedVsActualChart";
import { RedCardsList } from "@/components/RedCardsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [sessionReady, setSessionReady] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
        .select("category")
        .order("category");
      
      if (error) throw error;
      return data || [];
    },
    enabled: sessionReady,
  });

  // Fetch KPI data
  const { data: kpiData = [] } = useQuery({
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
  const { data: progressData = [] } = useQuery({
    queryKey: ["doc_progress", selectedContractor, selectedCategory],
    queryFn: async () => {
      let query = supabase.from("v_doc_progress").select("*");
      
      if (selectedContractor !== "all") {
        query = query.eq("contractor_id", selectedContractor);
      }
      
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }
      
      const { data, error } = await query.order("contractor_name").order("doc_type_name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: sessionReady,
  });

  // Calculate overall KPIs
  const overallCompletion = kpiData.length > 0 
    ? Math.round((kpiData.reduce((sum, item) => sum + (item.completion_ratio || 0), 0) / kpiData.length) * 100)
    : 0;

  const overallMustHave = kpiData.length > 0
    ? Math.round((kpiData.reduce((sum, item) => sum + (item.must_have_ready_ratio || 0), 0) / kpiData.length) * 100)
    : 0;

  const totalOverdue = progressData.filter(row => row.status_color === 'red').length;

  const avgPrepTime = kpiData.length > 0
    ? Math.round(kpiData.reduce((sum, item) => sum + (item.avg_prep_days || 0), 0) / kpiData.length)
    : 0;

  const avgApprovalTime = kpiData.length > 0
    ? Math.round(kpiData.reduce((sum, item) => sum + (item.avg_approval_days || 0), 0) / kpiData.length)
    : 0;

  const categories = Array.from(new Set(docTypes.map(dt => dt.category))).sort();

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

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedContractor} onValueChange={setSelectedContractor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select contractor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contractors</SelectItem>
              {contractors.map(contractor => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Overall Completion"
            value={`${overallCompletion}%`}
            subtitle="Average across contractors"
          />
          <KpiCard
            title="Must-have Ready"
            value={`${overallMustHave}%`}
            subtitle="Critical documents approved"
          />
          <KpiCard
            title="Overdue Must-Haves"
            value={totalOverdue}
            subtitle="Critical items past due"
            trend={totalOverdue > 0 ? "down" : "neutral"}
          />
          <KpiCard
            title="Avg Prep Time"
            value={`${avgPrepTime} days`}
            subtitle="From start to submission"
          />
          <KpiCard
            title="Avg Approval Time"
            value={`${avgApprovalTime} days`}
            subtitle="From submission to approval"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocumentHeatmap 
            data={progressData} 
            contractors={contractors}
            selectedContractor={selectedContractor}
          />
          <CompletionChart data={kpiData} />
          <PlannedVsActualChart 
            data={progressData}
            selectedContractor={selectedContractor}
          />
          <RedCardsList data={progressData} />
        </div>
      </div>
    </div>
  );
}