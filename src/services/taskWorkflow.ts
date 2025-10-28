import { TaskAction, WorkflowValidation, ActionType, Priority } from '../lib/workflowTypes';

export interface TaskConfig {
  provider: 'jira' | 'asana' | 'trello' | 'clickup';
  config: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  externalId?: string;
  status: 'created' | 'updated' | 'completed' | 'deleted';
  title: string;
  assignee: string;
  project?: string;
  priority: Priority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: Date;
  isInternal?: boolean;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  user: string;
  hours: number;
  description?: string;
  date: Date;
}

export class TaskWorkflowService {
  private config: TaskConfig;

  constructor(config: TaskConfig) {
    this.config = config;
  }

  /**
   * Validate task action
   */
  public async validate(action: TaskAction): Promise<WorkflowValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    if (!action.title || action.title.trim() === '') {
      errors.push('Task title is required');
    }

    // Validate assignee
    if (!action.assignee || action.assignee.trim() === '') {
      errors.push('Task assignee is required');
    } else if (!this.isValidEmail(action.assignee) && !this.isValidUserId(action.assignee)) {
      warnings.push('Assignee should be a valid email or user ID');
    }

    // Validate due date
    if (action.dueDate && action.dueDate <= new Date()) {
      warnings.push('Task due date is in the past');
    }

    // Validate priority
    if (!Object.values(Priority).includes(action.priority)) {
      errors.push(`Invalid priority: ${action.priority}`);
    }

    // Validate subtasks
    if (action.subtasks) {
      action.subtasks.forEach((subtask, index) => {
        if (!subtask.title || subtask.title.trim() === '') {
          errors.push(`Subtask ${index + 1} title is required`);
        }
      });
    }

