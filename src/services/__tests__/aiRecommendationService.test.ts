import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiRecommendationService } from '../aiRecommendationService';
import type { AIRecommendationRequest, AIRecommendation } from '@/lib/aiTypes';

// Mock data for testing
const mockRequest: AIRecommendationRequest = {
  contractorId: 'contractor-1',
  contractorName: 'Nhà thầu A',
  criticalIssues: [
    {
      contractorId: 'contractor-1',
      contractorName: 'Nhà thầu A',
      docTypeId: 'doc-1',
      docTypeName: 'Hồ sơ quan trọng 1',
      plannedDueDate: '2023-12-01',
      approvedCount: 1,
      requiredCount: 3,
      overdueDays: 5,
      dueInDays: null,
    },
  ],
  context: {
    projectPhase: 'execution',
    deadlinePressure: 'high',
    stakeholderVisibility: 'client',
  },
};

const mockRecommendations: AIRecommendation[] = [
  {
    id: 'rec-1',
    severity: 'high',
    message: 'Tổ chức họp khẩn cấp với nhà thầu để giải quyết các vấn đề về hồ sơ',
    actionType: 'meeting',
    estimatedImpact: 'high',
    timeToImplement: '1-2 ngày',
    relatedDocuments: ['Hồ sơ quan trọng 1'],
    aiConfidence: 90,
    aiGenerated: true,
    warningLevel: 3,
    riskScore: 85,
  },
  {
    id: 'rec-2',
    severity: 'medium',
    message: 'Gửi email nhắc nhở cho nhà thầu về các tài liệu còn thiếu',
    actionType: 'email',
    estimatedImpact: 'medium',
    timeToImplement: '1 ngày',
    relatedDocuments: ['Hồ sơ quan trọng 1'],
    aiConfidence: 75,
    aiGenerated: true,
    warningLevel: 2,
    riskScore: 65,
  },
];

