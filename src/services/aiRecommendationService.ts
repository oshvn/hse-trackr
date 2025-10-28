import { supabase } from '@/lib/supabase';
import type { CriticalAlertItem, RedCardItem } from '@/lib/dashboardHelpers';
import type {
  AIAction,
  ActionType,
  RootCauseAnalysis,
  PatternRecognition,
  ImpactAssessment,
  ResourceOptimization,
  ActionPriority,
  TimelinePlanning,
  SuccessProbability,
  MeetingAction,
  EmailAction,
  SupportAction,
  EscalationAction,
  TrainingAction,
  AILearningConfig,
  AIModelUpdate,
  AIError,
  FallbackStrategy
} from '@/lib/aiTypes';

interface AIConfig {
  id: string;
  provider: string;
  model: string;
  api_key: string;
  api_endpoint: string;
  temperature: number;
  max_tokens: number;
  enabled: boolean;
}

interface AICache {
  data: AIRecommendation[];
  timestamp: number;
  hash: string;
}

export interface ProjectContext {
  projectPhase: 'planning' | 'execution' | 'closeout';
  deadlinePressure: 'low' | 'medium' | 'high';
  stakeholderVisibility: 'internal' | 'client' | 'regulatory';
}

export interface AIRecommendationRequest {
  contractorId: string;
  contractorName: string;
  criticalIssues: CriticalAlertItem[];
  redCards?: RedCardItem[];
  context: ProjectContext;
}

export interface AIRecommendation {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  actionType: 'meeting' | 'email' | 'escalation' | 'support' | 'training';
  estimatedImpact: 'high' | 'medium' | 'low';
  timeToImplement: string;
  relatedDocuments: string[];
  aiConfidence: number;
  aiGenerated?: boolean;
  warningLevel?: 1 | 2 | 3;
  riskScore?: number;
}

// Enhanced interface for Red Card specific recommendations
export interface RedCardAIRecommendation extends AIRecommendation {
  redCardId: string;
  warningLevel: 1 | 2 | 3;
  riskScore: number;
  priorityActions: string[];
  escalationPath: string[];
  preventiveMeasures: string[];
}

class AIRecommendationService {
  private CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private learningConfig: AILearningConfig = {
    enabled: true,
    learningRate: 0.1,
    feedbackWeight: 0.3,
    patternRecognition: {
      minOccurrences: 3,
      timeWindow: 30, // days
      confidenceThreshold: 0.7
    },
    adaptation: {
      contextSensitivity: 0.8,
      userPreferenceWeight: 0.5,
      historicalWeight: 0.7
    }
  };
  
  private getActiveConfig(): AIConfig | null {
    try {
      const savedConfig = localStorage.getItem('ai_config');
      if (savedConfig) {
        const config: AIConfig = JSON.parse(savedConfig);
        if (config.enabled) return config;
      }
    } catch (error) {
      console.error('Failed to load AI config from localStorage:', error);
    }
    
    // Fallback to environment variables
    const fallbackConfig: AIConfig = {
      id: 'fallback',
      provider: 'GLM',
      model: 'glm-4.5-flash',
      api_key: import.meta.env.VITE_GLM_API_KEY || '',
      api_endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      temperature: 0.3,
      max_tokens: 1000,
      enabled: true,
    };
    
    return fallbackConfig;
  }
  
