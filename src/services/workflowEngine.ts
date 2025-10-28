import { 
  WorkflowAction, 
  WorkflowExecution, 
  WorkflowValidation, 
  WorkflowEngineConfig, 
  WorkflowStats, 
  WorkflowFilter,
  ActionType, 
  ActionStatus,
  Priority 
} from '../lib/workflowTypes';
import { EmailWorkflowService } from './emailWorkflow';
import { MeetingWorkflowService } from './meetingWorkflow';
import { TaskWorkflowService } from './taskWorkflow';
import { DocumentWorkflowService } from './documentWorkflow';

export class WorkflowEngine {
  private config: WorkflowEngineConfig;
  private executions: Map<string, WorkflowExecution> = new Map();
  private emailService: EmailWorkflowService;
  private meetingService: MeetingWorkflowService;
  private taskService: TaskWorkflowService;
  private documentService: DocumentWorkflowService;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: WorkflowEngineConfig) {
    this.config = config;
    this.emailService = new EmailWorkflowService(config.externalApis.email);
    this.meetingService = new MeetingWorkflowService(config.externalApis.calendar);
    this.taskService = new TaskWorkflowService(config.externalApis.tasks);
    this.documentService = new DocumentWorkflowService(config.externalApis.documents);
    
    // Start the scheduler
    this.startScheduler();
  }

  /**
   * Validate a workflow action before execution
   */
  public async validateAction(action: WorkflowAction): Promise<WorkflowValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (action.type) {
        case ActionType.EMAIL:
          const emailValidation = await this.emailService.validate(action);
          errors.push(...emailValidation.errors);
          warnings.push(...emailValidation.warnings);
          break;
          
        case ActionType.MEETING:
          const meetingValidation = await this.meetingService.validate(action);
          errors.push(...meetingValidation.errors);
          warnings.push(...meetingValidation.warnings);
          break;
          
        case ActionType.TASK:
          const taskValidation = await this.taskService.validate(action);
          errors.push(...taskValidation.errors);
          warnings.push(...taskValidation.warnings);
          break;
          
        case ActionType.DOCUMENT:
          const documentValidation = await this.documentService.validate(action);
          errors.push(...documentValidation.errors);
          warnings.push(...documentValidation.warnings);
          break;
          
        case ActionType.NOTIFICATION:
          // Basic validation for notifications
          if (!action.recipients || action.recipients.length === 0) {
            errors.push('Notification must have at least one recipient');
          }
          if (!action.title || action.title.trim() === '') {
            errors.push('Notification title is required');
          }
          if (!action.message || action.message.trim() === '') {
            errors.push('Notification message is required');
          }
          break;
          
        default:
          errors.push(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Execute a workflow action
   */
  public async executeAction(action: WorkflowAction, scheduledAt?: Date): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    
    // Create execution record
    const execution: WorkflowExecution = {
      id: executionId,
      action,
      status: ActionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      progress: 0
    };

    this.executions.set(executionId, execution);
    this.emit('execution:created', execution);

    // Validate action
    execution.status = ActionStatus.VALIDATING;
    this.emit('execution:updated', execution);
    
    const validation = await this.validateAction(action);
    if (!validation.isValid) {
      execution.status = ActionStatus.FAILED;
      execution.errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
      execution.updatedAt = new Date();
      this.emit('execution:failed', execution);
      return execution;
    }

    // Schedule or execute immediately
    if (scheduledAt && scheduledAt > new Date()) {
      execution.status = ActionStatus.SCHEDULED;
      this.scheduleExecution(executionId, scheduledAt);
    } else {
      await this.runExecution(executionId);
    }

    return execution;
  }

  /**
   * Get execution by ID
   */
  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions with optional filtering
   */
  public getExecutions(filter?: WorkflowFilter): WorkflowExecution[] {
    let executions = Array.from(this.executions.values());

    if (filter) {
      if (filter.type) {
        executions = executions.filter(e => e.action.type === filter.type);
      }
      if (filter.status) {
        executions = executions.filter(e => e.status === filter.status);
      }
      if (filter.priority) {
        executions = executions.filter(e => 
          'priority' in e.action && e.action.priority === filter.priority
        );
      }
      if (filter.dateRange) {
        executions = executions.filter(e => 
          e.createdAt >= filter.dateRange!.start && e.createdAt <= filter.dateRange!.end
        );
      }
      if (filter.assignee) {
        executions = executions.filter(e => 
          'assignee' in e.action && e.action.assignee === filter.assignee
        );
      }
      if (filter.project) {
        executions = executions.filter(e => 
          'project' in e.action && e.action.project === filter.project
        );
      }
    }

    return executions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get workflow statistics
   */
  public getStats(): WorkflowStats {
    const executions = Array.from(this.executions.values());
    const total = executions.length;
    const pending = executions.filter(e => e.status === ActionStatus.PENDING).length;
    const running = executions.filter(e => e.status === ActionStatus.RUNNING).length;
    const completed = executions.filter(e => e.status === ActionStatus.COMPLETED).length;
    const failed = executions.filter(e => e.status === ActionStatus.FAILED).length;
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    
    const completedExecutions = executions.filter(e => e.status === ActionStatus.COMPLETED);
    const averageExecutionTime = completedExecutions.length > 0 
      ? completedExecutions.reduce((sum, e) => {
          const duration = e.completedAt!.getTime() - e.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    return {
      total,
      pending,
      running,
      completed,
      failed,
      successRate,
      averageExecutionTime
    };
  }

  /**
   * Cancel an execution
   */
  public cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    if (execution.status === ActionStatus.PENDING || execution.status === ActionStatus.SCHEDULED) {
      execution.status = ActionStatus.CANCELLED;
      execution.updatedAt = new Date();
      
      // Cancel scheduled job if exists
      const scheduledJob = this.scheduledJobs.get(executionId);
      if (scheduledJob) {
        clearTimeout(scheduledJob);
        this.scheduledJobs.delete(executionId);
      }
      
      this.emit('execution:cancelled', execution);
      return true;
    }

    return false;
  }

  /**
   * Retry a failed execution
   */
  public async retryExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== ActionStatus.FAILED) return false;

    if (execution.retryCount >= execution.maxRetries) return false;

    execution.status = ActionStatus.RETRYING;
    execution.retryCount++;
    execution.errorMessage = undefined;
    execution.updatedAt = new Date();
    this.emit('execution:updated', execution);

    await this.runExecution(executionId);
    return true;
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Run execution
   */
  private async runExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = ActionStatus.RUNNING;
    execution.startedAt = new Date();
    execution.updatedAt = new Date();
    execution.progress = 0;
    this.emit('execution:started', execution);

    try {
      let result: any;

      switch (execution.action.type) {
        case ActionType.EMAIL:
          result = await this.emailService.execute(execution.action, (progress) => {
            execution.progress = progress;
            this.emit('execution:progress', execution);
          });
          break;
          
        case ActionType.MEETING:
          result = await this.meetingService.execute(execution.action, (progress) => {
            execution.progress = progress;
            this.emit('execution:progress', execution);
          });
          break;
          
        case ActionType.TASK:
          result = await this.taskService.execute(execution.action, (progress) => {
            execution.progress = progress;
            this.emit('execution:progress', execution);
          });
          break;
          
        case ActionType.DOCUMENT:
          result = await this.documentService.execute(execution.action, (progress) => {
            execution.progress = progress;
            this.emit('execution:progress', execution);
          });
          break;
          
        case ActionType.NOTIFICATION:
          result = await this.executeNotification(execution.action, (progress) => {
            execution.progress = progress;
            this.emit('execution:progress', execution);
          });
          break;
          
        default:
          throw new Error(`Unknown action type: ${execution.action.type}`);
      }

      execution.status = ActionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.progress = 100;
      execution.result = result;
      execution.updatedAt = new Date();
      this.emit('execution:completed', execution);

    } catch (error) {
      execution.status = ActionStatus.FAILED;
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.updatedAt = new Date();
      this.emit('execution:failed', execution);

      // Auto-retry if configured
      if (execution.retryCount < execution.maxRetries) {
        setTimeout(() => {
          this.retryExecution(executionId);
        }, this.config.retryDelay);
      }
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotification(action: any, progressCallback?: (progress: number) => void): Promise<any> {
    progressCallback?.(10);
    
    // Simulate notification execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    progressCallback?.(50);
    
    // Here you would integrate with actual notification services
    const result = {
      sent: true,
      recipients: action.recipients.length,
      channels: action.channels,
      timestamp: new Date()
    };
    
    progressCallback?.(100);
    return result;
  }

  /**
   * Schedule execution for later
   */
  private scheduleExecution(executionId: string, scheduledAt: Date): void {
    const delay = scheduledAt.getTime() - Date.now();
    const timeoutId = setTimeout(async () => {
      await this.runExecution(executionId);
      this.scheduledJobs.delete(executionId);
    }, delay);
    
    this.scheduledJobs.set(executionId, timeoutId);
  }

  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    // Check for scheduled executions every minute
    setInterval(() => {
      this.checkScheduledExecutions();
    }, 60000);
  }

  /**
   * Check and run scheduled executions
   */
  private checkScheduledExecutions(): void {
    const now = new Date();
    this.executions.forEach((execution, id) => {
      if (execution.status === ActionStatus.SCHEDULED && 
          execution.scheduledAt && 
          execution.scheduledAt <= now) {
        this.runExecution(id);
      }
    });
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old executions
   */
  public cleanup(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.executions.forEach((execution, id) => {
      if (execution.createdAt < cutoffDate && 
          (execution.status === ActionStatus.COMPLETED || execution.status === ActionStatus.FAILED)) {
        this.executions.delete(id);
      }
    });
  }

  /**
   * Shutdown the workflow engine
   */
  public shutdown(): void {
    // Clear all scheduled jobs
    this.scheduledJobs.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledJobs.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
  }
}