import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ActionSuggestion } from '@/lib/dashboardHelpers';
import { aiRecommendationService, type AIRecommendation } from '@/services/aiRecommendationService';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, Users, AlertTriangle, Sparkles, Calendar, Mail, BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/hooks/use-toast';

interface ActionSuggestionsProps {
  suggestions: ActionSuggestion[];
  criticalIssues?: any[]; // Thêm prop cho critical issues
  contractorId?: string; // Thêm prop cho contractor ID
  className?: string;
  onRefresh?: () => void;
}

const severityMeta = {
  high: {
    label: 'High',
    badgeVariant: 'destructive' as const,
    icon: AlertTriangle,
  },
  medium: {
    label: 'Medium',
    badgeVariant: 'secondary' as const,
    icon: TrendingUp,
  },
  low: {
    label: 'Low',
    badgeVariant: 'outline' as const,
    icon: Users,
  },
};

const actionTypeIcons = {
  meeting: Calendar,
  email: Mail,
  escalation: AlertTriangle,
  support: Users,
  training: BookOpen,
};

export const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({ 
  suggestions, 
  criticalIssues = [], 
  contractorId = 'all',
  className, 
  onRefresh 
}) => {
  const [aiSuggestions, setAiSuggestions] = useState<AIRecommendation[]>([]);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const hasSuggestions = suggestions.length > 0 || aiSuggestions.length > 0;
  const allSuggestions = isAIEnabled ? [...suggestions, ...aiSuggestions] : suggestions;

  // Lấy đề xuất từ AI khi được bật
  useEffect(() => {
    if (isAIEnabled && criticalIssues.length > 0) {
      fetchAIRecommendations();
    } else {
      setAiSuggestions([]);
    }
  }, [isAIEnabled, criticalIssues, contractorId]);

  const fetchAIRecommendations = async () => {
    setIsLoadingAI(true);
    try {
      // Check if AI is configured
      const connectionTest = await aiRecommendationService.testConnection();
      if (!connectionTest.success) {
        toast({
          title: "AI Not Configured",
          description: "Please configure AI in Admin Settings first",
          variant: "destructive",
        });
        setIsLoadingAI(false);
        return;
      }
      
      const recommendations = await aiRecommendationService.getRecommendations({
        contractorId,
        contractorName: criticalIssues[0]?.contractorName || 'Unknown',
        criticalIssues,
        context: {
          projectPhase: 'execution',
          deadlinePressure: 'medium',
          stakeholderVisibility: 'client'
        }
      });
      setAiSuggestions(recommendations);
      toast({
        title: "AI Recommendations Loaded",
        description: `Generated ${recommendations.length} AI-powered suggestions`,
      });
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      toast({
        title: "AI Service Error",
        description: "Failed to load AI recommendations, using rule-based suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Recommended Actions</h3>
          <p className="text-sm text-muted-foreground">
            Data-driven follow-ups to unblock critical documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="ai-mode"
              checked={isAIEnabled}
              onCheckedChange={setIsAIEnabled}
            />
            <Label htmlFor="ai-mode" className="text-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Mode
            </Label>
          </div>
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={onRefresh} className="hover:bg-accent">
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      {!hasSuggestions ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear!"
          description="No critical follow-up actions required right now"
          className="py-8 bg-status-success-light/20 rounded-lg"
        />
      ) : isLoadingAI ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Generating AI recommendations...
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {allSuggestions.map(suggestion => {
            const meta = severityMeta[suggestion.severity];
            const Icon = meta.icon;
            const isAI = (suggestion as any).aiGenerated;
            const actionType = (suggestion as any).actionType;
            const ActionIcon = actionType ? actionTypeIcons[actionType] : null;
            const contractorName = (suggestion as any).contractorName || 'Unknown';
            
            return (
              <div key={suggestion.id} className="rounded-lg border p-4 space-y-3 hover:bg-accent/30 transition-colors cursor-default">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', suggestion.severity === 'high' ? 'text-red-600' : suggestion.severity === 'medium' ? 'text-amber-600' : 'text-blue-600')} />
                    <span className="text-sm font-semibold text-foreground">{contractorName}</span>
                    {isAI && (
                      <Badge variant="outline" className="text-xs ml-1">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {ActionIcon && (
                      <ActionIcon className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {suggestion.message}
                </p>
                <div className="flex items-center justify-between">
                  {suggestion.relatedDocuments.length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      Affecting: {suggestion.relatedDocuments.join(', ')}
                    </div>
                  ) : (
                    <div></div>
                  )}
                  {isAI && (suggestion as any).aiConfidence && (
                    <div className="text-xs text-muted-foreground">
                      Confidence: {(suggestion as any).aiConfidence}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
