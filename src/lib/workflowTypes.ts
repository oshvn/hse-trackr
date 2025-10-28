export enum ActionType {
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  DOCUMENT = 'document',
  NOTIFICATION = 'notification'
}

export enum ActionStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface EmailAction {
  type: ActionType.EMAIL;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
  attachments?: string[];
  scheduleAt?: Date;
  followUp?: {
    enabled: boolean;
    delay: number; // hours
    template: string;
  };
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface MeetingAction {
  type: ActionType.MEETING;
  title: string;
  description?: string;
  attendees: string[];
  startTime: Date;
  endTime: Date;
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  reminders: {
    enabled: boolean;
    times: number[]; // minutes before meeting
  };
  createMaterials?: boolean;
  materials?: {
    agenda?: string;
    documents?: string[];
  };
}

export interface TaskAction {
  type: ActionType.TASK;
  title: string;
  description?: string;
  assignee: string;
  assigneeEmail?: string;
  dueDate?: Date;
  priority: Priority;
  project?: string;
  tags?: string[];
  dependencies?: string[];
  subtasks?: {
    title: string;
    completed: boolean;
  }[];
}

export interface DocumentAction {
  type: ActionType.DOCUMENT;
  documentId: string;
  action: 'create' | 'update' | 'review' | 'approve' | 'archive';
  version?: string;
  reviewers?: string[];
  approvers?: string[];
  dueDate?: Date;
  priority: Priority;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  type: ActionType.NOTIFICATION;
  recipients: string[];
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'push' | 'in-app')[];
  priority: Priority;
  scheduleAt?: Date;
}

export type WorkflowAction = EmailAction | MeetingAction | TaskAction | DocumentAction | NotificationAction;

export interface WorkflowExecution {
  id: string;
  action: WorkflowAction;
  status: ActionStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  progress: number; // 0-100
  result?: any;
  metadata?: Record<string, any>;
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowEngineConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  enableLogging: boolean;
  enableNotifications: boolean;
  externalApis: {
    email: {
      provider: 'smtp' | 'sendgrid' | 'aws-ses';
      config: Record<string, any>;
    };
    calendar: {
      provider: 'google' | 'outlook';
      config: Record<string, any>;
    };
    tasks: {
      provider: 'jira' | 'asana' | 'trello' | 'clickup';
      config: Record<string, any>;
    };
    documents: {
      provider: 'sharepoint' | 'google-drive' | 'dropbox';
      config: Record<string, any>;
    };
  };
}

export interface WorkflowStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface WorkflowFilter {
  type?: ActionType;
  status?: ActionStatus;
  priority?: Priority;
  dateRange?: {
    start: Date;
    end: Date;
  };
  assignee?: string;
  project?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  actions: WorkflowAction[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  tags: string[];
}

export interface WorkflowSchedule {
  id: string;
  name: string;
  templateId: string;
  cronExpression: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  timezone: string;
  parameters?: Record<string, any>;
}

export interface WorkflowNotification {
  id: string;
  executionId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}