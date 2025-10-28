import type {
  AIAction,
  ActionExecutionResult,
  ActionFeedback,
  ActionAnalytics,
  AIModelUpdate,
  AILearningConfig
} from '@/lib/aiTypes';

class AITrackingService {
  private readonly TRACKING_STORAGE_KEY = 'ai_action_tracking';
  private readonly FEEDBACK_STORAGE_KEY = 'ai_action_feedbacks';
  private readonly ANALYTICS_STORAGE_KEY = 'ai_action_analytics';
  private readonly LEARNING_STORAGE_KEY = 'ai_learning_data';

  /**
   * Lưu kết quả thực thi action
   */
  async saveExecutionResult(result: ActionExecutionResult): Promise<boolean> {
    try {
      // Lưu vào localStorage cho immediate access
      const existingResults = JSON.parse(localStorage.getItem(this.TRACKING_STORAGE_KEY) || '[]');
      existingResults.push(result);
      localStorage.setItem(this.TRACKING_STORAGE_KEY, JSON.stringify(existingResults));

      // Placeholder cho database persistence
      console.log('Execution result saved:', result);
      return true;
    } catch (error) {
      console.error('Error in saveExecutionResult:', error);
      return false;
    }
  }

  /**
   * Lấy lịch sử thực thi của action
   */
  async getActionHistory(actionId: string): Promise<ActionExecutionResult[]> {
    try {
      // Lấy từ localStorage cho immediate access
      const allResults = JSON.parse(localStorage.getItem(this.TRACKING_STORAGE_KEY) || '[]');
      const actionResults = allResults.filter((result: any) => result.actionId === actionId);

      return actionResults as ActionExecutionResult[];
    } catch (error) {
      console.error('Error in getActionHistory:', error);
      return [];
    }
  }

  /**
   * Lưu feedback cho action
   */
  async saveFeedback(feedback: ActionFeedback): Promise<boolean> {
    try {
      // Lưu vào localStorage cho immediate access
      const existingFeedbacks = JSON.parse(localStorage.getItem(this.FEEDBACK_STORAGE_KEY) || '[]');
      existingFeedbacks.push(feedback);
      localStorage.setItem(this.FEEDBACK_STORAGE_KEY, JSON.stringify(existingFeedbacks));

      // Trigger AI learning update
      await this.triggerLearningUpdate(feedback);

      console.log('Feedback saved:', feedback);
      return true;
    } catch (error) {
      console.error('Error in saveFeedback:', error);
      return false;
    }
  }

  /**
   * Lấy feedback của action
   */
  async getActionFeedback(actionId: string): Promise<ActionFeedback[]> {
    try {
      // Lấy từ localStorage cho immediate access
      const allFeedbacks = JSON.parse(localStorage.getItem(this.FEEDBACK_STORAGE_KEY) || '[]');
      const actionFeedbacks = allFeedbacks.filter((feedback: any) => feedback.actionId === actionId);

      return actionFeedbacks as ActionFeedback[];
    } catch (error) {
      console.error('Error in getActionFeedback:', error);
      return [];
    }
  }

