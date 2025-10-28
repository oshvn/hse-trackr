import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/hooks/useSessionRole';
import { UnifiedDashboardLayout } from '@/components/dashboard/UnifiedDashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { ContractorPerformanceRadar } from '@/components/dashboard/ContractorPerformanceRadar';
import { ContractorComparisonDashboard } from '@/components/dashboard/ContractorComparisonDashboard';
import { CompletionByContractorBar } from '@/components/Charts/CompletionByContractorChart';
import { MilestoneGanttChart } from '@/components/dashboard/MilestoneGanttChart';
import { MilestoneOverviewCard } from '@/components/dashboard/MilestoneOverviewCard';
import { ProcessingTimeTable } from '@/components/dashboard/ProcessingTimeTable';
import { KpiCards } from '@/components/dashboard/KpiCards';

import { DetailSidePanel } from '@/components/dashboard/DetailSidePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronDown, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { ActionSuggestions } from '@/components/dashboard/ActionSuggestions';
import { CriticalAlertsModal } from '@/components/dashboard/CriticalAlertsModal';
import { AIActionsDashboard } from '@/components/dashboard/AIActionsDashboard';
import { WorkflowDashboard } from '@/components/dashboard/WorkflowDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiRecommendationService } from '@/services/aiRecommendationService';
import { WorkflowEngine } from '@/services/workflowEngine';
import type { AIAction } from '@/lib/aiTypes';
import { ProcessingTimeDashboard } from '@/components/dashboard/ProcessingTimeDashboard';
import { TimelineAnalysis } from '@/components/dashboard/TimelineAnalysis';
import { ProcessingTimeByContractor } from '@/components/dashboard/ProcessingTimeByContractor';
import { ProcessingTimeByDocType } from '@/components/dashboard/ProcessingTimeByDocType';
import { BottleneckAnalysis } from '@/components/dashboard/BottleneckAnalysis';
import {
  BentoGrid,
  BentoHeader,
  BentoFilters,
  BentoKpi,
  BentoPriority,
  BentoAnalysis,
  BentoDetails
} from '@/components/dashboard/BentoGrid';
import type {
  FilterState,
  KpiData,
  DocProgressData,
  ProcessSnapshotItem,
  RedCardItem,
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
  extractCriticalAlerts,
  calculateTotalDocuments,
  estimateCompletionTime,
  calculateRedCardsData,
  calculateApprovalTimeComparison,
  extractRedCardsByLevel,
  calculateProcessingTimeMetrics,
  generateTimelineData,
  calculateContractorProcessingTimeComparison,
  calculateProcessingTimeByDocumentType,
  analyzeBottlenecks,
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
  const [isCriticalAlertsModalOpen, setIsCriticalAlertsModalOpen] = useState(false);
  const [isCompletionDetailsOpen, setIsCompletionDetailsOpen] = useState(false);
  const [isRedCardsDetailsOpen, setIsRedCardsDetailsOpen] = useState(false);
  const [isApprovalTimeDetailsOpen, setIsApprovalTimeDetailsOpen] = useState(false);
  const [aiActions, setAiActions] = useState<AIAction[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingTimeTab, setProcessingTimeTab] = useState('metrics');
  
  // Initialize Workflow Engine
  const [workflowEngine] = useState(() => new WorkflowEngine({
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 10,
    enableLogging: true,
    enableNotifications: true,
    externalApis: {
      email: {
        provider: 'smtp',
        config: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'noreply@example.com',
            pass: 'password'
          }
        }
      },
      calendar: {
        provider: 'google',
        config: {
          clientId: 'your-google-client-id',
          clientSecret: 'your-google-client-secret',
          redirectUri: 'http://localhost:3000/auth/google/callback'
        }
      },
      tasks: {
        provider: 'jira',
        config: {
          baseUrl: 'https://your-domain.atlassian.net',
          username: 'your-username',
          apiToken: 'your-api-token'
        }
      },
      documents: {
        provider: 'sharepoint',
        config: {
          siteUrl: 'https://your-domain.sharepoint.com',
          clientId: 'your-client-id',
          clientSecret: 'your-client-secret'
        }
      }
    }
  }));

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

  // New: Extract red cards by level using enhanced system
  const redCardsByLevel = useMemo(() => extractRedCardsByLevel(filteredProgressData, criticalDocTypeIds), [filteredProgressData, criticalDocTypeIds]);

  // Legacy: Keep existing red/amber alerts for backward compatibility
  const redAlerts = useMemo(() => criticalAlerts.filter(alert => alert.overdueDays > 0), [criticalAlerts]);

  const amberAlerts = useMemo(() => criticalAlerts.filter(alert => alert.overdueDays === 0 && alert.dueInDays !== null && alert.dueInDays <= 3), [criticalAlerts]);

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

  // New KPI calculations
  const totalDocuments = useMemo(() => (
    calculateTotalDocuments(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const estimatedCompletion = useMemo(() => (
    estimateCompletionTime(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const redCardsData = useMemo(() => (
    calculateRedCardsData(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const approvalTimeComparison = useMemo(() => (
    calculateApprovalTimeComparison(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  const snapshotItems: ProcessSnapshotItem[] = useMemo(() => (
    getProcessSnapshot(enrichedProgressData, filters, 5)
  ), [enrichedProgressData, filters]);

  // Processing time metrics
  const processingTimeMetrics = useMemo(() => (
    calculateProcessingTimeMetrics(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  // Timeline data
  const timelineData = useMemo(() => (
    generateTimelineData(enrichedProgressData, filters, 20)
  ), [enrichedProgressData, filters]);

  // Contractor processing time comparison
  const contractorProcessingTimeComparison = useMemo(() => (
    calculateContractorProcessingTimeComparison(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  // Document type processing time
  const documentTypeProcessingTime = useMemo(() => (
    calculateProcessingTimeByDocumentType(enrichedProgressData, filters)
  ), [enrichedProgressData, filters]);

  // Bottleneck analysis
  const bottleneckAnalysisData = useMemo(() => (
    analyzeBottlenecks(enrichedProgressData, filters)
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

  // Generate AI actions based on critical alerts
  useEffect(() => {
    const generateAIActions = async () => {
      if (criticalAlerts.length === 0) return;

      try {
        const contractorId = filters.contractor === 'all' ? null : filters.contractor;
        const contractorName = contractors.find(c => c.id === contractorId)?.name || 'Selected Contractor';
        
        const request = {
          contractorId: contractorId || 'all',
          contractorName: contractorName || 'All Contractors',
          criticalIssues: criticalAlerts,
          redCards: redCardsByLevel,
          context: {
            projectPhase: 'execution' as const,
            deadlinePressure: redCardsByLevel.level3.length > 0 ? 'high' as const : 'medium' as const,
            stakeholderVisibility: 'internal' as const
          }
        };

        const recommendations = await aiRecommendationService.getRecommendations({
          contractorId: contractorId || 'all',
          contractorName: contractorName || 'All Contractors',
          criticalIssues: criticalAlerts,
          redCards: redCardsByLevel.all,
          context: {
            projectPhase: 'execution' as const,
            deadlinePressure: redCardsByLevel.level3.length > 0 ? 'high' as const : 'medium' as const,
            stakeholderVisibility: 'internal' as const
          }
        });
        
        // Convert recommendations to AI actions
        const actions: AIAction[] = recommendations.map((rec, index) => ({
          id: `ai-action-${Date.now()}-${index}`,
          title: rec.message,
          description: rec.message,
          type: rec.actionType as any,
          priority: {
            score: rec.aiConfidence,
            factors: {
              urgency: rec.severity === 'high' ? 80 : rec.severity === 'medium' ? 60 : 40,
              impact: rec.estimatedImpact === 'high' ? 80 : rec.estimatedImpact === 'medium' ? 60 : 40,
              effort: 50,
              risk: rec.riskScore || 50
            },
            level: rec.severity === 'high' ? 'high' : rec.severity === 'medium' ? 'medium' : 'low' as any
          },
          status: 'pending' as const,
          rootCauseAnalysis: {
            primaryCause: 'Document submission delays',
            contributingFactors: ['Lack of resources', 'Process inefficiencies'],
            patternType: 'recurring' as const,
            confidence: rec.aiConfidence
          },
          impactAssessment: {
            projectImpact: rec.estimatedImpact as any,
            timelineImpact: parseInt(rec.timeToImplement) || 3,
            costImpact: 10,
            qualityImpact: 'medium' as const,
            safetyImpact: 'low' as const
          },
          resourceOptimization: {
            recommendedResources: ['Project Manager', 'Support Team'],
            allocationEfficiency: 75,
            bottlenecks: ['Limited staff availability'],
            optimizationPotential: 20
          },
          timeline: {
            startDate: new Date(),
            endDate: new Date(Date.now() + (parseInt(rec.timeToImplement) || 3) * 24 * 60 * 60 * 1000),
            milestones: [],
            dependencies: [],
            bufferTime: 1
          },
          successProbability: {
            overall: rec.aiConfidence,
            factors: {
              historicalSuccess: 70,
              resourceAvailability: 80,
              stakeholderBuyIn: 75,
              complexity: 30
            },
            confidence: rec.aiConfidence
          },
          assignee: undefined,
          attendees: rec.actionType === 'meeting' ? [contractorName] : undefined,
          relatedDocuments: rec.relatedDocuments,
          relatedContractors: [contractorName],
          relatedIssues: criticalAlerts,
          createdAt: new Date(),
          updatedAt: new Date(),
          aiConfidence: rec.aiConfidence,
          aiGenerated: true,
          learningData: undefined
        }));

        setAiActions(actions);
        
        // Store in localStorage for persistence
        localStorage.setItem('ai_actions', JSON.stringify(actions));
      } catch (error) {
        console.error('Error generating AI actions:', error);
      }
    };

    generateAIActions();
  }, [criticalAlerts, redCardsByLevel, filters.contractor, contractors]);

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
    <>
      <UnifiedDashboardLayout
        // Data
        kpiData={kpiData}
        contractorData={contractors}
        docProgressData={enrichedProgressData}
        criticalAlerts={criticalAlerts}
        processingTimeData={{
          stats: processingTimeStats,
          metrics: processingTimeMetrics,
          timeline: timelineData,
          byContractor: contractorProcessingTimeComparison,
          byDocType: documentTypeProcessingTime,
        }}
        bottleneckData={bottleneckAnalysisData}
        aiActions={aiActions}
        
        // Filters
        filters={{
          contractor: filters.contractor,
          category: filters.category,
        }}
        onFiltersChange={setFilters}
        
        // States
        isLoading={isDataLoading}
        error={error}
        
        // Props
        title="HSE Dashboard"
        subtitle={`Xin chào ${role === 'admin' ? 'Admin' : 'User'}`}
      />

      {/* Legacy modals and panels for backward compatibility */}
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

      <CriticalAlertsModal
        open={isCriticalAlertsModalOpen}
        onClose={() => setIsCriticalAlertsModalOpen(false)}
        redCards={redCardsByLevel}
        docProgressData={enrichedProgressData}
        onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
      />

      {/* Completion Details Modal */}
      <Dialog open={isCompletionDetailsOpen} onOpenChange={setIsCompletionDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Hoàn thành theo Loại Hồ sơ</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="grid gap-4">
              {availableCategories.map(category => {
                const categoryData = filterData(enrichedProgressData, { ...filters, category });
                const categoryFiltered = categoryData.filter(item => item.category === category);
                const categoryApproved = categoryFiltered.reduce((sum, item) => sum + item.approved_count, 0);
                const categoryRequired = categoryFiltered.reduce((sum, item) => sum + item.required_count, 0);
                const categoryCompletion = categoryRequired > 0 ? Math.round((categoryApproved / categoryRequired) * 100) : 0;
                 
                return (
                  <div key={category} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{category}</h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryApproved}/{categoryRequired} hồ sơ đã duyệt
                      </p>
                    </div>
                    <div className="text-right sm:min-w-[150px]">
                      <div className="text-2xl font-bold">{categoryCompletion}%</div>
                      <div className="w-full sm:w-32 bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${categoryCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Red Cards Details Modal */}
      <Dialog open={isRedCardsDetailsOpen} onOpenChange={setIsRedCardsDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Red Cards - Cảnh báo Rủi ro Thi công</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-sm">Tài liệu bắt buộc còn thiếu</h3>
                </div>
                <div className="text-2xl font-bold text-red-600">{redCardsData.missing}</div>
              </Card>
              <Card className="p-4 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <h3 className="font-medium text-sm">Tài liệu quá hạn</h3>
                </div>
                <div className="text-2xl font-bold text-amber-600">{redCardsData.overdue}</div>
              </Card>
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-sm">Nhà thầu chưa thể bắt đầu</h3>
                </div>
                <div className="text-2xl font-bold text-blue-600">{redCardsData.contractorsCantStart}</div>
              </Card>
            </div>
            
            <div className="space-y-2">
              {criticalAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Không có cảnh báo rủi ro nào</p>
                </div>
              ) : (
                criticalAlerts.map(alert => (
                  <div key={`${alert.contractorId}-${alert.docTypeId}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.docTypeName}</h4>
                      <p className="text-sm text-muted-foreground">{alert.contractorName}</p>
                    </div>
                    <div className="text-right sm:min-w-[120px]">
                      {alert.overdueDays > 0 ? (
                        <span className="text-red-600 font-medium">Quá hạn {alert.overdueDays} ngày</span>
                      ) : alert.dueInDays !== null ? (
                        <span className="text-amber-600 font-medium">Còn {alert.dueInDays} ngày</span>
                      ) : (
                        <span className="text-gray-600">Không có hạn</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Time Details Modal */}
      <Dialog open={isApprovalTimeDetailsOpen} onOpenChange={setIsApprovalTimeDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Thời gian Phê duyệt theo Nhà thầu</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-4">
              {processingTimeStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Không có dữ liệu thời gian phê duyệt</p>
                </div>
              ) : (
                processingTimeStats.map(stat => (
                  <div key={stat.contractorId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{stat.contractorName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Thời gian chuẩn bị: {stat.averagePrepDays || 0} ngày
                      </p>
                    </div>
                    <div className="text-right sm:min-w-[120px]">
                      <div className="text-2xl font-bold">{stat.averageApprovalDays || 0} ngày</div>
                      <div className="text-sm text-muted-foreground">
                        Thời gian phê duyệt TB
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
