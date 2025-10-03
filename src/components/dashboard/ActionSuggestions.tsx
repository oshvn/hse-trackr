import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ActionSuggestion } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ActionSuggestionsProps {
  suggestions: ActionSuggestion[];
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

export const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({ suggestions, className, onRefresh }) => {
  const hasSuggestions = suggestions.length > 0;

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Recommended Actions</h3>
          <p className="text-sm text-muted-foreground">
            Data-driven follow-ups to unblock critical documents
          </p>
        </div>
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} className="hover:bg-accent">
            Refresh suggestions
          </Button>
        ) : null}
      </div>

      {!hasSuggestions ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear!"
          description="No critical follow-up actions required right now"
          className="py-8 bg-status-success-light/20 rounded-lg"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {suggestions.map(suggestion => {
            const meta = severityMeta[suggestion.severity];
            const Icon = meta.icon;
            return (
              <div key={suggestion.id} className="rounded-lg border p-4 space-y-3 hover:bg-accent/30 transition-colors cursor-default">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', suggestion.severity === 'high' ? 'text-red-600' : suggestion.severity === 'medium' ? 'text-amber-600' : 'text-blue-600')} />
                    <span className="text-sm font-semibold text-foreground">{suggestion.contractorName}</span>
                  </div>
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {suggestion.message}
                </p>
                {suggestion.relatedDocuments.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Affecting: {suggestion.relatedDocuments.join(', ')}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