  /**
   * Tính toán analytics cho actions
   */
  async calculateAnalytics(dateRange?: { start: Date; end: Date }): Promise<ActionAnalytics> {
    try {
      // Lấy tất cả execution results
      const allResults = JSON.parse(localStorage.getItem(this.TRACKING_STORAGE_KEY) || '[]');
      const allFeedbacks = JSON.parse(localStorage.getItem(this.FEEDBACK_STORAGE_KEY) || '[]');

      // Filter theo date range nếu có
      const filteredResults = dateRange
        ? allResults.filter((result: any) => {
            const executedDate = new Date(result.executedAt);
            return executedDate >= dateRange.start && executedDate <= dateRange.end;
          })
        : allResults;

      const filteredFeedbacks = dateRange
        ? allFeedbacks.filter((feedback: any) => {
            const createdDate = new Date(feedback.createdAt);
            return createdDate >= dateRange.start && createdDate <= dateRange.end;
          })
        : allFeedbacks;

      // Tính toán các metrics
      const totalActions = filteredResults.length;
      const successfulActions = filteredResults.filter((result: any) => result.success).length;
      const successRate = totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 0;

      const averageExecutionTime = totalActions > 0
        ? Math.round(filteredResults.reduce((sum: number, result: any) => sum + result.executionTime, 0) / totalActions)
        : 0;

      // Tính toán most effective action types
      const actionTypes = ['meeting', 'email', 'escalation', 'support', 'training', 'audit', 'review'] as const;
      const typeEffectiveness = actionTypes.map(type => {
        const typeResults = filteredResults.filter((result: any) => {
          // Lấy action type từ action data
          const actionData = this.getActionById(result.actionId);
          return actionData?.type === type;
        });

        const typeFeedbacks = filteredFeedbacks.filter((feedback: any) => {
          const actionData = this.getActionById(feedback.actionId);
          return actionData?.type === type;
        });

        const successCount = typeResults.filter((result: any) => result.success).length;
        const totalTypeCount = typeResults.length;
        const avgEffectiveness = typeFeedbacks.length > 0
          ? Math.round(typeFeedbacks.reduce((sum: number, feedback: any) => sum + feedback.effectiveness, 0) / typeFeedbacks.length)
          : 0;

        return {
          type,
          successRate: totalTypeCount > 0 ? Math.round((successCount / totalTypeCount) * 100) : 0,
          averageImpact: avgEffectiveness,
          totalExecuted: totalTypeCount
        };
      });

      const mostEffectiveActionTypes = typeEffectiveness
        .sort((a, b) => b.averageImpact - a.averageImpact)
        .slice(0, 5);

      // Tính toán common patterns
      const commonPatterns = this.identifyCommonPatterns(filteredResults, filteredFeedbacks);

      // Tính toán user satisfaction
      const userSatisfaction = filteredFeedbacks.length > 0
        ? Math.round(filteredFeedbacks.reduce((sum: number, feedback: any) => sum + feedback.rating, 0) / filteredFeedbacks.length)
        : 0;

      // Tính toán AI accuracy
      const aiAccuracy = this.calculateAIAccuracy(filteredResults, filteredFeedbacks);

      const analytics: ActionAnalytics = {
        totalActions,
        successRate,
        averageExecutionTime,
        mostEffectiveActionTypes,
        commonPatterns,
        userSatisfaction,
        aiAccuracy
      };

      // Lưu analytics vào localStorage
      localStorage.setItem(this.ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));

      return analytics;
    } catch (error) {
      console.error('Error in calculateAnalytics:', error);
      return {
        totalActions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        mostEffectiveActionTypes: [],
        commonPatterns: [],
        userSatisfaction: 0,
        aiAccuracy: 0
      };
    }
  }

  /**
   * Lấy analytics đã lưu
   */
  getStoredAnalytics(): ActionAnalytics | null {
    try {
      const analytics = localStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      return analytics ? JSON.parse(analytics) : null;
    } catch (error) {
      console.error('Error getting stored analytics:', error);
      return null;
    }
  }

  /**
   * Trigger AI learning update
   */
  private async triggerLearningUpdate(feedback: ActionFeedback): Promise<void> {
    try {
      // Lấy learning data hiện tại
      const learningData = JSON.parse(localStorage.getItem(this.LEARNING_STORAGE_KEY) || '{}');

      // Cập nhật learning data với feedback mới
      const actionType = this.getActionTypeById(feedback.actionId);
      if (actionType) {
        if (!learningData[actionType]) {
          learningData[actionType] = {
            patternId: `${actionType}-pattern`,
            successRate: 0,
            averageExecutionTime: 0,
            userFeedback: [],
            contextualFactors: {},
            improvementSuggestions: []
          };
        }

        // Cập nhật metrics
        const typeData = learningData[actionType];
        typeData.userFeedback.push(feedback);
        typeData.successRate = Math.round(
          (typeData.userFeedback.filter((f: any) => f.rating >= 4).length / typeData.userFeedback.length) * 100
        );
        typeData.averageExecutionTime = Math.round(
          typeData.userFeedback.reduce((sum: number, f: any) => sum + f.actualTimeSpent, 0) / typeData.userFeedback.length
        );

        // Tạo improvement suggestions
        typeData.improvementSuggestions = this.generateImprovementSuggestions(typeData);
      }

      // Lưu learning data đã cập nhật
      localStorage.setItem(this.LEARNING_STORAGE_KEY, JSON.stringify(learningData));

      // Gửi update đến AI model (placeholder cho actual implementation)
      await this.updateAIModel(learningData);
    } catch (error) {
      console.error('Error in triggerLearningUpdate:', error);
    }
  }

  /**
   * Cập nhật AI model với learning data mới
   */
  private async updateAIModel(learningData: any): Promise<void> {
    try {
      // Đây là placeholder cho actual AI model update
      // Trong thực tế, điều này sẽ gọi AI service để cập nhật model
      console.log('Updating AI model with learning data:', learningData);

      // Lưu model update record
      const modelUpdate: AIModelUpdate = {
        timestamp: new Date(),
        version: '1.0.1',
        improvements: [
          'Updated success probability predictions',
          'Improved action type recommendations',
          'Enhanced timeline estimation'
        ],
        performanceMetrics: {
          accuracy: 85,
          precision: 82,
          recall: 88,
          f1Score: 85
        },
        trainingDataSize: Object.keys(learningData).length
      };

      // Placeholder cho database save
      console.log('AI model update saved:', modelUpdate);
    } catch (error) {
      console.error('Error in updateAIModel:', error);
    }
  }

  /**
   * Lấy action theo ID từ localStorage
   */
  private getActionById(actionId: string): AIAction | null {
    try {
      const actions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
      return actions.find((action: any) => action.id === actionId) || null;
    } catch (error) {
      console.error('Error getting action by ID:', error);
      return null;
    }
  }

  /**
   * Lấy action type theo ID
   */
  private getActionTypeById(actionId: string): string | null {
    try {
      const action = this.getActionById(actionId);
      return action?.type || null;
    } catch (error) {
      console.error('Error getting action type by ID:', error);
      return null;
    }
  }

  /**
   * Nhận diện common patterns từ execution results và feedback
   */
  private identifyCommonPatterns(
    executionResults: any[],
    feedbacks: any[]
  ): Array<{ pattern: string; frequency: number; recommendedActions: string[] }> {
    const patterns: Array<{ pattern: string; frequency: number; recommendedActions: string[] }> = [];

    // Pattern 1: Actions với high success rate
    const successfulActions = executionResults.filter((result: any) => result.success);
    const actionTypes = ['meeting', 'email', 'escalation', 'support', 'training'] as const;
    
    actionTypes.forEach(type => {
      const typeActions = successfulActions.filter(result => {
        const action = this.getActionById(result.actionId);
        return action?.type === type;
      });

      if (typeActions.length >= 3) {
        patterns.push({
          pattern: `${type} actions have high success rate`,
          frequency: typeActions.length,
          recommendedActions: [
            `Continue using ${type} actions for similar issues`,
            `Consider ${type} actions as first response for critical issues`
          ]
        });
      }
    });

    // Pattern 2: Actions cần nhiều thời gian hơn dự kiến
    const longExecutionActions = executionResults.filter(result => {
      const action = this.getActionById(result.actionId);
      const estimatedTime = action?.timeline?.bufferTime || 0;
      return result.executionTime > estimatedTime * 1.5; // 50% longer than estimated
    });

    if (longExecutionActions.length >= 2) {
      patterns.push({
        pattern: 'Actions consistently take longer than estimated',
        frequency: longExecutionActions.length,
        recommendedActions: [
          'Increase time estimates by 50%',
          'Add buffer time for complex actions',
          'Review resource allocation for time-intensive actions'
        ]
      });
    }

    // Pattern 3: Low user satisfaction
    const lowSatisfactionFeedbacks = feedbacks.filter(feedback => feedback.rating <= 2);
    if (lowSatisfactionFeedbacks.length >= 3) {
      patterns.push({
        pattern: 'Low user satisfaction with certain action types',
        frequency: lowSatisfactionFeedbacks.length,
        recommendedActions: [
          'Review action templates and communication',
          'Provide better guidance and support materials',
          'Consider alternative action types for recurring issues'
        ]
      });
    }

    return patterns;
  }

  /**
   * Tính toán AI accuracy
   */
  private calculateAIAccuracy(executionResults: any[], feedbacks: any[]): number {
    if (executionResults.length === 0) return 0;

    // So sánh predicted success probability với actual results
    let totalAccuracy = 0;
    let count = 0;

    executionResults.forEach(result => {
      const action = this.getActionById(result.actionId);
      if (action && action.aiConfidence) {
        const predictedSuccess = action.aiConfidence > 70; // Consider >70% as predicted success
        const actualSuccess = result.success;
        
        if (predictedSuccess === actualSuccess) {
          totalAccuracy += 100;
        } else {
          totalAccuracy += Math.max(0, 100 - Math.abs(action.aiConfidence - (actualSuccess ? 100 : 0)));
        }
        count++;
      }
    });

    return count > 0 ? Math.round(totalAccuracy / count) : 0;
  }

  /**
   * Tạo improvement suggestions từ learning data
   */
  private generateImprovementSuggestions(typeData: any): string[] {
    const suggestions: string[] = [];

    if (typeData.successRate < 60) {
      suggestions.push(`Improve ${typeData.patternId} action templates and guidance`);
    }

    if (typeData.averageExecutionTime > 60) {
      suggestions.push(`Optimize ${typeData.patternId} action execution process`);
    }

    const lowRatings = typeData.userFeedback.filter((f: any) => f.rating <= 2);
    if (lowRatings.length > typeData.userFeedback.length * 0.3) {
      suggestions.push(`Review ${typeData.patternId} action effectiveness and user experience`);
    }

    return suggestions;
  }

  /**
   * Lấy learning config
   */
  getLearningConfig(): AILearningConfig {
    try {
      const config = localStorage.getItem('ai_learning_config');
      return config ? JSON.parse(config) : {
        enabled: true,
        learningRate: 0.1,
        feedbackWeight: 0.3,
        patternRecognition: {
          minOccurrences: 3,
          timeWindow: 30,
          confidenceThreshold: 0.7
        },
        adaptation: {
          contextSensitivity: 0.8,
          userPreferenceWeight: 0.5,
          historicalWeight: 0.7
        }
      };
    } catch (error) {
      console.error('Error getting learning config:', error);
      return {
        enabled: true,
        learningRate: 0.1,
        feedbackWeight: 0.3,
        patternRecognition: {
          minOccurrences: 3,
          timeWindow: 30,
          confidenceThreshold: 0.7
        },
        adaptation: {
          contextSensitivity: 0.8,
          userPreferenceWeight: 0.5,
          historicalWeight: 0.7
        }
      };
    }
  }

  /**
   * Cập nhật learning config
   */
  updateLearningConfig(config: Partial<AILearningConfig>): boolean {
    try {
      const currentConfig = this.getLearningConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem('ai_learning_config', JSON.stringify(newConfig));
      return true;
    } catch (error) {
      console.error('Error updating learning config:', error);
      return false;
    }
  }

  /**
   * Xóa tracking data cũ
   */
  cleanupOldData(daysToKeep: number = 90): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Cleanup execution results
      const executionResults = JSON.parse(localStorage.getItem(this.TRACKING_STORAGE_KEY) || '[]');
      const filteredResults = executionResults.filter((result: any) => 
        new Date(result.executedAt) >= cutoffDate
      );
      localStorage.setItem(this.TRACKING_STORAGE_KEY, JSON.stringify(filteredResults));

      // Cleanup feedbacks
      const feedbacks = JSON.parse(localStorage.getItem(this.FEEDBACK_STORAGE_KEY) || '[]');
      const filteredFeedbacks = feedbacks.filter((feedback: any) => 
        new Date(feedback.createdAt) >= cutoffDate
      );
      localStorage.setItem(this.FEEDBACK_STORAGE_KEY, JSON.stringify(filteredFeedbacks));

      console.log(`Cleaned up tracking data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const aiTrackingService = new AITrackingService();