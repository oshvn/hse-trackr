import { useState, useCallback, useEffect } from 'react';
import { aiRecommendationService } from '@/services/aiRecommendationService';
import type { CriticalAlertItem, RedCardItem } from '@/lib/dashboardHelpers';
import type { AIRecommendation, ProjectContext, AIRecommendationRequest } from '@/services/aiRecommendationService';

export interface UseAIActionsOptions {
  criticalIssues: CriticalAlertItem[];
  redCards?: RedCardItem[];
  context: ProjectContext;
  contractorId?: string;
  contractorName?: string;
}

export function useAIActions({ criticalIssues, redCards, context, contractorId = '', contractorName = '' }: UseAIActionsOptions) {
  const [actions, setActions] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Manual refetch dùng cho nút "regenerate"
  const fetchActions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const request: AIRecommendationRequest = {
        contractorId,
        contractorName,
        criticalIssues,
        redCards,
        context,
      };
      const aiActions = await aiRecommendationService.getRecommendations(request);
      setActions(aiActions);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [contractorId, contractorName, criticalIssues, redCards, context]);

  // Auto-fetch on mount/props change (KHÔNG truyền fetchActions vào dependency, tránh loop)
  useEffect(() => {
    if (criticalIssues && criticalIssues.length > 0) {
      setIsLoading(true);
      setError(null);
      (async () => {
        try {
          const request: AIRecommendationRequest = {
            contractorId,
            contractorName,
            criticalIssues,
            redCards,
            context,
          };
          const aiActions = await aiRecommendationService.getRecommendations(request);
          setActions(aiActions);
        } catch (e: any) {
          setError(e instanceof Error ? e : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      })();
    }
  // Dùng stringify để tránh các object dependency thay đổi shallow gây rerun không mong muốn
  }, [contractorId, contractorName, JSON.stringify(criticalIssues), JSON.stringify(redCards), JSON.stringify(context)]);

  return { actions, fetchActions, isLoading, error };
}
