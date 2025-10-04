// Type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Import serve function with type assertion to avoid TypeScript errors
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CriticalIssue {
  docTypeName: string;
  overdueDays: number;
  approvedCount: number;
  requiredCount: number;
  contractorName: string;
}

interface ProjectContext {
  projectPhase: 'planning' | 'execution' | 'closeout';
  deadlinePressure: 'low' | 'medium' | 'high';
  stakeholderVisibility: 'internal' | 'client' | 'regulatory';
}

interface AIRecommendationRequest {
  contractorId: string;
  contractorName: string;
  criticalIssues: CriticalIssue[];
  context: ProjectContext;
}

interface AIRecommendation {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  actionType: 'meeting' | 'email' | 'escalation' | 'support' | 'training';
  estimatedImpact: 'high' | 'medium' | 'low';
  timeToImplement: string;
  relatedDocuments: string[];
  aiConfidence: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestData: AIRecommendationRequest = await req.json();
    
    // Validate request data
    if (!requestData.contractorId || !requestData.contractorName || !requestData.criticalIssues || !requestData.context) {
      return new Response(JSON.stringify({ error: 'Missing required fields in request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Tạo prompt cho GLM-4.5-Flash
    const prompt = generatePrompt(requestData.criticalIssues, requestData.context, requestData.contractorName);
    
    // Gọi GLM-4.5-Flash API
    const aiResponse = await callGLMAPI(prompt);
    
    // Parse response từ AI
    const recommendations = parseAIResponse(aiResponse, requestData.criticalIssues);
    
    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in AI recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generatePrompt(criticalIssues: CriticalIssue[], context: ProjectContext, contractorName: string): string {
  return `Bạn là một chuyên gia quản lý dự án xây dựng với 20 năm kinh nghiệm. Hãy phân tích các vấn đề sau và đề xuất hành động cụ thể.

NHÀ THẦU: ${contractorName}

CÁC VẤN ĐỀ QUAN TRỌNG:
${criticalIssues.map((issue, index) => `
${index + 1}. ${issue.docTypeName}
   - Trạng thái: ${issue.approvedCount}/${issue.requiredCount} đã được phê duyệt
   - Quá hạn: ${issue.overdueDays} ngày
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

async function callGLMAPI(prompt: string): Promise<any> {
  try {
    const apiKey = Deno.env.get('GLM_API_KEY');
    if (!apiKey || apiKey === 'your-glm-api-key') {
      console.warn('GLM_API_KEY is not configured properly');
      throw new Error('GLM API key is not configured');
    }

    console.log('Calling GLM API with prompt length:', prompt.length);
    
    // Sử dụng GLM-4.5-Flash API từ z.ai
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4.5-flash',
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
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GLM API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from GLM API:', data);
      throw new Error('Invalid response from GLM API');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling GLM API:', error);
    throw error;
  }
}

function parseAIResponse(aiResponse: string, criticalIssues: CriticalIssue[]): AIRecommendation[] {
  console.log('Parsing AI response, length:', aiResponse.length);
  
  try {
    // Thử parse JSON response
    const parsed = JSON.parse(aiResponse);
    
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      console.log(`Successfully parsed ${parsed.recommendations.length} recommendations from AI`);
      
      return parsed.recommendations.map((rec: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        severity: validateSeverity(rec.severity) ? rec.severity : 'medium',
        message: rec.message || 'Hành động được đề xuất',
        actionType: validateActionType(rec.actionType) ? rec.actionType : 'support',
        estimatedImpact: validateSeverity(rec.estimatedImpact) ? rec.estimatedImpact : 'medium',
        timeToImplement: rec.timeToImplement || '1-3 ngày',
        relatedDocuments: criticalIssues.map(issue => issue.docTypeName),
        aiConfidence: typeof rec.aiConfidence === 'number' ? rec.aiConfidence : 75
      }));
    } else {
      console.warn('AI response does not contain valid recommendations array:', parsed);
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw AI response:', aiResponse);
  }
  
  // Fallback nếu parse JSON thất bại
  console.log('Using fallback recommendations due to parsing failure');
  return generateFallbackRecommendations(criticalIssues);
}

// Helper functions to validate enum values
function validateSeverity(value: string): boolean {
  return ['high', 'medium', 'low'].includes(value);
}

function validateActionType(value: string): boolean {
  return ['meeting', 'email', 'escalation', 'support', 'training'].includes(value);
}

function generateFallbackRecommendations(criticalIssues: CriticalIssue[]): AIRecommendation[] {
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
      aiConfidence: 60
    });
  });
  
  return recommendations;
}