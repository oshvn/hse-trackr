import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SuggestedActionsListProps {
  actions: string[];
  title?: string;
}

export const SuggestedActionsList: React.FC<SuggestedActionsListProps> = ({
  actions,
  title = "Suggested Actions"
}) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Action copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAllActions = async () => {
    const allActions = actions.map((action, index) => `${index + 1}. ${action}`).join('\n\n');
    await copyToClipboard(allActions);
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-amber-800">{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            {actions.length} action{actions.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllActions}
            className="h-6 px-2 text-amber-700 hover:bg-amber-100"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy All
          </Button>
        </div>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white border border-amber-200 rounded-md"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-amber-700">
                  {index + 1}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-900 leading-relaxed">
                  {action}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(action)}
                className="flex-shrink-0 h-6 w-6 p-0 text-amber-600 hover:bg-amber-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-3 pt-3 border-t border-amber-200">
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <CheckCircle className="h-3 w-3" />
          Click copy buttons to save individual actions or copy all at once
        </div>
      </div>
    </Card>
  );
};