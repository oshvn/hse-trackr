import type { CriticalAlertItem, RedCardItem } from '@/lib/dashboardHelpers';

// Enhanced AI Analysis Engine Types
export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  patternType: 'recurring' | 'isolated' | 'systemic' | 'resource-related';
  confidence: number;
}

export interface PatternRecognition {
  pattern: string;
  frequency: number;
  affectedContractors: string[];
  affectedDocuments: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
}

export interface ImpactAssessment {
  projectImpact: 'critical' | 'high' | 'medium' | 'low';
  timelineImpact: number; // days
  costImpact: number; // percentage
  qualityImpact: 'critical' | 'high' | 'medium' | 'low';
  safetyImpact: 'critical' | 'high' | 'medium' | 'low';
}

export interface ResourceOptimization {
  recommendedResources: string[];
  allocationEfficiency: number; // percentage
  bottlenecks: string[];
  optimizationPotential: number; // percentage
}

// Enhanced Action Types
export type ActionType = 'meeting' | 'email' | 'escalation' | 'support' | 'training' | 'audit' | 'review';

export interface ActionPriority {
  score: number; // 0-100
  factors: {
    urgency: number;
    impact: number;
    effort: number;
    risk: number;
  };
  level: 'critical' | 'high' | 'medium' | 'low';
}

export interface TimelinePlanning {
  startDate: Date;
  endDate: Date;
  milestones: Array<{
    name: string;
    date: Date;
    completed: boolean;
  }>;
  dependencies: string[];
  bufferTime: number; // days
}

export interface SuccessProbability {
  overall: number; // 0-100
  factors: {
    historicalSuccess: number;
    resourceAvailability: number;
    stakeholderBuyIn: number;
    complexity: number;
  };
  confidence: number; // 0-100
}

// Enhanced AI Action Interface
export interface AIAction {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  priority: ActionPriority;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  
  // Analysis components
  rootCauseAnalysis: RootCauseAnalysis;
  impactAssessment: ImpactAssessment;
  resourceOptimization: ResourceOptimization;
  
  // Planning components
  timeline: TimelinePlanning;
  successProbability: SuccessProbability;
  
  // Execution components
  assignee?: string;
  attendees?: string[];
  relatedDocuments: string[];
  relatedContractors: string[];
  relatedIssues: (CriticalAlertItem | RedCardItem)[];
  
  // Tracking components
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  feedback?: ActionFeedback;
  
  // AI components
  aiConfidence: number;
  aiGenerated: boolean;
  learningData?: LearningData;
}

// Action Type Specific Interfaces
export interface MeetingAction extends AIAction {
  type: 'meeting';
  meetingDetails: {
    agenda: string[];
    duration: number; // minutes
    location: string;
    virtual: boolean;
    recurring: boolean;
    requiredPreparation: string[];
  };
}

export interface EmailAction extends AIAction {
  type: 'email';
  emailDetails: {
    template: string;
    recipients: string[];
    cc: string[];
    subject: string;
    attachments: string[];
    trackingEnabled: boolean;
    followUpRequired: boolean;
  };
}

export interface SupportAction extends AIAction {
  type: 'support';
  supportDetails: {
    supportType: 'technical' | 'administrative' | 'mentoring' | 'training';
    supportLevel: 'basic' | 'intermediate' | 'advanced';
    duration: number; // days
    resources: string[];
    mentor?: string;
  };
}

export interface EscalationAction extends AIAction {
  type: 'escalation';
  escalationDetails: {
    escalationLevel: 'project_manager' | 'department_head' | 'executive' | 'client';
    reason: string;
    previousActions: string[];
    expectedResolution: string;
    urgency: 'immediate' | 'within_24h' | 'within_48h' | 'within_week';
  };
}

export interface TrainingAction extends AIAction {
  type: 'training';
  trainingDetails: {
    trainingType: 'technical' | 'process' | 'safety' | 'quality';
    targetAudience: string[];
    duration: number; // hours
    materials: string[];
    trainer?: string;
    assessmentRequired: boolean;
  };
}

// Action Execution Interfaces
export interface ActionExecutionResult {
  actionId: string;
  success: boolean;
  executedAt: Date;
  executionTime: number; // milliseconds
  result: any;
  error?: string;
  metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
  timeToExecute: number;
  resourcesUsed: string[];
  userSatisfaction?: number;
  actualImpact: ImpactAssessment;
  lessonsLearned: string[];
}