    // Validate dependencies
    if (action.dependencies && action.dependencies.length > 10) {
      warnings.push('Task has more than 10 dependencies, which may impact completion time');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Execute task action
   */
  public async execute(
    action: TaskAction, 
    progressCallback?: (progress: number) => void
  ): Promise<TaskResult> {
    progressCallback?.(10);

    try {
      // Create task in external system
      const taskResult = await this.createTask(action);
      progressCallback?.(40);

      // Create subtasks if any
      if (action.subtasks && action.subtasks.length > 0) {
        await this.createSubtasks(taskResult.taskId, action.subtasks);
      }
      progressCallback?.(60);

      // Set up dependencies if any
      if (action.dependencies && action.dependencies.length > 0) {
        await this.setupDependencies(taskResult.taskId, action.dependencies);
      }
      progressCallback?.(80);

      // Send notification to assignee
      await this.notifyAssignee(action, taskResult);
      progressCallback?.(100);

      return taskResult;

    } catch (error) {
      throw new Error(`Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create task in external system
   */
  private async createTask(action: TaskAction): Promise<TaskResult> {
    const taskId = this.generateTaskId();

    switch (this.config.provider) {
      case 'jira':
        return await this.createJiraTask(action, taskId);
      case 'asana':
        return await this.createAsanaTask(action, taskId);
      case 'trello':
        return await this.createTrelloTask(action, taskId);
      case 'clickup':
        return await this.createClickupTask(action, taskId);
      default:
        throw new Error(`Unsupported task provider: ${this.config.provider}`);
    }
  }

  /**
   * Create task in Jira
   */
  private async createJiraTask(action: TaskAction, taskId: string): Promise<TaskResult> {
    // Simulate Jira API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const externalId = `JIRA-${Math.floor(Math.random() * 10000)}`;

    return {
      taskId,
      externalId,
      status: 'created',
      title: action.title,
      assignee: action.assignee,
      project: action.project,
      priority: action.priority,
      dueDate: action.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: `https://company.atlassian.net/browse/${externalId}`
    };
  }

  /**
   * Create task in Asana
   */
  private async createAsanaTask(action: TaskAction, taskId: string): Promise<TaskResult> {
    // Simulate Asana API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const externalId = Math.floor(Math.random() * 1000000000).toString();

    return {
      taskId,
      externalId,
      status: 'created',
      title: action.title,
      assignee: action.assignee,
      project: action.project,
      priority: action.priority,
      dueDate: action.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: `https://app.asana.com/0/0/${externalId}`
    };
  }

  /**
   * Create task in Trello
   */
  private async createTrelloTask(action: TaskAction, taskId: string): Promise<TaskResult> {
    // Simulate Trello API call
    await new Promise(resolve => setTimeout(resolve, 600));

    const externalId = Math.random().toString(36).substr(2, 9);

    return {
      taskId,
      externalId,
      status: 'created',
      title: action.title,
      assignee: action.assignee,
      project: action.project,
      priority: action.priority,
      dueDate: action.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: `https://trello.com/c/${externalId}`
    };
  }

  /**
   * Create task in ClickUp
   */
  private async createClickupTask(action: TaskAction, taskId: string): Promise<TaskResult> {
    // Simulate ClickUp API call
    await new Promise(resolve => setTimeout(resolve, 700));

    const externalId = Math.floor(Math.random() * 1000000000).toString();

    return {
      taskId,
      externalId,
      status: 'created',
      title: action.title,
      assignee: action.assignee,
      project: action.project,
      priority: action.priority,
      dueDate: action.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: `https://app.clickup.com/t/${externalId}`
    };
  }

  /**
   * Create subtasks
   */
  private async createSubtasks(parentTaskId: string, subtasks: any[]): Promise<void> {
    // Simulate subtask creation
    for (const subtask of subtasks) {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log(`Created subtask: ${subtask.title} for parent task: ${parentTaskId}`);
    }
  }

  /**
   * Setup task dependencies
   */
  private async setupDependencies(taskId: string, dependencies: string[]): Promise<void> {
    // Simulate dependency setup
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Setup dependencies for task ${taskId}:`, dependencies);
  }

  /**
   * Notify assignee
   */
  private async notifyAssignee(action: TaskAction, taskResult: TaskResult): Promise<void> {
    // Simulate notification
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Notified assignee ${action.assignee} about task ${taskResult.title}`);
  }

  /**
   * Update task
   */
  public async updateTask(taskId: string, updates: Partial<TaskAction>): Promise<TaskResult> {
    // Simulate task update
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      taskId,
      status: 'updated',
      title: updates.title || 'Updated Task',
      assignee: updates.assignee || 'unassigned@example.com',
      project: updates.project,
      priority: updates.priority || Priority.MEDIUM,
      dueDate: updates.dueDate,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      updatedAt: new Date(),
      url: `https://example.com/task/${taskId}`
    };
  }

  /**
   * Complete task
   */
  public async completeTask(taskId: string, completionNotes?: string): Promise<TaskResult> {
    // Simulate task completion
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`Completed task ${taskId}${completionNotes ? ` with notes: ${completionNotes}` : ''}`);

