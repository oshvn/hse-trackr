import { supabase } from '@/lib/supabase';
import type { CriticalAlertItem } from '@/lib/dashboardHelpers';

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
}

class AIRecommendationService {
  private CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  
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
      const prompt = this.generatePrompt(request.criticalIssues, request.context, request.contractorName);
      
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
      const recommendations = this.parseAIResponse(aiResponse, request.criticalIssues);
      
      // Cache the results
      this.setCache(requestHash, recommendations);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      // Fallback về rule-based recommendations
      return this.generateFallbackRecommendations(request.criticalIssues);
    }
  }

  private generatePrompt(criticalIssues: CriticalAlertItem[], context: ProjectContext, contractorName: string): string {
    return `Bạn là một chuyên gia quản lý dự án xây dựng với 20 năm kinh nghiệm. Hãy phân tích các vấn đề sau và đề xuất hành động cụ thể.

NHÀ THẦU: ${contractorName}

CÁC VẤN ĐỀ QUAN TRỌNG:
${criticalIssues.map((issue, index) => `
${index + 1}. ${issue.docTypeName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount} đã được phê duyệt
   - Quá hạn: ${issue.overdueDays} ngày
   - Đến hạn: ${issue.dueInDays !== null ? `${issue.dueInDays} ngày nữa` : 'Đã quá hạn'}
`).join('')}

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

TRẢ LỜI THEO ĐỊNH DẠNG JSON NHƯ SAU:
{
  "recommendations": [
    {
      "severity": "high",
      "actionType": "meeting",
      "message": "Mô tả chi tiết hành động",
      "estimatedImpact": "high",
      "timeToImplement": "1-2 ngày",
      "aiConfidence": 90
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

  private parseAIResponse(aiResponse: string, criticalIssues: CriticalAlertItem[]): AIRecommendation[] {
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
          aiGenerated: true
        }));
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', aiResponse);
    }
    
    // Fallback nếu parse JSON thất bại
    return this.generateFallbackRecommendations(criticalIssues);
  }

  private generateFallbackRecommendations(criticalIssues: CriticalAlertItem[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    
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
}

export const aiRecommendationService = new AIRecommendationService();