// Feedback and Learning Interfaces
export interface ActionFeedback {
  actionId: string;
  rating: number; // 1-5
  effectiveness: number; // 1-100
  comments: string;
  wouldRecommend: boolean;
  actualTimeSpent: number; // minutes
  actualImpact: ImpactAssessment;
  suggestions: string[];
  createdAt: Date;
}

export interface LearningData {
  patternId: string;
  successRate: number;
  averageExecutionTime: number;
  userFeedback: ActionFeedback[];
  contextualFactors: Record<string, any>;
  improvementSuggestions: string[];
}

// Dashboard and UI Interfaces
export interface AIActionsDashboardState {
  actions: AIAction[];
  filters: {
    types: ActionType[];
    priorities: string[];
    statuses: string[];
    assignees: string[];
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  view: 'list' | 'grid' | 'kanban';
  sortBy: 'priority' | 'date' | 'status' | 'type';
  sortOrder: 'asc' | 'desc';
  batchMode: boolean;
  selectedActions: string[];
}

export interface ActionCardProps {
  action: AIAction;
  onExecute: (actionId: string) => void;
  onEdit: (actionId: string) => void;
  onDelete: (actionId: string) => void;
  onStatusChange: (actionId: string, status: AIAction['status']) => void;
  onFeedback: (actionId: string, feedback: ActionFeedback) => void;
  compact?: boolean;
}

// Batch Execution Interfaces
export interface BatchExecutionRequest {
  actionIds: string[];
  executionMode: 'sequential' | 'parallel';
  failureMode: 'stop_on_first' | 'continue_on_error';
  schedule?: Date;
}

export interface BatchExecutionResult {
  batchId: string;
  totalActions: number;
  successful: number;
  failed: number;
  results: ActionExecutionResult[];
  startTime: Date;
  endTime: Date;
  totalDuration: number; // milliseconds
}

// Integration Interfaces
export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  enabled: boolean;
  defaultCalendar: string;
  syncSettings: {
    syncMeetings: boolean;
    syncDeadlines: boolean;
    reminderSettings: {
      email: boolean;
      push: boolean;
      timing: number; // minutes before
    };
  };
}

export interface EmailIntegration {
  provider: 'gmail' | 'outlook' | 'sendgrid';
  enabled: boolean;
  defaultSender: string;
  templates: Record<string, EmailTemplate>;
  tracking: {
    opens: boolean;
    clicks: boolean;
    replies: boolean;
  };
}

export interface TaskManagementIntegration {
  provider: 'jira' | 'asana' | 'trello' | 'monday';
  enabled: boolean;
  defaultProject: string;
  mapping: {
    priority: Record<string, string>;
    status: Record<string, string>;
    assignee: Record<string, string>;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
}

// AI Learning System Interfaces
export interface AILearningConfig {
  enabled: boolean;
  learningRate: number;
  feedbackWeight: number;
  patternRecognition: {
    minOccurrences: number;
    timeWindow: number; // days
    confidenceThreshold: number;
  };
  adaptation: {
    contextSensitivity: number;
    userPreferenceWeight: number;
    historicalWeight: number;
  };
}

export interface AIModelUpdate {
  timestamp: Date;
  version: string;
  improvements: string[];
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  trainingDataSize: number;
}

// Error Handling and Fallback Interfaces
export interface AIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;
  fallbackAvailable: boolean;
}

export interface FallbackStrategy {
  type: 'rule_based' | 'cached' | 'simplified' | 'manual';
  description: string;
  confidence: number;
  limitations: string[];
}

// API Response Interfaces
export interface AIActionResponse {
  success: boolean;
  data?: any;
  error?: AIError;
  metadata?: {
    requestId: string;
    processingTime: number;
    aiModel: string;
    confidence: number;
  };
}

// Utility Types
export type ActionFilter = Partial<AIAction> & {
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
};

export type ActionUpdate = Partial<AIAction> & {
  id: string;
};

export type ActionCreate = Omit<AIAction, 'id' | 'createdAt' | 'updatedAt'>;

export type ActionAnalytics = {
  totalActions: number;
  successRate: number;
  averageExecutionTime: number;
  mostEffectiveActionTypes: Array<{
    type: ActionType;
    successRate: number;
    averageImpact: number;
  }>;
  commonPatterns: Array<{
    pattern: string;
    frequency: number;
    recommendedActions: string[];
  }>;
  userSatisfaction: number;
  aiAccuracy: number;
};