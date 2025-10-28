import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiActionExecutor } from '../aiActionExecutor';
import type { 
  AIAction, 
  MeetingAction, 
  EmailAction, 
  SupportAction, 
  EscalationAction, 
  TrainingAction,
  ActionExecutionResult,
  BatchExecutionRequest,
  BatchExecutionResult
} from '@/lib/aiTypes';

// Mock data for testing
const mockMeetingAction: MeetingAction = {
  id: 'action-1',
  title: 'Họp với nhà thầu',
  description: 'Tổ chức họp khẩn cấp với nhà thầu về các vấn đề hồ sơ',
  type: 'meeting',
  priority: {
    score: 85,
    factors: {
      urgency: 90,
      impact: 80,
      effort: 30,
      risk: 70,
    },
    level: 'high',
  },
  status: 'pending',
  rootCauseAnalysis: {
    primaryCause: 'Thiếu giám sát',
    contributingFactors: ['Thiếu nhân sự'],
    patternType: 'systemic',
    confidence: 85,
  },
  impactAssessment: {
    projectImpact: 'high',
    timelineImpact: 7,
    costImpact: 15,
    qualityImpact: 'medium',
    safetyImpact: 'high',
  },
  resourceOptimization: {
    recommendedResources: ['Người giám sát A'],
    allocationEfficiency: 75,
    bottlenecks: ['Thiếu nhân sự'],
    optimizationPotential: 20,
  },
  timeline: {
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    milestones: [
      {
        name: 'Bắt đầu hành động',
        date: new Date(),
        completed: false,
      },
      {
        name: 'Hoàn thành hành động',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
    ],
    dependencies: [],
    bufferTime: 1,
  },
  successProbability: {
    overall: 80,
    factors: {
      historicalSuccess: 75,
      resourceAvailability: 85,
      stakeholderBuyIn: 80,
      complexity: 30,
    },
    confidence: 80,
  },
  assignee: 'user-1',
  attendees: ['user-1', 'user-2'],
  relatedDocuments: ['Hồ sơ quan trọng 1'],
  relatedContractors: ['Nhà thầu A'],
  relatedIssues: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  aiConfidence: 90,
  aiGenerated: true,
  meetingDetails: {
    agenda: ['Phân tích vấn đề', 'Đề xuất giải pháp'],
    duration: 60,
    location: 'Phòng họp A',
    virtual: false,
    recurring: false,
    requiredPreparation: ['Chuẩn bị tài liệu'],
  },
};

const mockEmailAction: EmailAction = {
  ...mockMeetingAction,
  id: 'action-2',
  title: 'Gửi email nhắc nhở',
  description: 'Gửi email nhắc nhở cho nhà thầu về các tài liệu còn thiếu',
  type: 'email',
  emailDetails: {
    template: 'reminder',
    recipients: ['contractor-a@example.com'],
    cc: ['manager@example.com'],
    subject: 'Nhắc nhở về tài liệu còn thiếu',
    attachments: ['danh-sach-tai-lieu.pdf'],
    trackingEnabled: true,
    followUpRequired: true,
  },
};

const mockSupportAction: SupportAction = {
  ...mockMeetingAction,
  id: 'action-3',
  title: 'Cung cấp hỗ trợ kỹ thuật',
  description: 'Gán nhân sự hỗ trợ kỹ thuật cho nhà thầu',
  type: 'support',
  supportDetails: {
    supportType: 'technical',
    supportLevel: 'intermediate',
    duration: 5,
    resources: ['Tài liệu hướng dẫn', 'Công cụ hỗ trợ'],
    mentor: 'user-2',
  },
};

const mockEscalationAction: EscalationAction = {
  ...mockMeetingAction,
  id: 'action-4',
  title: 'Escalation cho ban lãnh đạo',
  description: 'Escalation vấn đề cho ban lãnh đạo',
  type: 'escalation',
  escalationDetails: {
    escalationLevel: 'executive',
    reason: 'Vấn đề không được giải quyết sau nhiều lần nhắc nhở',
    previousActions: ['Gửi email', 'Họp'],
    expectedResolution: 'Nhà thầu hoàn thành tài liệu trong 3 ngày',
    urgency: 'immediate',
  },
};

const mockTrainingAction: TrainingAction = {
  ...mockMeetingAction,
  id: 'action-5',
  title: 'Đào tạo quy trình',
  description: 'Tổ chức đào tạo về quy trình nộp hồ sơ',
  type: 'training',
  trainingDetails: {
    trainingType: 'process',
    targetAudience: ['Nhà thầu A', 'Nhà thầu B'],
    duration: 4,
    materials: ['Slide đào tạo', 'Video hướng dẫn'],
    trainer: 'user-3',
    assessmentRequired: true,
  },
};

describe('AI Action Executor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeAction', () => {
    it('should execute meeting action successfully', async () => {
      const result = await aiActionExecutor.executeAction(mockMeetingAction);

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('action-1');
      expect(result.result.type).toBe('meeting_scheduled');
      expect(result.metrics.timeToExecute).toBeGreaterThan(0);
    });

    it('should execute email action successfully', async () => {
      const result = await aiActionExecutor.executeAction(mockEmailAction);

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('action-2');
      expect(result.result.type).toBe('email_created');
      expect(result.metrics.timeToExecute).toBeGreaterThan(0);
    });

    it('should execute support action successfully', async () => {
      const result = await aiActionExecutor.executeAction(mockSupportAction);

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('action-3');
      expect(result.result.type).toBe('support_assigned');
      expect(result.metrics.timeToExecute).toBeGreaterThan(0);
    });

    it('should execute escalation action successfully', async () => {
      const result = await aiActionExecutor.executeAction(mockEscalationAction);

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('action-4');
      expect(result.result.type).toBe('escalation_initiated');
      expect(result.metrics.timeToExecute).toBeGreaterThan(0);
    });

    it('should execute training action successfully', async () => {
      const result = await aiActionExecutor.executeAction(mockTrainingAction);

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('action-5');
      expect(result.result.type).toBe('training_scheduled');
      expect(result.metrics.timeToExecute).toBeGreaterThan(0);
    });

    it('should handle unsupported action type', async () => {
      const unsupportedAction = {
        ...mockMeetingAction,
        type: 'unsupported' as any,
      };

      const result = await aiActionExecutor.executeAction(unsupportedAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported action type');
    });

    it('should handle execution errors', async () => {
      // Mock a function that throws an error
      const errorAction = {
        ...mockMeetingAction,
        meetingDetails: {
          ...mockMeetingAction.meetingDetails,
          // This would cause an error in the implementation
          duration: -1,
        },
      };

      const result = await aiActionExecutor.executeAction(errorAction);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('executeBatch', () => {
    it('should execute batch actions sequentially', async () => {
      const batchRequest: BatchExecutionRequest = {
        actionIds: ['action-1', 'action-2'],
        executionMode: 'sequential',
        failureMode: 'stop_on_first',
      };

      // Mock getActionById to return our mock actions
      vi.spyOn(aiActionExecutor as any, 'getActionById')
        .mockImplementation((id: string) => {
          switch (id) {
            case 'action-1':
              return mockMeetingAction;
            case 'action-2':
              return mockEmailAction;
            default:
              return null;
          }
        });

      const result = await aiActionExecutor.executeBatch(batchRequest);

      expect(result.totalActions).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should execute batch actions in parallel', async () => {
      const batchRequest: BatchExecutionRequest = {
        actionIds: ['action-1', 'action-2'],
        executionMode: 'parallel',
        failureMode: 'continue_on_error',
      };

      // Mock getActionById to return our mock actions
      vi.spyOn(aiActionExecutor as any, 'getActionById')
        .mockImplementation((id: string) => {
          switch (id) {
            case 'action-1':
              return mockMeetingAction;
            case 'action-2':
              return mockEmailAction;
            default:
              return null;
          }
        });

      const result = await aiActionExecutor.executeBatch(batchRequest);

      expect(result.totalActions).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should handle batch execution with missing actions', async () => {
      const batchRequest: BatchExecutionRequest = {
        actionIds: ['action-1', 'non-existent'],
        executionMode: 'sequential',
        failureMode: 'continue_on_error',
      };

      // Mock getActionById to return our mock action for action-1 and null for non-existent
      vi.spyOn(aiActionExecutor as any, 'getActionById')
        .mockImplementation((id: string) => {
          switch (id) {
            case 'action-1':
              return mockMeetingAction;
            default:
              return null;
          }
        });

      const result = await aiActionExecutor.executeBatch(batchRequest);

      expect(result.totalActions).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
    });

    it('should stop on first error when failure mode is stop_on_first', async () => {
      const batchRequest: BatchExecutionRequest = {
        actionIds: ['action-1', 'action-2'],
        executionMode: 'sequential',
        failureMode: 'stop_on_first',
      };

      // Mock getActionById to return our mock actions
      // Mock executeAction to fail for action-2
      vi.spyOn(aiActionExecutor as any, 'getActionById')
        .mockImplementation((id: string) => {
          switch (id) {
            case 'action-1':
              return mockMeetingAction;
            case 'action-2':
              return mockEmailAction;
            default:
              return null;
          }
        });

      const mockExecuteAction = vi.spyOn(aiActionExecutor as any, 'executeAction')
        .mockImplementation((action: AIAction) => {
          if (action.id === 'action-2') {
            return Promise.resolve({
              actionId: action.id,
              success: false,
              executedAt: new Date(),
              executionTime: 100,
              result: null,
              error: 'Test error',
              metrics: {
                timeToExecute: 100,
                resourcesUsed: [],
                actualImpact: {
                  projectImpact: 'low',
                  timelineImpact: 0,
                  costImpact: 0,
                  qualityImpact: 'low',
                  safetyImpact: 'low',
                },
                lessonsLearned: [],
              },
            });
          }
          return aiActionExecutor.executeAction(action);
        });

      const result = await aiActionExecutor.executeBatch(batchRequest);

      expect(result.totalActions).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockExecuteAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback = {
        actionId: 'action-1',
        rating: 5,
        effectiveness: 90,
        comments: 'Hành động rất hiệu quả',
        wouldRecommend: true,
        actualTimeSpent: 45,
        actualImpact: {
          projectImpact: 'high',
          timelineImpact: 5,
          costImpact: 10,
          qualityImpact: 'high',
          safetyImpact: 'medium',
        },
        suggestions: ['Nên áp dụng cho các nhà thầu khác'],
        createdAt: new Date(),
      };

      const result = await aiActionExecutor.submitFeedback('action-1', feedback);

      expect(result).toBe(true);
    });

    it('should handle feedback submission errors', async () => {
      // Mock localStorage to throw an error
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: mockSetItem,
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const feedback = {
        actionId: 'action-1',
        rating: 5,
        effectiveness: 90,
        comments: 'Hành động rất hiệu quả',
        wouldRecommend: true,
        actualTimeSpent: 45,
        actualImpact: {
          projectImpact: 'high',
          timelineImpact: 5,
          costImpact: 10,
          qualityImpact: 'high',
          safetyImpact: 'medium',
        },
        suggestions: ['Nên áp dụng cho các nhà thầu khác'],
        createdAt: new Date(),
      };

      const result = await aiActionExecutor.submitFeedback('action-1', feedback);

      expect(result).toBe(false);
    });
  });

  describe('getActionHistory', () => {
    it('should get action history successfully', async () => {
      // Mock localStorage to return history data
      const mockHistory = [
        {
          action_id: 'action-1',
          success: true,
          executedAt: new Date().toISOString(),
          executionTime: 100,
          result: { type: 'meeting_scheduled' },
          metrics: {
            timeToExecute: 100,
            resourcesUsed: ['user-1'],
            actualImpact: {
              projectImpact: 'high',
              timelineImpact: 5,
              costImpact: 10,
              qualityImpact: 'high',
              safetyImpact: 'medium',
            },
            lessonsLearned: ['Hành động hiệu quả'],
          },
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockHistory)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const history = await aiActionExecutor.getActionHistory('action-1');

      expect(history).toHaveLength(1);
      expect(history[0].action_id).toBe('action-1');
      expect(history[0].success).toBe(true);
    });

    it('should handle empty history', async () => {
      // Mock localStorage to return empty history
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue('[]'),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const history = await aiActionExecutor.getActionHistory('action-1');

      expect(history).toHaveLength(0);
    });
  });

  describe('cancelAction', () => {
    it('should cancel action successfully', async () => {
      // Mock localStorage to return action data
      const mockActions = [
        {
          id: 'action-1',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.cancelAction('action-1', 'User requested cancellation');

      expect(result).toBe(true);
    });

    it('should handle cancellation of non-existent action', async () => {
      // Mock localStorage to return action data without the target action
      const mockActions = [
        {
          id: 'action-2',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.cancelAction('action-1');

      expect(result).toBe(false);
    });
  });

  describe('pauseAction', () => {
    it('should pause action successfully', async () => {
      // Mock localStorage to return action data
      const mockActions = [
        {
          id: 'action-1',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.pauseAction('action-1', 'User requested pause');

      expect(result).toBe(true);
    });

    it('should handle pausing of non-existent action', async () => {
      // Mock localStorage to return action data without the target action
      const mockActions = [
        {
          id: 'action-2',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.pauseAction('action-1');

      expect(result).toBe(false);
    });
  });

  describe('resumeAction', () => {
    it('should resume action successfully', async () => {
      // Mock localStorage to return action data
      const mockActions = [
        {
          id: 'action-1',
          status: 'in_progress',
          pause_reason: 'User requested pause',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.resumeAction('action-1');

      expect(result).toBe(true);
    });

    it('should handle resuming of non-existent action', async () => {
      // Mock localStorage to return action data without the target action
      const mockActions = [
        {
          id: 'action-2',
          status: 'in_progress',
          pause_reason: 'User requested pause',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockActions)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      const result = await aiActionExecutor.resumeAction('action-1');

      expect(result).toBe(false);
    });
  });
});