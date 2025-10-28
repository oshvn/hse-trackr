import { supabase } from '@/lib/supabase';
import type {
  AIAction,
  MeetingAction,
  EmailAction,
  SupportAction,
  EscalationAction,
  TrainingAction,
  ActionExecutionResult,
  BatchExecutionRequest,
  BatchExecutionResult,
  ExecutionMetrics,
  ActionFeedback,
  CalendarIntegration,
  EmailIntegration,
  TaskManagementIntegration,
  AIError,
  FallbackStrategy,
  ImpactAssessment
} from '@/lib/aiTypes';

class AIActionExecutor {
  private calendarIntegration: CalendarIntegration | null = null;
  private emailIntegration: EmailIntegration | null = null;
  private taskIntegration: TaskManagementIntegration | null = null;

  constructor() {
    this.loadIntegrations();
  }

  /**
   * Tải các cấu hình tích hợp từ localStorage
   */
  private loadIntegrations(): void {
    try {
      const calendarConfig = localStorage.getItem('calendar_integration');
      if (calendarConfig) {
        this.calendarIntegration = JSON.parse(calendarConfig);
      }

      const emailConfig = localStorage.getItem('email_integration');
      if (emailConfig) {
        this.emailIntegration = JSON.parse(emailConfig);
      }

      const taskConfig = localStorage.getItem('task_integration');
      if (taskConfig) {
        this.taskIntegration = JSON.parse(taskConfig);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  }

  /**
   * Thực thi một hành động đơn lẻ
   */
  async executeAction(action: AIAction): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      let success = false;

      switch (action.type) {
        case 'meeting':
          result = await this.executeMeetingAction(action as MeetingAction);
          success = true;
          break;
        case 'email':
          result = await this.executeEmailAction(action as EmailAction);
          success = true;
          break;
        case 'support':
          result = await this.executeSupportAction(action as SupportAction);
          success = true;
          break;
        case 'escalation':
          result = await this.executeEscalationAction(action as EscalationAction);
          success = true;
          break;
        case 'training':
          result = await this.executeTrainingAction(action as TrainingAction);
          success = true;
          break;
        case 'audit':
          result = await this.executeAuditAction(action);
          success = true;
          break;
        case 'review':
          result = await this.executeReviewAction(action);
          success = true;
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      const executionTime = Date.now() - startTime;
      
      // Cập nhật trạng thái action
      await this.updateActionStatus(action.id, 'completed', result);

      // Ghi lại kết quả thực thi
      const metrics = await this.calculateExecutionMetrics(action, executionTime, success);
      
      return {
        actionId: action.id,
        success,
        executedAt: new Date(),
        executionTime,
        result,
        metrics
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Cập nhật trạng thái thất bại
      await this.updateActionStatus(action.id, 'failed', null, error.message);
      
      const metrics = await this.calculateExecutionMetrics(action, executionTime, false);
      
      return {
        actionId: action.id,
        success: false,
        executedAt: new Date(),
        executionTime,
        result: null,
        error: error.message,
        metrics
      };
    }
  }

  /**
   * Thực thi hàng loạt hành động
   */
  async executeBatch(request: BatchExecutionRequest): Promise<BatchExecutionResult> {
    const startTime = new Date();
    const results: ActionExecutionResult[] = [];
    
    if (request.executionMode === 'sequential') {
      // Thực thi tuần tự
      for (const actionId of request.actionIds) {
        const action = await this.getActionById(actionId);
        if (!action) {
          results.push({
            actionId,
            success: false,
            executedAt: new Date(),
            executionTime: 0,
            result: null,
            error: 'Action not found',
            metrics: {
              timeToExecute: 0,
              resourcesUsed: [],
              actualImpact: {
                projectImpact: 'low' as const,
                timelineImpact: 0,
                costImpact: 0,
                qualityImpact: 'low' as const,
                safetyImpact: 'low' as const
              },
              lessonsLearned: []
            }
          });
          
          if (request.failureMode === 'stop_on_first') {
            break;
          }
          continue;
        }

        const result = await this.executeAction(action);
        results.push(result);
        
        if (!result.success && request.failureMode === 'stop_on_first') {
          break;
        }
      }
    } else {
      // Thực thi song song
      const promises = request.actionIds.map(async (actionId) => {
        const action = await this.getActionById(actionId);
        if (!action) {
          return {
            actionId,
            success: false,
            executedAt: new Date(),
            executionTime: 0,
            result: null,
            error: 'Action not found',
            metrics: {
              timeToExecute: 0,
              resourcesUsed: [],
              actualImpact: {
                projectImpact: 'low' as const,
                timelineImpact: 0,
                costImpact: 0,
                qualityImpact: 'low' as const,
                safetyImpact: 'low' as const
              },
              lessonsLearned: []
            }
          };
        }
        return this.executeAction(action);
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const endTime = new Date();
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      batchId: `batch-${Date.now()}`,
      totalActions: results.length,
      successful,
      failed,
      results,
      startTime,
      endTime,
      totalDuration: endTime.getTime() - startTime.getTime()
    };
  }

  /**
   * Thực thi hành động cuộc họp
   */
  private async executeMeetingAction(action: MeetingAction): Promise<any> {
    const { meetingDetails } = action;
    
    // Tích hợp với calendar nếu có
    if (this.calendarIntegration?.enabled) {
      return await this.scheduleMeeting(action);
    }
    
    // Fallback: tạo thông báo cuộc họp
    return {
      type: 'meeting_scheduled',
      title: action.title,
      description: action.description,
      attendees: action.attendees || [],
      duration: meetingDetails.duration,
      agenda: meetingDetails.agenda,
      location: meetingDetails.location,
      virtual: meetingDetails.virtual,
      scheduledFor: action.timeline.startDate
    };
  }

  /**
   * Thực thi hành động email
   */
  private async executeEmailAction(action: EmailAction): Promise<any> {
    const { emailDetails } = action;
    
    // Tích hợp với email service nếu có
    if (this.emailIntegration?.enabled) {
      return await this.sendEmail(action);
    }
    
    // Fallback: tạo email draft
    return {
      type: 'email_created',
      subject: emailDetails.subject,
      recipients: emailDetails.recipients,
      cc: emailDetails.cc,
      template: emailDetails.template,
      attachments: emailDetails.attachments,
      trackingEnabled: emailDetails.trackingEnabled,
      followUpRequired: emailDetails.followUpRequired,
      status: 'draft'
    };
  }

  /**
   * Thực thi hành động hỗ trợ
   */
  private async executeSupportAction(action: SupportAction): Promise<any> {
    const { supportDetails } = action;
    
    // Tạo task trong hệ thống quản lý task nếu có
    if (this.taskIntegration?.enabled) {
      return await this.createSupportTask(action);
    }
    
    // Fallback: tạo thông báo hỗ trợ
    return {
      type: 'support_assigned',
      supportType: supportDetails.supportType,
      supportLevel: supportDetails.supportLevel,
      duration: supportDetails.duration,
      resources: supportDetails.resources,
      mentor: supportDetails.mentor,
      assignee: action.assignee,
      relatedDocuments: action.relatedDocuments,
      status: 'assigned'
    };
  }

  /**
   * Thực thi hành động escalation
   */
  private async executeEscalationAction(action: EscalationAction): Promise<any> {
    const { escalationDetails } = action;
    
    // Gửi notification và tạo task khẩn cấp
    if (this.taskIntegration?.enabled) {
      return await this.createEscalationTask(action);
    }
    
    // Fallback: tạo thông báo escalation
    return {
      type: 'escalation_initiated',
      escalationLevel: escalationDetails.escalationLevel,
      reason: escalationDetails.reason,
      previousActions: escalationDetails.previousActions,
      expectedResolution: escalationDetails.expectedResolution,
      urgency: escalationDetails.urgency,
      escalatedTo: this.getEscalationRecipients(escalationDetails.escalationLevel),
      status: 'escalated'
    };
  }

  /**
   * Thực thi hành động đào tạo
   */
  private async executeTrainingAction(action: TrainingAction): Promise<any> {
    const { trainingDetails } = action;
    
    // Tạo training session trong calendar/task system
    if (this.calendarIntegration?.enabled) {
      return await this.scheduleTraining(action);
    }
    
    // Fallback: tạo thông báo đào tạo
    return {
      type: 'training_scheduled',
      trainingType: trainingDetails.trainingType,
      targetAudience: trainingDetails.targetAudience,
      duration: trainingDetails.duration,
      materials: trainingDetails.materials,
      trainer: trainingDetails.trainer,
      assessmentRequired: trainingDetails.assessmentRequired,
      scheduledFor: action.timeline.startDate,
      status: 'scheduled'
    };
  }

  /**
   * Thực thi hành động audit
   */
  private async executeAuditAction(action: AIAction): Promise<any> {
    return {
      type: 'audit_initiated',
      title: action.title,
      description: action.description,
      relatedDocuments: action.relatedDocuments,
      relatedContractors: action.relatedContractors,
      assignee: action.assignee,
      scheduledFor: action.timeline.startDate,
      status: 'initiated'
    };
  }

  /**
   * Thực thi hành động review
   */
  private async executeReviewAction(action: AIAction): Promise<any> {
    return {
      type: 'review_scheduled',
      title: action.title,
      description: action.description,
      relatedDocuments: action.relatedDocuments,
      relatedContractors: action.relatedContractors,
      assignee: action.assignee,
      scheduledFor: action.timeline.startDate,
      status: 'scheduled'
    };
  }

  /**
   * Lên lịch cuộc họp qua calendar integration
   */
  private async scheduleMeeting(action: MeetingAction): Promise<any> {
    // Implementation would depend on the calendar provider
    // This is a placeholder for the actual integration
    return {
      type: 'meeting_scheduled',
      provider: this.calendarIntegration?.provider,
      calendarId: this.calendarIntegration?.defaultCalendar,
      meetingId: `meeting-${action.id}`,
      scheduledFor: action.timeline.startDate,
      attendees: action.attendees,
      meetingUrl: action.meetingDetails.virtual ? 'https://meet.example.com/' + action.id : null
    };
  }

  /**
   * Gửi email qua email integration
   */
  private async sendEmail(action: EmailAction): Promise<any> {
    // Implementation would depend on the email provider
    // This is a placeholder for the actual integration
    return {
      type: 'email_sent',
      provider: this.emailIntegration?.provider,
      messageId: `msg-${action.id}`,
      sentAt: new Date(),
      recipients: action.emailDetails.recipients,
      trackingId: action.emailDetails.trackingEnabled ? `track-${action.id}` : null
    };
  }

  /**
   * Tạo support task qua task management integration
   */
  private async createSupportTask(action: SupportAction): Promise<any> {
    // Implementation would depend on the task management provider
    // This is a placeholder for the actual integration
    return {
      type: 'support_task_created',
      provider: this.taskIntegration?.provider,
      taskId: `task-${action.id}`,
      projectId: this.taskIntegration?.defaultProject,
      assignee: action.assignee,
      status: 'assigned'
    };
  }

  /**
   * Tạo escalation task qua task management integration
   */
  private async createEscalationTask(action: EscalationAction): Promise<any> {
    // Implementation would depend on the task management provider
    // This is a placeholder for the actual integration
    return {
      type: 'escalation_task_created',
      provider: this.taskIntegration?.provider,
      taskId: `escalation-${action.id}`,
      projectId: this.taskIntegration?.defaultProject,
      priority: 'critical',
      assignee: this.getEscalationRecipients(action.escalationDetails.escalationLevel),
      status: 'escalated'
    };
  }

  /**
   * Lên lịch training qua calendar integration
   */
  private async scheduleTraining(action: TrainingAction): Promise<any> {
    // Implementation would depend on the calendar provider
    // This is a placeholder for the actual integration
    return {
      type: 'training_scheduled',
      provider: this.calendarIntegration?.provider,
      calendarId: this.calendarIntegration?.defaultCalendar,
      eventId: `training-${action.id}`,
      scheduledFor: action.timeline.startDate,
      attendees: action.trainingDetails.targetAudience,
      duration: action.trainingDetails.duration
    };
  }

  /**
   * Lấy danh sách người nhận escalation
   */
  private getEscalationRecipients(level: string): string[] {
    // This would typically come from a configuration or database
    const escalationMap = {
      'project_manager': ['pm@example.com'],
      'department_head': ['head@example.com'],
      'executive': ['ceo@example.com', 'coo@example.com'],
      'client': ['client@example.com']
    };
    
    return escalationMap[level] || [];
  }

  /**
   * Cập nhật trạng thái action trong database
   */
  private async updateActionStatus(
    actionId: string,
    status: AIAction['status'],
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      // For now, store in localStorage as a fallback
      // In production, this would be stored in the database
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      const actionIndex = actions.findIndex((a: any) => a.id === actionId);
      
      if (actionIndex !== -1) {
        actions[actionIndex].status = status;
        actions[actionIndex].updated_at = new Date().toISOString();
        
        if (status === 'completed') {
          actions[actionIndex].completed_at = new Date().toISOString();
          actions[actionIndex].result = result;
        } else if (status === 'failed') {
          actions[actionIndex].error = error;
        }
        
        localStorage.setItem('ai_actions', JSON.stringify(actions));
      }
    } catch (error) {
      console.error('Error in updateActionStatus:', error);
    }
  }

  /**
   * Lấy action theo ID
   */
  private async getActionById(actionId: string): Promise<AIAction | null> {
    try {
      // For now, get from localStorage as a fallback
      // In production, this would be fetched from the database
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      const action = actions.find((a: any) => a.id === actionId);
      
      if (!action) {
        console.error('Action not found:', actionId);
        return null;
      }

      return action as AIAction;
    } catch (error) {
      console.error('Error in getActionById:', error);
      return null;
    }
  }

  /**
   * Tính toán metrics thực thi
   */
  private async calculateExecutionMetrics(
    action: AIAction, 
    executionTime: number, 
    success: boolean
  ): Promise<ExecutionMetrics> {
    // This would typically involve more complex calculations
    // based on historical data and actual impact measurements
    
    return {
      timeToExecute: executionTime,
      resourcesUsed: [action.assignee || 'unassigned'],
      actualImpact: {
        projectImpact: success ? action.impactAssessment.projectImpact : 'low',
        timelineImpact: success ? action.impactAssessment.timelineImpact : 0,
        costImpact: success ? action.impactAssessment.costImpact : 0,
        qualityImpact: success ? action.impactAssessment.qualityImpact : 'low',
        safetyImpact: success ? action.impactAssessment.safetyImpact : 'low'
      },
      lessonsLearned: success ? [
        `Action type ${action.type} executed successfully`,
        `Priority level ${action.priority.level} handled appropriately`
      ] : [
        `Action type ${action.type} execution failed`,
        'Review execution parameters and resources'
      ]
    };
  }

  /**
   * Gửi feedback cho action đã thực thi
   */
  async submitFeedback(actionId: string, feedback: ActionFeedback): Promise<boolean> {
    try {
      // For now, store in localStorage as a fallback
      // In production, this would be stored in the database
      const feedbacks = JSON.parse(localStorage.getItem('action_feedbacks') || '[]');
      feedbacks.push({
        action_id: actionId,
        rating: feedback.rating,
        effectiveness: feedback.effectiveness,
        comments: feedback.comments,
        would_recommend: feedback.wouldRecommend,
        actual_time_spent: feedback.actualTimeSpent,
        actual_impact: feedback.actualImpact,
        suggestions: feedback.suggestions,
        created_at: new Date().toISOString()
      });
      
      localStorage.setItem('action_feedbacks', JSON.stringify(feedbacks));

      // Cập nhật action với feedback
      await this.updateActionStatus(actionId, 'completed', null, null);
      
      // Trigger AI learning system
      await this.triggerLearningUpdate(actionId, feedback);
      
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  /**
   * Kích hoạt cập nhật AI learning system
   */
  private async triggerLearningUpdate(actionId: string, feedback: ActionFeedback): Promise<void> {
    try {
      // This would typically call an AI service to update the learning model
      // For now, we'll just log the feedback
      console.log('Learning update triggered for action:', actionId, feedback);
      
      // In a real implementation, this would:
      // 1. Analyze the feedback
      // 2. Update success probabilities
      // 3. Adjust action recommendations
      // 4. Improve pattern recognition
    } catch (error) {
      console.error('Error triggering learning update:', error);
    }
  }

  /**
   * Lấy lịch sử thực thi của một action
   */
  async getActionHistory(actionId: string): Promise<ActionExecutionResult[]> {
    try {
      // For now, get from localStorage as a fallback
      // In production, this would be fetched from the database
      const history = JSON.parse(localStorage.getItem('action_execution_history') || '[]');
      const actionHistory = history.filter((h: any) => h.action_id === actionId);
      
      return actionHistory as ActionExecutionResult[];
    } catch (error) {
      console.error('Error in getActionHistory:', error);
      return [];
    }
  }

  /**
   * Hủy một action đang chờ thực thi
   */
  async cancelAction(actionId: string, reason?: string): Promise<boolean> {
    try {
      // For now, update in localStorage as a fallback
      // In production, this would be updated in the database
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      const actionIndex = actions.findIndex((a: any) => a.id === actionId);
      
      if (actionIndex !== -1) {
        actions[actionIndex].status = 'cancelled';
        actions[actionIndex].updated_at = new Date().toISOString();
        actions[actionIndex].cancellation_reason = reason;
        
        localStorage.setItem('ai_actions', JSON.stringify(actions));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in cancelAction:', error);
      return false;
    }
  }

  /**
   * Tạm dừng một action đang thực thi
   */
  async pauseAction(actionId: string, reason?: string): Promise<boolean> {
    try {
      // For now, update in localStorage as a fallback
      // In production, this would be updated in the database
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      const actionIndex = actions.findIndex((a: any) => a.id === actionId);
      
      if (actionIndex !== -1) {
        actions[actionIndex].status = 'in_progress';
        actions[actionIndex].updated_at = new Date().toISOString();
        actions[actionIndex].pause_reason = reason;
        
        localStorage.setItem('ai_actions', JSON.stringify(actions));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in pauseAction:', error);
      return false;
    }
  }

  /**
   * Tiếp tục một action đã tạm dừng
   */
  async resumeAction(actionId: string): Promise<boolean> {
    try {
      // For now, update in localStorage as a fallback
      // In production, this would be updated in the database
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      const actionIndex = actions.findIndex((a: any) => a.id === actionId);
      
      if (actionIndex !== -1) {
        actions[actionIndex].status = 'in_progress';
        actions[actionIndex].updated_at = new Date().toISOString();
        actions[actionIndex].pause_reason = null;
        
        localStorage.setItem('ai_actions', JSON.stringify(actions));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in resumeAction:', error);
      return false;
    }
  }
}

export const aiActionExecutor = new AIActionExecutor();