    return {
      taskId,
      status: 'completed',
      title: 'Completed Task',
      assignee: 'user@example.com',
      priority: Priority.MEDIUM,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
      updatedAt: new Date(),
      url: `https://example.com/task/${taskId}`
    };
  }

  /**
   * Delete task
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    // Simulate task deletion
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log(`Deleted task ${taskId}`);
    return true;
  }

  /**
   * Add comment to task
   */
  public async addComment(taskId: string, content: string, author: string, isInternal: boolean = false): Promise<TaskComment> {
    // Simulate comment addition
    await new Promise(resolve => setTimeout(resolve, 300));

    const comment: TaskComment = {
      id: this.generateCommentId(),
      taskId,
      author,
      content,
      createdAt: new Date(),
      isInternal
    };

    console.log(`Added comment to task ${taskId}:`, comment);
    return comment;
  }

  /**
   * Get task comments
   */
  public async getTaskComments(taskId: string): Promise<TaskComment[]> {
    // Simulate comment retrieval
    return [
      {
        id: this.generateCommentId(),
        taskId,
        author: 'user1@example.com',
        content: 'Working on this task now',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: this.generateCommentId(),
        taskId,
        author: 'user2@example.com',
        content: 'Please review when complete',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isInternal: true
      }
    ];
  }

  /**
   * Log time entry
   */
  public async logTime(taskId: string, user: string, hours: number, description?: string): Promise<TaskTimeEntry> {
    // Simulate time logging
    await new Promise(resolve => setTimeout(resolve, 200));

    const timeEntry: TaskTimeEntry = {
      id: this.generateTimeEntryId(),
      taskId,
      user,
      hours,
      description,
      date: new Date()
    };

    console.log(`Logged time for task ${taskId}:`, timeEntry);
    return timeEntry;
  }

  /**
   * Get time entries for task
   */
  public async getTimeEntries(taskId: string): Promise<TaskTimeEntry[]> {
    // Simulate time entry retrieval
    return [
      {
        id: this.generateTimeEntryId(),
        taskId,
        user: 'user1@example.com',
        hours: 2.5,
        description: 'Initial development',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: this.generateTimeEntryId(),
        taskId,
        user: 'user1@example.com',
        hours: 1.5,
        description: 'Bug fixes',
        date: new Date()
      }
    ];
  }

  /**
   * Get task status
   */
  public async getTaskStatus(taskId: string): Promise<{
    taskId: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    progress: number; // 0-100
    assignee: string;
    dueDate?: Date;
    timeSpent: number; // hours
    timeEstimated?: number; // hours
  }> {
    // Simulate status retrieval
    return {
      taskId,
      status: 'in-progress',
      progress: 65,
      assignee: 'user1@example.com',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      timeSpent: 4.0,
      timeEstimated: 6.0
    };
  }

  /**
   * Get task analytics
   */
  public async getTaskAnalytics(projectId?: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageCompletionTime: number; // days
    tasksByPriority: Record<Priority, number>;
    tasksByAssignee: Record<string, number>;
  }> {
    // Simulate analytics retrieval
    return {
      totalTasks: 45,
      completedTasks: 32,
      overdueTasks: 3,
      averageCompletionTime: 5.2,
      tasksByPriority: {
        [Priority.LOW]: 8,
        [Priority.MEDIUM]: 25,
        [Priority.HIGH]: 10,
        [Priority.URGENT]: 2
      },
      tasksByAssignee: {
        'user1@example.com': 15,
        'user2@example.com': 12,
        'user3@example.com': 18
      }
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate user ID format
   */
  private isValidUserId(userId: string): boolean {
    // Simple validation for user ID format
    return /^[a-zA-Z0-9_-]+$/.test(userId);
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique comment ID
   */
  private generateCommentId(): string {
    return `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique time entry ID
   */
  private generateTimeEntryId(): string {
    return `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get task templates
   */
  public async getTaskTemplates(): Promise<{
    id: string;
    name: string;
    description: string;
    template: Partial<TaskAction>;
  }[]> {
    return [
      {
        id: 'bug-fix',
        name: 'Bug Fix',
        description: 'Template for bug fix tasks',
        template: {
          title: 'Fix: {{bugTitle}}',
          description: 'Fix the reported bug: {{bugDescription}}',
          priority: Priority.HIGH,
          tags: ['bug', 'fix']
        }
      },
      {
        id: 'feature-development',
        name: 'Feature Development',
        description: 'Template for new feature development',
        template: {
          title: 'Feature: {{featureName}}',
          description: 'Implement the new feature: {{featureDescription}}',
          priority: Priority.MEDIUM,
          tags: ['feature', 'development']
        }
      },
      {
        id: 'code-review',
        name: 'Code Review',
        description: 'Template for code review tasks',
        template: {
          title: 'Review: {{pullRequestTitle}}',
          description: 'Review pull request: {{pullRequestUrl}}',
          priority: Priority.MEDIUM,
          tags: ['review', 'quality']
        }
      }
    ];
  }
}