  private generateRequestHash(request: AIRecommendationRequest): string {
    // Create a hash based on the critical issues and context
    const issuesString = request.criticalIssues.map(issue =>
      `${issue.contractorId}-${issue.docTypeId}`
    ).sort().join('|');
    
    const contextString = `${request.context.projectPhase}-${request.context.deadlinePressure}-${request.context.stakeholderVisibility}`;
    
    return btoa(issuesString + contextString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
  
  private getCache(hash: string): AIRecommendation[] | null {
    try {
      const cacheKey = `ai_cache_${hash}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const cache: AICache = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cache.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Failed to get AI cache:', error);
      return null;
    }
  }
  
  private setCache(hash: string, data: AIRecommendation[]): void {
    try {
      const cacheKey = `ai_cache_${hash}`;
      const cache: AICache = {
        data,
        timestamp: Date.now(),
        hash
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to set AI cache:', error);
    }
  }

  async getRecommendations(request: AIRecommendationRequest): Promise<AIRecommendation[]> {
    const config = this.getActiveConfig();
    if (!config || !config.api_key) {
      console.warn('No active AI configuration found, using fallback recommendations');
      return this.generateFallbackRecommendations(request.criticalIssues);
    }
    
    // Generate hash for caching
    const requestHash = this.generateRequestHash(request);
    
    // Check cache first
    const cachedRecommendations = this.getCache(requestHash);
    if (cachedRecommendations) {
      console.log('Using cached AI recommendations');
      return cachedRecommendations;
    }
    
    try {
      // Tạo prompt cho AI
      const prompt = this.generatePrompt(request.criticalIssues, request.context, request.contractorName, request.redCards);
      
      // Gọi AI API dựa trên provider
      let aiResponse: string;
      if (config.provider === 'GLM') {
        aiResponse = await this.callGLMAPI(prompt, config);
      } else if (config.provider === 'Gemini') {
        aiResponse = await this.callGeminiAPI(prompt, config);
      } else if (config.provider === 'OpenAI') {
        aiResponse = await this.callOpenAIAPI(prompt, config);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
      
      // Parse response từ AI
      const recommendations = this.parseAIResponse(aiResponse, request.criticalIssues, request.redCards);
      
      // Cache the results
      this.setCache(requestHash, recommendations);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      // Fallback về rule-based recommendations
      return this.generateFallbackRecommendations(request.criticalIssues, request.redCards);
    }
  }

  private generatePrompt(
    criticalIssues: CriticalAlertItem[],
    context: ProjectContext,
    contractorName: string,
    redCards?: RedCardItem[]
  ): string {
    const redCardsInfo = redCards ? `
PHÂN TÍCH RED CARDS THEO MỨC ĐỘ:
${redCards.map((card, index) => `
${index + 1}. ${card.docTypeName} (Mức ${card.warningLevel})
   - Trạng thái: ${card.approvedCount}/${card.requiredCount} đã được phê duyệt (${card.progressPercentage}%)
   - Điểm rủi ro: ${card.riskScore}%
   - Thời gian: ${card.daysOverdue > 0 ? `Quá hạn ${card.daysOverdue} ngày` : card.daysUntilDue !== null ? `Còn ${card.daysUntilDue} ngày` : 'Không có hạn'}
   - Hành động đề xuất: ${card.recommendedActions.join(', ')}
`).join('')}

PHÂN TÍCH RỦI RO:
- Mức 1 (Cảnh báo sớm): ${redCards.filter(c => c.warningLevel === 1).length} items
- Mức 2 (Cảnh báo khẩn): ${redCards.filter(c => c.warningLevel === 2).length} items
- Mức 3 (Quá hạn): ${redCards.filter(c => c.warningLevel === 3).length} items
- Điểm rủi ro trung bình: ${Math.round(redCards.reduce((sum, c) => sum + c.riskScore, 0) / redCards.length)}%
` : '';

    return `Bạn là một chuyên gia quản lý dự án xây dựng với 20 năm kinh nghiệm. Hãy phân tích các vấn đề sau và đề xuất hành động cụ thể.

NHÀ THẦU: ${contractorName}

CÁC VẤN ĐỀ QUAN TRỌNG:
${criticalIssues.map((issue, index) => `
${index + 1}. ${issue.docTypeName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount} đã được phê duyệt
   - Quá hạn: ${issue.overdueDays} ngày
   - Đến hạn: ${issue.dueInDays !== null ? `${issue.dueInDays} ngày nữa` : 'Đã quá hạn'}
`).join('')}
${redCardsInfo}

BỐI CẢNH DỰ ÁN:
- Giai đoạn dự án: ${context.projectPhase}
- Mức độ áp lực deadline: ${context.deadlinePressure}
- Mức độ hiển thị cho bên ngoài: ${context.stakeholderVisibility}

YÊU CẦU:
Hãy đề xuất 3-5 hành động cụ thể, sắp xếp theo mức độ ưu tiên. Mỗi hành động bao gồm:
1. Mức độ ưu tiên (high/medium/low)
2. Loại hành động (meeting/email/escalation/support/training)
3. Mô tả chi tiết hành động
4. Tác động ước tính (high/medium/low)
5. Thời gian thực hiện
6. Mức độ tin cậy (0-100%)
7. Mức độ cảnh báo liên quan (1/2/3) - nếu có

TRẢ LỜI THEO ĐỊNH DẠNG JSON NHƯ SAU:
{
  "recommendations": [
    {
      "severity": "high",
      "actionType": "meeting",
      "message": "Mô tả chi tiết hành động",
      "estimatedImpact": "high",
      "timeToImplement": "1-2 ngày",
      "aiConfidence": 90,
      "warningLevel": 3,
      "riskScore": 85
    }
  ]
}`;
  }

  private async callGLMAPI(prompt: string, config: AIConfig): Promise<any> {
    try {
      const response = await fetch(config.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là một chuyên gia quản lý dự án xây dựng. Luôn trả lời với JSON hợp lệ và chính xác.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens
        })
      });

      if (!response.ok) {
        throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GLM API:', error);
      throw error;
    }
  }

  private async callGeminiAPI(prompt: string, config: AIConfig): Promise<any> {
    try {
      const response = await fetch(`${config.api_endpoint}?key=${config.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.max_tokens,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private async callOpenAIAPI(prompt: string, config: AIConfig): Promise<any> {
    try {
      const response = await fetch(config.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là một chuyên gia quản lý dự án xây dựng. Luôn trả lời với JSON hợp lệ và chính xác.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private parseAIResponse(aiResponse: string, criticalIssues: CriticalAlertItem[], redCards?: RedCardItem[]): AIRecommendation[] {
    try {
      // Thử parse JSON response
      const parsed = JSON.parse(aiResponse);
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations.map((rec: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          severity: rec.severity || 'medium',
          message: rec.message || 'Hành động được đề xuất',
          actionType: rec.actionType || 'support',
          estimatedImpact: rec.estimatedImpact || 'medium',
          timeToImplement: rec.timeToImplement || '1-3 ngày',
          relatedDocuments: criticalIssues.map(issue => issue.docTypeName),
          aiConfidence: rec.aiConfidence || 75,
          aiGenerated: true,
          warningLevel: rec.warningLevel || undefined,
          riskScore: rec.riskScore || undefined
        }));
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', aiResponse);
    }
    
    // Fallback nếu parse JSON thất bại
    return this.generateFallbackRecommendations(criticalIssues);
  }

  private generateFallbackRecommendations(criticalIssues: CriticalAlertItem[], redCards?: RedCardItem[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    
    // If we have red cards, generate recommendations based on warning levels
    if (redCards && redCards.length > 0) {
      // Group by warning level
      const level1Cards = redCards.filter(card => card.warningLevel === 1);
      const level2Cards = redCards.filter(card => card.warningLevel === 2);
      const level3Cards = redCards.filter(card => card.warningLevel === 3);
      
      // Generate recommendations for each level
      if (level3Cards.length > 0) {
        recommendations.push({
          id: `fallback-${Date.now()}-level3`,
          severity: 'high',
          actionType: 'escalation',
          message: `KHẨN CẤP: ${level3Cards.length} tài liệu quá hạn cần họp với ban lãnh đạo ngay lập tức. Xem xét dừng thi công cho các nhà thầu không tuân thủ.`,
          estimatedImpact: 'high',
          timeToImplement: '1 ngày',
          relatedDocuments: level3Cards.map(card => card.docTypeName),
          aiConfidence: 90,
          aiGenerated: false,
          warningLevel: 3,
          riskScore: Math.max(...level3Cards.map(card => card.riskScore))
        });
      }
      
      if (level2Cards.length > 0) {
        recommendations.push({
          id: `fallback-${Date.now()}-level2`,
          severity: 'medium',
          actionType: 'meeting',
          message: `CẢNH BÁO KHẨN: ${level2Cards.length} tài liệu sẽ đến hạn trong 3 ngày. Tổ chức họp hàng ngày và gán mentor hỗ trợ.`,
          estimatedImpact: 'medium',
          timeToImplement: '2-3 ngày',
          relatedDocuments: level2Cards.map(card => card.docTypeName),
          aiConfidence: 80,
          aiGenerated: false,
          warningLevel: 2,
          riskScore: Math.max(...level2Cards.map(card => card.riskScore))
        });
      }
      
      if (level1Cards.length > 0) {
        recommendations.push({
          id: `fallback-${Date.now()}-level1`,
          severity: 'low',
          actionType: 'email',
          message: `CẢNH BÁO SỚM: ${level1Cards.length} tài liệu cần chú ý trong 7 ngày tới. Gửi email nhắc nhở và lên lịch review.`,
          estimatedImpact: 'low',
          timeToImplement: '3-5 ngày',
          relatedDocuments: level1Cards.map(card => card.docTypeName),
          aiConfidence: 70,
          aiGenerated: false,
          warningLevel: 1,
          riskScore: Math.max(...level1Cards.map(card => card.riskScore))
        });
      }
    } else {
      // Fallback to original logic if no red cards
      criticalIssues.forEach((issue, index) => {
        if (index >= 3) return; // Giới hạn 3 đề xuất
        
        const severity = issue.overdueDays > 7 ? 'high' : issue.overdueDays > 3 ? 'medium' : 'low';
        const actionType = issue.overdueDays > 7 ? 'escalation' : issue.overdueDays > 3 ? 'meeting' : 'email';
        
        recommendations.push({
          id: `fallback-${Date.now()}-${index}`,
          severity,
          actionType,
          message: `${issue.overdueDays > 7 ? 'Tổ chức họp khẩn cấp' : issue.overdueDays > 3 ? 'Lên lịch họp' : 'Gửi email nhắc nhở'} với ${issue.contractorName} về ${issue.docTypeName} (${issue.approvedCount}/${issue.requiredCount} đã hoàn thành)`,
          estimatedImpact: severity,
          timeToImplement: issue.overdueDays > 7 ? '1 ngày' : '2-3 ngày',
          relatedDocuments: [issue.docTypeName],
          aiConfidence: 60,
          aiGenerated: false
        });
      });
    }
    
    return recommendations;
  }

  // Phương thức để kiểm tra kết nối AI
  async testConnection(configId?: string): Promise<{ success: boolean; message: string }> {
    let config: AIConfig;
    
    if (configId) {
      try {
        const savedConfigs = localStorage.getItem('ai_configs');
        if (savedConfigs) {
          const configs: AIConfig[] = JSON.parse(savedConfigs);
          const foundConfig = configs.find(c => c.id === configId);
          if (!foundConfig) {
            return { success: false, message: 'AI configuration not found' };
          }
          config = foundConfig;
        } else {
          return { success: false, message: 'No AI configurations found' };
        }
      } catch (error) {
        return { success: false, message: 'Failed to load AI configurations' };
      }
    } else {
      config = this.getActiveConfig();
      if (!config) {
        return { success: false, message: 'No active AI configuration' };
      }
    }
    
    if (!config.api_key) {
      return { success: false, message: 'API key is missing' };
    }
    
    try {
      const testPrompt = 'Hello, this is a test message. Please respond with "Test successful".';
      
      if (config.provider === 'GLM') {
        const response = await this.callGLMAPI(testPrompt, config);
        if (response.includes('Test successful')) {
          return { success: true, message: 'GLM API connection successful' };
        } else {
          return { success: false, message: 'Unexpected response from GLM API' };
        }
      } else if (config.provider === 'Gemini') {
        const response = await this.callGeminiAPI(testPrompt, config);
        if (response.includes('Test successful')) {
          return { success: true, message: 'Gemini API connection successful' };
        } else {
          return { success: false, message: 'Unexpected response from Gemini API' };
        }
      } else if (config.provider === 'OpenAI') {
        const response = await this.callOpenAIAPI(testPrompt, config);
        if (response.includes('Test successful')) {
          return { success: true, message: 'OpenAI API connection successful' };
        } else {
          return { success: false, message: 'Unexpected response from OpenAI API' };
        }
      } else {
        return { success: false, message: `Unsupported AI provider: ${config.provider}` };
      }
    } catch (error) {
      console.error('Error testing AI connection:', error);
      return { success: false, message: error.message || 'Connection test failed' };
    }
  }

  // AI Analysis Engine Methods
  
  /**
   * Phân tích nguyên nhân gốc rễ của các vấn đề
   */
  async analyzeRootCauses(issues: CriticalAlertItem[], redCards?: RedCardItem[]): Promise<RootCauseAnalysis> {
    const config = this.getActiveConfig();
    if (!config || !config.api_key) {
      return this.generateFallbackRootCauseAnalysis(issues, redCards);
    }

    try {
      const prompt = this.generateRootCausePrompt(issues, redCards);
      let aiResponse: string;
      
      if (config.provider === 'GLM') {
        aiResponse = await this.callGLMAPI(prompt, config);
      } else if (config.provider === 'Gemini') {
        aiResponse = await this.callGeminiAPI(prompt, config);
      } else if (config.provider === 'OpenAI') {
        aiResponse = await this.callOpenAIAPI(prompt, config);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }

      return this.parseRootCauseResponse(aiResponse);
    } catch (error) {
      console.error('Error analyzing root causes:', error);
      return this.generateFallbackRootCauseAnalysis(issues, redCards);
    }
  }

  /**
   * Nhận diện patterns trong dữ liệu
   */
  async recognizePatterns(historicalData: any[]): Promise<PatternRecognition[]> {
    const config = this.getActiveConfig();
    if (!config || !config.api_key) {
      return this.generateFallbackPatterns(historicalData);
    }

    try {
      const prompt = this.generatePatternPrompt(historicalData);
      let aiResponse: string;
      
      if (config.provider === 'GLM') {
        aiResponse = await this.callGLMAPI(prompt, config);
      } else if (config.provider === 'Gemini') {
        aiResponse = await this.callGeminiAPI(prompt, config);
      } else if (config.provider === 'OpenAI') {
        aiResponse = await this.callOpenAIAPI(prompt, config);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }

      return this.parsePatternResponse(aiResponse);
    } catch (error) {
      console.error('Error recognizing patterns:', error);
      return this.generateFallbackPatterns(historicalData);
    }
  }

  /**
   * Đánh giá tác động của các vấn đề
   */
  async assessImpact(issues: CriticalAlertItem[], context: ProjectContext): Promise<ImpactAssessment> {
    const config = this.getActiveConfig();
    if (!config || !config.api_key) {
      return this.generateFallbackImpactAssessment(issues, context);
    }

    try {
      const prompt = this.generateImpactPrompt(issues, context);
      let aiResponse: string;
      
      if (config.provider === 'GLM') {
        aiResponse = await this.callGLMAPI(prompt, config);
      } else if (config.provider === 'Gemini') {
        aiResponse = await this.callGeminiAPI(prompt, config);
      } else if (config.provider === 'OpenAI') {
        aiResponse = await this.callOpenAIAPI(prompt, config);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }

      return this.parseImpactResponse(aiResponse);
    } catch (error) {
      console.error('Error assessing impact:', error);
      return this.generateFallbackImpactAssessment(issues, context);
    }
  }

  /**
   * Tối ưu hóa nguồn lực
   */
  async optimizeResources(issues: CriticalAlertItem[], availableResources: string[]): Promise<ResourceOptimization> {
    const config = this.getActiveConfig();
    if (!config || !config.api_key) {
      return this.generateFallbackResourceOptimization(issues, availableResources);
    }

    try {
      const prompt = this.generateResourcePrompt(issues, availableResources);
      let aiResponse: string;
      
      if (config.provider === 'GLM') {
        aiResponse = await this.callGLMAPI(prompt, config);
      } else if (config.provider === 'Gemini') {
        aiResponse = await this.callGeminiAPI(prompt, config);
      } else if (config.provider === 'OpenAI') {
        aiResponse = await this.callOpenAIAPI(prompt, config);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }

      return this.parseResourceResponse(aiResponse);
    } catch (error) {
      console.error('Error optimizing resources:', error);
      return this.generateFallbackResourceOptimization(issues, availableResources);
    }
  }

  /**
   * Tính toán điểm ưu tiên cho hành động
   */
  calculateActionPriority(
    rootCause: RootCauseAnalysis,
    impact: ImpactAssessment,
    resources: ResourceOptimization
  ): ActionPriority {
    const urgency = this.calculateUrgency(impact);
    const impactScore = this.calculateImpactScore(impact);
    const effort = this.calculateEffort(resources);
    const risk = this.calculateRisk(rootCause);

    const score = Math.round((urgency * 0.3 + impactScore * 0.3 + (100 - effort) * 0.2 + risk * 0.2));
    
    let level: 'critical' | 'high' | 'medium' | 'low';
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';
    else level = 'low';

    return {
      score,
      factors: {
        urgency,
        impact: impactScore,
        effort,
        risk
      },
      level
    };
  }

  /**
   * Lập kế hoạch timeline cho hành động
   */
  planTimeline(
    actionType: ActionType,
    priority: ActionPriority,
    context: ProjectContext
  ): TimelinePlanning {
    const now = new Date();
    let duration = 1; // days
    let bufferTime = 1; // days

    // Adjust duration based on action type and priority
    switch (actionType) {
      case 'meeting':
        duration = priority.level === 'critical' ? 1 : 2;
        break;
      case 'email':
        duration = 1;
        break;
      case 'escalation':
        duration = priority.level === 'critical' ? 1 : 3;
        break;
      case 'support':
        duration = 5;
        break;
      case 'training':
        duration = 10;
        break;
      case 'audit':
        duration = 7;
        break;
      case 'review':
        duration = 3;
        break;
    }

    // Adjust buffer time based on project context
    if (context.deadlinePressure === 'high') {
      bufferTime = Math.max(1, Math.floor(duration * 0.2));
    } else if (context.deadlinePressure === 'medium') {
      bufferTime = Math.max(1, Math.floor(duration * 0.3));
    } else {
      bufferTime = Math.max(1, Math.floor(duration * 0.5));
    }

    const startDate = new Date(now);
    const endDate = new Date(now.getTime() + (duration + bufferTime) * 24 * 60 * 60 * 1000);

    return {
      startDate,
      endDate,
      milestones: [
        {
          name: 'Bắt đầu hành động',
          date: startDate,
          completed: false
        },
        {
          name: 'Hoàn thành hành động',
          date: endDate,
          completed: false
        }
      ],
      dependencies: [],
      bufferTime
    };
  }

  /**
   * Ước tính xác suất thành công
   */
  estimateSuccessProbability(
    actionType: ActionType,
    priority: ActionPriority,
    resources: ResourceOptimization,
    context: ProjectContext
  ): SuccessProbability {
    const historicalSuccess = this.getHistoricalSuccessRate(actionType);
    const resourceAvailability = resources.allocationEfficiency;
    const stakeholderBuyIn = this.calculateStakeholderBuyIn(context);
    const complexity = this.calculateComplexity(actionType, priority);

    const overall = Math.round(
      historicalSuccess * 0.3 +
      resourceAvailability * 0.3 +
      stakeholderBuyIn * 0.2 +
      (100 - complexity) * 0.2
    );

    const confidence = Math.round(
      (historicalSuccess + resourceAvailability + stakeholderBuyIn) / 3
    );

    return {
      overall,
      factors: {
        historicalSuccess,
        resourceAvailability,
        stakeholderBuyIn,
        complexity
      },
      confidence
    };
  }

  // Helper methods for generating prompts
  private generateRootCausePrompt(issues: CriticalAlertItem[], redCards?: RedCardItem[]): string {
    return `Phân tích nguyên nhân gốc rễ của các vấn đề sau:

CÁC VẤN ĐỀ:
${issues.map((issue, index) => `
${index + 1}. ${issue.docTypeName} - ${issue.contractorName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount}
   - Quá hạn: ${issue.overdueDays} ngày
`).join('')}

${redCards ? `
RED CARDS:
${redCards.map((card, index) => `
${index + 1}. ${card.docTypeName} (Mức ${card.warningLevel})
   - Điểm rủi ro: ${card.riskScore}%
   - Quá hạn: ${card.daysOverdue} ngày
`).join('')}
` : ''}

Hãy phân tích và trả về JSON với định dạng:
{
  "primaryCause": "Nguyên nhân chính",
  "contributingFactors": ["Yếu tố 1", "Yếu tố 2"],
  "patternType": "recurring|isolated|systemic|resource-related",
  "confidence": 85
}`;
  }

  private generatePatternPrompt(historicalData: any[]): string {
    return `Phân tích patterns trong dữ liệu lịch sử sau:

DỮ LIỆU LỊCH SỬ:
${JSON.stringify(historicalData.slice(0, 10), null, 2)}

Hãy nhận diện patterns và trả về JSON với định dạng:
{
  "patterns": [
    {
      "pattern": "Mô tả pattern",
      "frequency": 5,
      "affectedContractors": ["Nhà thầu A", "Nhà thầu B"],
      "affectedDocuments": ["Tài liệu X", "Tài liệu Y"],
      "trend": "improving|stable|deteriorating"
    }
  ]
}`;
  }

  private generateImpactPrompt(issues: CriticalAlertItem[], context: ProjectContext): string {
    return `Đánh giá tác động của các vấn đề sau:

CÁC VẤN ĐỀ:
${issues.map((issue, index) => `
${index + 1}. ${issue.docTypeName} - ${issue.contractorName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount}
   - Quá hạn: ${issue.overdueDays} ngày
`).join('')}

BỐI CẢNH:
- Giai đoạn: ${context.projectPhase}
- Áp lực deadline: ${context.deadlinePressure}
- Hiển thị: ${context.stakeholderVisibility}

Hãy đánh giá và trả về JSON với định dạng:
{
  "projectImpact": "critical|high|medium|low",
  "timelineImpact": 7,
  "costImpact": 15,
  "qualityImpact": "critical|high|medium|low",
  "safetyImpact": "critical|high|medium|low"
}`;
  }

  private generateResourcePrompt(issues: CriticalAlertItem[], availableResources: string[]): string {
    return `Tối ưu hóa nguồn lực cho các vấn đề sau:

CÁC VẤN ĐỀ:
${issues.map((issue, index) => `
${index + 1}. ${issue.docTypeName} - ${issue.contractorName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount}
   - Quá hạn: ${issue.overdueDays} ngày
`).join('')}

NGUỒN LỰC CÓ SẴN:
${availableResources.join(', ')}

Hãy tối ưu hóa và trả về JSON với định dạng:
{
  "recommendedResources": ["Người A", "Công cụ B"],
  "allocationEfficiency": 75,
  "bottlenecks": ["Thiếu nhân sự", "Thiếu công cụ"],
  "optimizationPotential": 20
}`;
  }

  // Helper methods for parsing responses
  private parseRootCauseResponse(response: string): RootCauseAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        primaryCause: parsed.primaryCause || 'Không xác định được nguyên nhân chính',
        contributingFactors: parsed.contributingFactors || [],
        patternType: parsed.patternType || 'isolated',
        confidence: parsed.confidence || 50
      };
    } catch (error) {
      console.error('Error parsing root cause response:', error);
      return {
        primaryCause: 'Lỗi phân tích',
        contributingFactors: [],
        patternType: 'isolated',
        confidence: 0
      };
    }
  }

  private parsePatternResponse(response: string): PatternRecognition[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.patterns || [];
    } catch (error) {
      console.error('Error parsing pattern response:', error);
      return [];
    }
  }

  private parseImpactResponse(response: string): ImpactAssessment {
    try {
      const parsed = JSON.parse(response);
      return {
        projectImpact: parsed.projectImpact || 'medium',
        timelineImpact: parsed.timelineImpact || 0,
        costImpact: parsed.costImpact || 0,
        qualityImpact: parsed.qualityImpact || 'medium',
        safetyImpact: parsed.safetyImpact || 'medium'
      };
    } catch (error) {
      console.error('Error parsing impact response:', error);
      return {
        projectImpact: 'medium',
        timelineImpact: 0,
        costImpact: 0,
        qualityImpact: 'medium',
        safetyImpact: 'medium'
      };
    }
  }

  private parseResourceResponse(response: string): ResourceOptimization {
    try {
      const parsed = JSON.parse(response);
      return {
        recommendedResources: parsed.recommendedResources || [],
        allocationEfficiency: parsed.allocationEfficiency || 50,
        bottlenecks: parsed.bottlenecks || [],
        optimizationPotential: parsed.optimizationPotential || 0
      };
    } catch (error) {
      console.error('Error parsing resource response:', error);
      return {
        recommendedResources: [],
        allocationEfficiency: 50,
        bottlenecks: [],
        optimizationPotential: 0
      };
    }
  }

  // Helper methods for calculations
  private calculateUrgency(impact: ImpactAssessment): number {
    const urgencyMap = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 30
    };
    return urgencyMap[impact.projectImpact];
  }

  private calculateImpactScore(impact: ImpactAssessment): number {
    const impactMap = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 30
    };
    
    const projectScore = impactMap[impact.projectImpact];
    const timelineScore = Math.min(90, impact.timelineImpact * 10);
    const costScore = Math.min(90, impact.costImpact * 2);
    
    return Math.round((projectScore + timelineScore + costScore) / 3);
  }

  private calculateEffort(resources: ResourceOptimization): number {
    return 100 - resources.allocationEfficiency;
  }

  private calculateRisk(rootCause: RootCauseAnalysis): number {
    const riskMap = {
      'systemic': 90,
      'recurring': 70,
      'resource-related': 50,
      'isolated': 30
    };
    return riskMap[rootCause.patternType];
  }

  private getHistoricalSuccessRate(actionType: ActionType): number {
    // This would typically come from historical data
    const successRates = {
      'meeting': 75,
      'email': 60,
      'escalation': 85,
      'support': 70,
      'training': 80,
      'audit': 65,
      'review': 70
    };
    return successRates[actionType];
  }

  private calculateStakeholderBuyIn(context: ProjectContext): number {
    const visibilityMap = {
      'regulatory': 90,
      'client': 80,
      'internal': 60
    };
    return visibilityMap[context.stakeholderVisibility];
  }

  private calculateComplexity(actionType: ActionType, priority: ActionPriority): number {
    const complexityMap = {
      'meeting': 30,
      'email': 20,
      'escalation': 60,
      'support': 50,
      'training': 70,
      'audit': 80,
      'review': 40
    };
    
    const baseComplexity = complexityMap[actionType];
    const priorityMultiplier = priority.level === 'critical' ? 1.5 : priority.level === 'high' ? 1.2 : 1.0;
    
    return Math.round(baseComplexity * priorityMultiplier);
  }

  // Fallback methods
  private generateFallbackRootCauseAnalysis(issues: CriticalAlertItem[], redCards?: RedCardItem[]): RootCauseAnalysis {
    const overdueCount = issues.filter(i => i.overdueDays > 0).length;
    const highRiskRedCards = redCards?.filter(c => c.warningLevel === 3).length || 0;
    
    let primaryCause = 'Thiếu giám sát và theo dõi';
    let patternType: 'recurring' | 'isolated' | 'systemic' | 'resource-related' = 'isolated';
    
    if (overdueCount > 3) {
      primaryCause = 'Quá tải công việc và thiếu nguồn lực';
      patternType = 'resource-related';
    } else if (highRiskRedCards > 0) {
      primaryCause = 'Quá trình không tuân thủ và thiếu kiểm soát';
      patternType = 'systemic';
    }
    
    return {
      primaryCause,
      contributingFactors: [
        'Thiếu nhân sự giám sát',
        'Quy trình không rõ ràng',
        'Thiếu công cụ hỗ trợ'
      ],
      patternType,
      confidence: 60
    };
  }

  private generateFallbackPatterns(historicalData: any[]): PatternRecognition[] {
    // Simple pattern recognition based on data frequency
    const patterns: PatternRecognition[] = [];
    
    if (historicalData.length > 0) {
      patterns.push({
        pattern: 'Chậm trễ trong việc nộp tài liệu',
        frequency: Math.min(10, historicalData.length),
        affectedContractors: ['Multiple'],
        affectedDocuments: ['Various'],
        trend: 'stable'
      });
    }
    
    return patterns;
  }

  private generateFallbackImpactAssessment(issues: CriticalAlertItem[], context: ProjectContext): ImpactAssessment {
    const overdueCount = issues.filter(i => i.overdueDays > 0).length;
    const totalOverdueDays = issues.reduce((sum, i) => sum + i.overdueDays, 0);
    
    let projectImpact: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (overdueCount > 5 || totalOverdueDays > 30) projectImpact = 'critical';
    else if (overdueCount > 3 || totalOverdueDays > 15) projectImpact = 'high';
    else if (overdueCount > 1 || totalOverdueDays > 7) projectImpact = 'medium';
    else projectImpact = 'low';
    
    return {
      projectImpact,
      timelineImpact: Math.min(30, totalOverdueDays),
      costImpact: Math.round(totalOverdueDays * 0.5),
      qualityImpact: projectImpact === 'critical' ? 'critical' : projectImpact === 'high' ? 'high' : 'medium',
      safetyImpact: 'medium'
    };
  }

  private generateFallbackResourceOptimization(issues: CriticalAlertItem[], availableResources: string[]): ResourceOptimization {
    return {
      recommendedResources: availableResources.slice(0, 3),
      allocationEfficiency: 60,
      bottlenecks: ['Thiếu nhân sự giám sát', 'Quá tải công việc'],
      optimizationPotential: 25
    };
  }
}

export const aiRecommendationService = new AIRecommendationService();