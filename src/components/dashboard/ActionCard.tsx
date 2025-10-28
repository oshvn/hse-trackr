import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  Square,
  MoreHorizontal,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  Users,
  Mail,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type {
  AIAction,
  ActionFeedback,
  ActionCardProps
} from '@/lib/aiTypes';
import { aiActionExecutor } from '@/services/aiActionExecutor';

export function ActionCard({ 
  action, 
  onExecute, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onFeedback,
  compact = false 
}: ActionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Partial<ActionFeedback>>({
    rating: 3,
    effectiveness: 50,
    wouldRecommend: true,
    actualTimeSpent: 30,
    comments: '',
    suggestions: []
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Get action type icon
  const getActionIcon = () => {
    switch (action.type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'support':
        return <MessageSquare className="h-4 w-4" />;
      case 'escalation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'training':
        return <TrendingUp className="h-4 w-4" />;
      case 'audit':
      case 'review':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (action.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <Pause className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = () => {
    switch (action.priority.level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (action.status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (action.status === 'completed') return 100;
    if (action.status === 'failed' || action.status === 'cancelled') return 0;
    
    const now = new Date();
    const start = new Date(action.timeline.startDate);
    const end = new Date(action.timeline.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  };

  // Handle action execution
  const handleExecute = () => {
    onExecute(action.id);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedback.rating || !feedback.effectiveness) return;
    
    setSubmittingFeedback(true);
    try {
      const completeFeedback: ActionFeedback = {
        actionId: action.id,
        rating: feedback.rating!,
        effectiveness: feedback.effectiveness!,
        comments: feedback.comments || '',
        wouldRecommend: feedback.wouldRecommend || false,
        actualTimeSpent: feedback.actualTimeSpent || 30,
        actualImpact: action.impactAssessment,
        suggestions: feedback.suggestions || [],
        createdAt: new Date()
      };
      
      const success = await aiActionExecutor.submitFeedback(action.id, completeFeedback);
      if (success) {
        onFeedback(action.id, completeFeedback);
        setShowFeedback(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getActionIcon()}
              <div>
                <h4 className="font-medium text-sm">{action.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getPriorityColor()}>
                    {action.priority.level}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor()}>
                    {action.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {action.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={handleExecute}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(action.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {action.status === 'completed' && (
                    <DropdownMenuItem onClick={() => setShowFeedback(true)}>
                      <Star className="h-4 w-4 mr-2" />
                      Add Feedback
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(action.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getActionIcon()}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{action.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor()}>
                {action.priority.level} ({action.priority.score})
              </Badge>
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{action.status.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Start: {formatDate(action.timeline.startDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>End: {formatDate(action.timeline.endDate)}</span>
            </div>
          </div>

          {/* Assignee */}
          {action.assignee && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Assignee: {action.assignee}</span>
            </div>
          )}

          {/* Success Probability */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Success Probability</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(action.successProbability.overall / 20)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {action.successProbability.overall}%
              </span>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Confidence</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${action.aiConfidence}%` }}
                />
              </div>
              <span className="text-sm">{action.aiConfidence}%</span>
            </div>
          </div>

          {/* Related Documents */}
          {action.relatedDocuments.length > 0 && (
            <div>
              <span className="text-sm font-medium">Related Documents:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {action.relatedDocuments.map((doc, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {action.status === 'pending' && (
                <Button onClick={handleExecute} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              )}
              {action.status === 'in_progress' && (
                <Button 
                  onClick={() => onStatusChange(action.id, 'pending')} 
                  size="sm"
                  variant="outline"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {action.status === 'completed' && (
                <Button 
                  onClick={() => setShowFeedback(true)} 
                  size="sm"
                  variant="outline"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add Feedback
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(action.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(action.id, 'cancelled')}>
                  <Square className="h-4 w-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(action.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getActionIcon()}
              <span>{action.title}</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this AI action
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {action.type}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> 
                  <Badge className={`ml-2 ${getPriorityColor()}`}>
                    {action.priority.level} ({action.priority.score})
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className={`ml-2 ${getStatusColor()}`}>
                    {action.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">AI Generated:</span> {action.aiGenerated ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-medium mb-2">Timeline</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Start Date:</span> {formatDate(action.timeline.startDate)}
                </div>
                <div>
                  <span className="font-medium">End Date:</span> {formatDate(action.timeline.endDate)}
                </div>
                <div>
                  <span className="font-medium">Buffer Time:</span> {action.timeline.bufferTime} days
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(action.createdAt)}
                </div>
              </div>
            </div>

            {/* Success Probability */}
            <div>
              <h4 className="font-medium mb-2">Success Probability</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${action.successProbability.overall}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {action.successProbability.overall}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Historical Success:</span> {action.successProbability.factors.historicalSuccess}%
                  </div>
                  <div>
                    <span className="font-medium">Resource Availability:</span> {action.successProbability.factors.resourceAvailability}%
                  </div>
                  <div>
                    <span className="font-medium">Stakeholder Buy-in:</span> {action.successProbability.factors.stakeholderBuyIn}%
                  </div>
                  <div>
                    <span className="font-medium">Complexity:</span> {action.successProbability.factors.complexity}%
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Assessment */}
            <div>
              <h4 className="font-medium mb-2">Impact Assessment</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Project Impact:</span> 
                  <Badge className={`ml-2 ${
                    action.impactAssessment.projectImpact === 'critical' ? 'bg-red-100 text-red-800' :
                    action.impactAssessment.projectImpact === 'high' ? 'bg-orange-100 text-orange-800' :
                    action.impactAssessment.projectImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {action.impactAssessment.projectImpact}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Timeline Impact:</span> {action.impactAssessment.timelineImpact} days
                </div>
                <div>
                  <span className="font-medium">Cost Impact:</span> {action.impactAssessment.costImpact}%
                </div>
                <div>
                  <span className="font-medium">Quality Impact:</span> {action.impactAssessment.qualityImpact}
                </div>
              </div>
            </div>

            {/* Related Items */}
            {(action.relatedDocuments.length > 0 || action.relatedContractors.length > 0) && (
              <div>
                <h4 className="font-medium mb-2">Related Items</h4>
                {action.relatedDocuments.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium">Documents:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {action.relatedDocuments.map((doc, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {action.relatedContractors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Contractors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {action.relatedContractors.map((contractor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {contractor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Action Feedback</DialogTitle>
            <DialogDescription>
              Please provide feedback for this completed action
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center space-x-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= (feedback.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="effectiveness">Effectiveness ({feedback.effectiveness}%)</Label>
              <Slider
                id="effectiveness"
                min={0}
                max={100}
                step={5}
                value={[feedback.effectiveness || 50]}
                onValueChange={(value) => setFeedback(prev => ({ 
                  ...prev, 
                  effectiveness: value[0] 
                }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="timeSpent">Actual Time Spent (minutes)</Label>
              <Slider
                id="timeSpent"
                min={5}
                max={240}
                step={5}
                value={[feedback.actualTimeSpent || 30]}
                onValueChange={(value) => setFeedback(prev => ({ 
                  ...prev, 
                  actualTimeSpent: value[0] 
                }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="wouldRecommend">Would Recommend</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Button
                  variant={feedback.wouldRecommend ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: true }))}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={!feedback.wouldRecommend ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: false }))}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Share your thoughts about this action..."
                value={feedback.comments || ''}
                onChange={(e) => setFeedback(prev => ({ 
                  ...prev, 
                  comments: e.target.value 
                }))}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFeedback(false)}
              disabled={submittingFeedback}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFeedbackSubmit}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}