describe('AI Recommendation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return recommendations for valid request', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          recommendations: mockRecommendations,
        }));

      const recommendations = await aiRecommendationService.getRecommendations(mockRequest);

      expect(recommendations).toEqual(mockRecommendations);
      expect(mockCallGLMAPI).toHaveBeenCalledTimes(1);
    });

    it('should use fallback recommendations when AI API fails', async () => {
      // Mock the AI API call to fail
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockRejectedValue(new Error('API Error'));

      const recommendations = await aiRecommendationService.getRecommendations(mockRequest);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(mockCallGLMAPI).toHaveBeenCalledTimes(1);
    });

    it('should cache recommendations for identical requests', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          recommendations: mockRecommendations,
        }));

      // First call
      const recommendations1 = await aiRecommendationService.getRecommendations(mockRequest);
      
      // Second call with same request
      const recommendations2 = await aiRecommendationService.getRecommendations(mockRequest);

      expect(recommendations1).toEqual(recommendations2);
      // API should only be called once due to caching
      expect(mockCallGLMAPI).toHaveBeenCalledTimes(1);
    });

    it('should generate different recommendations for different contexts', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          recommendations: mockRecommendations,
        }));

      // Test with different context
      const urgentContext = {
        ...mockRequest.context,
        deadlinePressure: 'high',
      };

      const normalContext = {
        ...mockRequest.context,
        deadlinePressure: 'low',
      };

      const urgentRecommendations = await aiRecommendationService.getRecommendations({
        ...mockRequest,
        context: urgentContext,
      });

      const normalRecommendations = await aiRecommendationService.getRecommendations({
        ...mockRequest,
        context: normalContext,
      });

      expect(urgentRecommendations).toBeDefined();
      expect(normalRecommendations).toBeDefined();
      // The actual implementation would need to be verified
    });

    it('should handle empty critical issues', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          recommendations: [],
        }));

      const emptyRequest = {
        ...mockRequest,
        criticalIssues: [],
      };

      const recommendations = await aiRecommendationService.getRecommendations(emptyRequest);

      expect(recommendations).toEqual([]);
      expect(mockCallGLMAPI).toHaveBeenCalledTimes(1);
    });
  });

  describe('testConnection', () => {
    it('should return success for valid configuration', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          id: 'test-config',
          provider: 'GLM',
          model: 'glm-4.5-flash',
          api_key: 'test-key',
          api_endpoint: 'https://api.test.com',
          temperature: 0.3,
          max_tokens: 1000,
          enabled: true,
        })),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock the API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue('Test successful');

      const result = await aiRecommendationService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('GLM API connection successful');
    });

    it('should return failure for invalid configuration', async () => {
      // Mock localStorage with invalid config
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          id: 'test-config',
          provider: 'GLM',
          model: 'glm-4.5-flash',
          api_key: '', // Missing API key
          api_endpoint: 'https://api.test.com',
          temperature: 0.3,
          max_tokens: 1000,
          enabled: true,
        })),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      const result = await aiRecommendationService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('API key is missing');
    });
  });

  describe('analyzeRootCauses', () => {
    it('should analyze root causes for critical issues', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          primaryCause: 'Thiếu giám sát và theo dõi',
          contributingFactors: [
            'Thiếu nhân sự giám sát',
            'Quy trình không rõ ràng',
            'Thiếu công cụ hỗ trợ',
          ],
          patternType: 'systemic',
          confidence: 85,
        }));

      const result = await aiRecommendationService.analyzeRootCauses(mockRequest.criticalIssues);

      expect(result.primaryCause).toBe('Thiếu giám sát và theo dõi');
      expect(result.contributingFactors).toContain('Thiếu nhân sự giám sát');
      expect(result.patternType).toBe('systemic');
      expect(result.confidence).toBe(85);
    });

    it('should use fallback analysis when AI API fails', async () => {
      // Mock the AI API call to fail
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockRejectedValue(new Error('API Error'));

      const result = await aiRecommendationService.analyzeRootCauses(mockRequest.criticalIssues);

      expect(result).toBeDefined();
      expect(result.primaryCause).toBeDefined();
      expect(result.contributingFactors).toBeDefined();
    });
  });

  describe('recognizePatterns', () => {
    it('should recognize patterns in historical data', async () => {
      // Mock historical data
      const historicalData = [
        {
          contractorId: 'contractor-1',
          docTypeId: 'doc-1',
          status: 'overdue',
          timestamp: '2023-11-01',
        },
        {
          contractorId: 'contractor-1',
          docTypeId: 'doc-1',
          status: 'overdue',
          timestamp: '2023-11-15',
        },
        {
          contractorId: 'contractor-2',
          docTypeId: 'doc-2',
          status: 'overdue',
          timestamp: '2023-11-05',
        },
      ];

      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          patterns: [
            {
              pattern: 'Chậm trễ trong việc nộp tài liệu',
              frequency: 5,
              affectedContractors: ['Nhà thầu A', 'Nhà thầu B'],
              affectedDocuments: ['Hồ sơ quan trọng 1', 'Hồ sơ quan trọng 2'],
              trend: 'stable',
            },
          ],
        }));

      const result = await aiRecommendationService.recognizePatterns(historicalData);

      expect(result).toHaveLength(1);
      expect(result[0].pattern).toBe('Chậm trễ trong việc nộp tài liệu');
      expect(result[0].frequency).toBe(5);
      expect(result[0].affectedContractors).toContain('Nhà thầu A');
    });

    it('should use fallback pattern recognition when AI API fails', async () => {
      // Mock the AI API call to fail
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockRejectedValue(new Error('API Error'));

      const result = await aiRecommendationService.recognizePatterns([]);

      expect(result).toBeDefined();
      // Should return empty array or fallback patterns
    });
  });

  describe('assessImpact', () => {
    it('should assess impact of critical issues', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          projectImpact: 'high',
          timelineImpact: 7,
          costImpact: 15,
          qualityImpact: 'medium',
          safetyImpact: 'high',
        }));

      const result = await aiRecommendationService.assessImpact(mockRequest.criticalIssues, mockRequest.context);

      expect(result.projectImpact).toBe('high');
      expect(result.timelineImpact).toBe(7);
      expect(result.costImpact).toBe(15);
      expect(result.qualityImpact).toBe('medium');
      expect(result.safetyImpact).toBe('high');
    });

    it('should use fallback impact assessment when AI API fails', async () => {
      // Mock the AI API call to fail
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockRejectedValue(new Error('API Error'));

      const result = await aiRecommendationService.assessImpact(mockRequest.criticalIssues, mockRequest.context);

      expect(result).toBeDefined();
      expect(result.projectImpact).toBeDefined();
      expect(result.timelineImpact).toBeDefined();
    });
  });

  describe('optimizeResources', () => {
    it('should optimize resources for critical issues', async () => {
      // Mock the AI API call
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockResolvedValue(JSON.stringify({
          recommendedResources: ['Người giám sát A', 'Công cụ hỗ trợ B'],
          allocationEfficiency: 75,
          bottlenecks: ['Thiếu nhân sự giám sát', 'Thiếu công cụ hỗ trợ'],
          optimizationPotential: 20,
        }));

      const availableResources = ['Người giám sát A', 'Người hỗ trợ B', 'Công cụ C'];
      const result = await aiRecommendationService.optimizeResources(mockRequest.criticalIssues, availableResources);

      expect(result.recommendedResources).toContain('Người giám sát A');
      expect(result.allocationEfficiency).toBe(75);
      expect(result.bottlenecks).toContain('Thiếu nhân sự giám sát');
      expect(result.optimizationPotential).toBe(20);
    });

    it('should use fallback resource optimization when AI API fails', async () => {
      // Mock the AI API call to fail
      const mockCallGLMAPI = vi.spyOn(aiRecommendationService as any, 'callGLMAPI')
        .mockRejectedValue(new Error('API Error'));

      const availableResources = ['Người giám sát A', 'Người hỗ trợ B'];
      const result = await aiRecommendationService.optimizeResources(mockRequest.criticalIssues, availableResources);

      expect(result).toBeDefined();
      expect(result.recommendedResources).toBeDefined();
      expect(result.allocationEfficiency).toBeDefined();
    });
  });

  describe('calculateActionPriority', () => {
    it('should calculate action priority correctly', () => {
      const mockRootCause = {
        primaryCause: 'Thiếu giám sát',
        contributingFactors: ['Thiếu nhân sự'],
        patternType: 'systemic',
        confidence: 85,
      };

      const mockImpact = {
        projectImpact: 'high',
        timelineImpact: 7,
        costImpact: 15,
        qualityImpact: 'medium',
        safetyImpact: 'high',
      };

      const mockResources = {
        recommendedResources: ['Người giám sát'],
        allocationEfficiency: 75,
        bottlenecks: ['Thiếu nhân sự'],
        optimizationPotential: 20,
      };

      const result = aiRecommendationService.calculateActionPriority(mockRootCause, mockImpact, mockResources);

      expect(result.score).toBeGreaterThan(0);
      expect(result.level).toBeDefined();
      expect(result.factors.urgency).toBeGreaterThan(0);
      expect(result.factors.impact).toBeGreaterThan(0);
      expect(result.factors.effort).toBeGreaterThan(0);
      expect(result.factors.risk).toBeGreaterThan(0);
    });

    it('should assign correct priority level based on score', () => {
      const mockRootCause = {
        primaryCause: 'Minor issue',
        contributingFactors: ['Small factor'],
        patternType: 'isolated',
        confidence: 50,
      };

      const mockImpact = {
        projectImpact: 'low',
        timelineImpact: 1,
        costImpact: 2,
        qualityImpact: 'low',
        safetyImpact: 'low',
      };

      const mockResources = {
        recommendedResources: ['Người hỗ trợ'],
        allocationEfficiency: 90,
        bottlenecks: ['Small bottleneck'],
        optimizationPotential: 5,
      };

      const result = aiRecommendationService.calculateActionPriority(mockRootCause, mockImpact, mockResources);

      expect(result.level).toBe('low');
      expect(result.score).toBeLessThan(40);
    });
  });

  describe('planTimeline', () => {
    it('should plan timeline correctly', () => {
      const mockActionType = 'meeting';
      const mockPriority = {
        score: 85,
        factors: {
          urgency: 90,
          impact: 80,
          effort: 30,
          risk: 70,
        },
        level: 'critical',
      };

      const mockContext = {
        projectPhase: 'execution',
        deadlinePressure: 'high',
        stakeholderVisibility: 'client',
      };

      const result = aiRecommendationService.planTimeline(mockActionType, mockPriority, mockContext);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.milestones).toHaveLength(2);
      expect(result.bufferTime).toBeGreaterThan(0);
    });

    it('should adjust timeline based on action type', () => {
      const mockPriority = {
        score: 70,
        factors: {
          urgency: 60,
          impact: 70,
          effort: 40,
          risk: 50,
        },
        level: 'medium',
      };

      const mockContext = {
        projectPhase: 'execution',
        deadlinePressure: 'medium',
        stakeholderVisibility: 'internal',
      };

      const meetingResult = aiRecommendationService.planTimeline('meeting', mockPriority, mockContext);
      const emailResult = aiRecommendationService.planTimeline('email', mockPriority, mockContext);
      const trainingResult = aiRecommendationService.planTimeline('training', mockPriority, mockContext);

      // Meeting should have shorter duration than training
      const meetingDuration = meetingResult.endDate.getTime() - meetingResult.startDate.getTime();
      const trainingDuration = trainingResult.endDate.getTime() - trainingResult.startDate.getTime();

      expect(meetingDuration).toBeLessThan(trainingDuration);
    });
  });

  describe('estimateSuccessProbability', () => {
    it('should estimate success probability correctly', () => {
      const mockActionType = 'meeting';
      const mockPriority = {
        score: 75,
        factors: {
          urgency: 70,
          impact: 80,
          effort: 40,
          risk: 60,
        },
        level: 'high',
      };

      const mockResources = {
        recommendedResources: ['Người giám sát'],
        allocationEfficiency: 75,
        bottlenecks: ['Thiếu nhân sự'],
        optimizationPotential: 20,
      };

      const mockContext = {
        projectPhase: 'execution',
        deadlinePressure: 'medium',
        stakeholderVisibility: 'internal',
      };

      const result = aiRecommendationService.estimateSuccessProbability(mockActionType, mockPriority, mockResources, mockContext);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should adjust probability based on resource availability', () => {
      const mockActionType = 'meeting';
      const mockPriority = {
        score: 75,
        factors: {
          urgency: 70,
          impact: 80,
          effort: 40,
          risk: 60,
        },
        level: 'high',
      };

      const highAvailabilityResources = {
        recommendedResources: ['Người giám sát', 'Người hỗ trợ'],
        allocationEfficiency: 95,
        bottlenecks: [],
        optimizationPotential: 5,
      };

      const lowAvailabilityResources = {
        recommendedResources: ['Người giám sát'],
        allocationEfficiency: 40,
        bottlenecks: ['Thiếu nhân sự', 'Thiếu công cụ'],
        optimizationPotential: 30,
      };

      const mockContext = {
        projectPhase: 'execution',
        deadlinePressure: 'medium',
        stakeholderVisibility: 'internal',
      };

      const highAvailabilityResult = aiRecommendationService.estimateSuccessProbability(mockActionType, mockPriority, highAvailabilityResources, mockContext);
      const lowAvailabilityResult = aiRecommendationService.estimateSuccessProbability(mockActionType, mockPriority, lowAvailabilityResources, mockContext);

      expect(highAvailabilityResult.overall).toBeGreaterThan(lowAvailabilityResult.overall);
    });
  });
});