import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Grid3X3,
  List,
  LayoutGrid,
  Calendar,
  Mail,
  Users,
  MessageSquare,
  TrendingUp,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import type {
  AIAction,
  ActionType,
  AIActionsDashboardState,
  BatchExecutionRequest,
  ActionFilter
} from '@/lib/aiTypes';
import { aiActionExecutor } from '@/services/aiActionExecutor';
import { aiRecommendationService } from '@/services/aiRecommendationService';

interface AIActionsDashboardProps {
  contractorId?: string;
  contractorName?: string;
  initialActions?: AIAction[];
}

export function AIActionsDashboard({ 
  contractorId, 
  contractorName, 
  initialActions = [] 
}: AIActionsDashboardProps) {
  const [state, setState] = useState<AIActionsDashboardState>({
    actions: initialActions,
    filters: {
      types: [],
      priorities: [],
      statuses: [],
      assignees: [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      }
    },
    view: 'list',
    sortBy: 'priority',
    sortOrder: 'desc',
    batchMode: false,
    selectedActions: []
  });

  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load actions from localStorage on mount
  useEffect(() => {
    const loadActions = () => {
      try {
        const storedActions = JSON.parse(localStorage.getItem('ai_actions') || '[]');
        setState(prev => ({
          ...prev,
          actions: storedActions
        }));
      } catch (error) {
        console.error('Error loading actions:', error);
      }
    };

    loadActions();
    
    // Set up periodic refresh
    const interval = setInterval(loadActions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter actions based on current filters
  const filteredActions = state.actions.filter(action => {
    // Type filter
    if (state.filters.types.length > 0 && !state.filters.types.includes(action.type)) {
      return false;
    }

    // Priority filter
    if (state.filters.priorities.length > 0 && !state.filters.priorities.includes(action.priority.level)) {
      return false;
    }

    // Status filter
    if (state.filters.statuses.length > 0 && !state.filters.statuses.includes(action.status)) {
      return false;
    }

    // Assignee filter
    if (state.filters.assignees.length > 0 && 
        action.assignee && 
        !state.filters.assignees.includes(action.assignee)) {
      return false;
    }

    // Date range filter
    const actionDate = new Date(action.createdAt);
    if (actionDate < state.filters.dateRange.start || actionDate > state.filters.dateRange.end) {
      return false;
    }

    // Search filter
    if (searchTerm && !action.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !action.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort actions
  const sortedActions = [...filteredActions].sort((a, b) => {
    let comparison = 0;

    switch (state.sortBy) {
      case 'priority':
        comparison = b.priority.score - a.priority.score;
        break;
      case 'date':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }

    return state.sortOrder === 'asc' ? comparison : -comparison;
  });

  // Get unique values for filters
  const uniqueTypes = Array.from(new Set(state.actions.map(a => a.type)));
  const uniquePriorities = Array.from(new Set(state.actions.map(a => a.priority.level)));
  const uniqueStatuses = Array.from(new Set(state.actions.map(a => a.status)));
  const uniqueAssignees = Array.from(new Set(state.actions.map(a => a.assignee).filter(Boolean)));

  // Handle action selection
  const handleActionSelection = (actionId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedActions: selected
        ? [...prev.selectedActions, actionId]
        : prev.selectedActions.filter(id => id !== actionId)
    }));
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedActions: selected ? sortedActions.map(a => a.id) : []
    }));
  };

  // Execute single action
  const handleExecuteAction = async (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (!action) return;

    setExecuting(true);
    try {
      const result = await aiActionExecutor.executeAction(action);
      
      // Update action status
      setState(prev => ({
        ...prev,
        actions: prev.actions.map(a => 
          a.id === actionId 
            ? { ...a, status: result.success ? 'completed' : 'failed' }
            : a
        )
      }));

      // Show notification
      if (result.success) {
        console.log(`Action ${actionId} executed successfully`);
      } else {
        console.error(`Action ${actionId} failed:`, result.error);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setExecuting(false);
    }
  };

  // Execute batch actions
  const handleExecuteBatch = async () => {
    if (state.selectedActions.length === 0) return;

    setExecuting(true);
    try {
      const batchRequest: BatchExecutionRequest = {
        actionIds: state.selectedActions,
        executionMode: 'parallel',
        failureMode: 'continue_on_error'
      };

      const result = await aiActionExecutor.executeBatch(batchRequest);
      
      // Update actions status
      setState(prev => ({
        ...prev,
        actions: prev.actions.map(action => {
          const executionResult = result.results.find(r => r.actionId === action.id);
          if (executionResult) {
            return {
              ...action,
              status: executionResult.success ? 'completed' : 'failed'
            };
          }
          return action;
        }),
        selectedActions: []
      }));

      console.log(`Batch execution completed: ${result.successful}/${result.totalActions} successful`);
    } catch (error) {
      console.error('Error executing batch:', error);
    } finally {
      setExecuting(false);
    }
  };

  // Get action type icon
  const getActionIcon = (type: ActionType) => {
    switch (type) {
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
  const getStatusIcon = (status: AIAction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
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
  const getPriorityColor = (level: string) => {
    switch (level) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Actions Dashboard</h2>
          <p className="text-muted-foreground">
            {contractorName ? `Actions for ${contractorName}` : 'All AI Actions'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dataStr = JSON.stringify(state.actions, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = 'ai-actions.json';
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.actions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {state.actions.filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {state.actions.filter(a => a.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {state.actions.filter(a => a.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters & Controls</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={state.view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, view: 'list' }))}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={state.view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, view: 'grid' }))}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={state.view === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, view: 'kanban' }))}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select
                value={state.sortBy}
                onValueChange={(value) => setState(prev => ({ 
                  ...prev, 
                  sortBy: value as any 
                }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={state.sortOrder}
                onValueChange={(value) => setState(prev => ({ 
                  ...prev, 
                  sortOrder: value as 'asc' | 'desc' 
                }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={state.filters.types.includes(type)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              types: checked
                                ? [...prev.filters.types, type]
                                : prev.filters.types.filter(t => t !== type)
                            }
                          }));
                        }}
                      />
                      <label htmlFor={`type-${type}`} className="text-sm flex items-center">
                        {getActionIcon(type)}
                        <span className="ml-2">{type}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <div className="space-y-2">
                  {uniquePriorities.map(priority => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={state.filters.priorities.includes(priority)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              priorities: checked
                                ? [...prev.filters.priorities, priority]
                                : prev.filters.priorities.filter(p => p !== priority)
                            }
                          }));
                        }}
                      />
                      <label htmlFor={`priority-${priority}`} className="text-sm">
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="space-y-2">
                  {uniqueStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={state.filters.statuses.includes(status)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              statuses: checked
                                ? [...prev.filters.statuses, status]
                                : prev.filters.statuses.filter(s => s !== status)
                            }
                          }));
                        }}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm flex items-center">
                        {getStatusIcon(status)}
                        <span className="ml-2">{status}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Assignee</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueAssignees.map(assignee => (
                    <div key={assignee} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assignee-${assignee}`}
                        checked={state.filters.assignees.includes(assignee)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              assignees: checked
                                ? [...prev.filters.assignees, assignee]
                                : prev.filters.assignees.filter(a => a !== assignee)
                            }
                          }));
                        }}
                      />
                      <label htmlFor={`assignee-${assignee}`} className="text-sm">
                        {assignee}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Batch Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  id="select-all"
                  checked={state.selectedActions.length === sortedActions.length && sortedActions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All ({state.selectedActions.length} selected)
                </label>
                <Button
                  variant={state.batchMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, batchMode: !prev.batchMode }))}
                >
                  Batch Mode
                </Button>
              </div>
              {state.batchMode && state.selectedActions.length > 0 && (
                <Button
                  onClick={handleExecuteBatch}
                  disabled={executing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Selected ({state.selectedActions.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List/Grid */}
      <ScrollArea className="h-[600px]">
        {sortedActions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No actions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or create new actions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={
            state.view === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : state.view === 'kanban'
              ? 'grid grid-cols-1 md:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {state.view === 'kanban' ? (
              // Kanban view by status
              (['pending', 'in_progress', 'completed', 'failed'] as const).map(status => (
                <Card key={status} className="h-fit">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      {getStatusIcon(status)}
                      <span className="ml-2 capitalize">{status}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {sortedActions.filter(a => a.status === status).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sortedActions
                      .filter(action => action.status === status)
                      .map(action => (
                        <div
                          key={action.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            state.selectedActions.includes(action.id) ? 'bg-muted border-primary' : ''
                          }`}
                          onClick={() => {
                            if (state.batchMode) {
                              handleActionSelection(action.id, !state.selectedActions.includes(action.id));
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(action.type)}
                              <Badge className={getPriorityColor(action.priority.level)}>
                                {action.priority.level}
                              </Badge>
                            </div>
                            {state.batchMode && (
                              <Checkbox
                                checked={state.selectedActions.includes(action.id)}
                                onCheckedChange={(checked) => 
                                  handleActionSelection(action.id, checked as boolean)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                          <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {action.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(action.createdAt).toLocaleDateString()}
                            </span>
                            {action.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExecuteAction(action.id);
                                }}
                                disabled={executing}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))
            ) : state.view === 'grid' ? (
              // Grid view
              sortedActions.map(action => (
                <Card
                  key={action.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    state.selectedActions.includes(action.id) ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => {
                    if (state.batchMode) {
                      handleActionSelection(action.id, !state.selectedActions.includes(action.id));
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(action.type)}
                        <Badge className={getPriorityColor(action.priority.level)}>
                          {action.priority.level}
                        </Badge>
                      </div>
                      {state.batchMode && (
                        <Checkbox
                          checked={state.selectedActions.includes(action.id)}
                          onCheckedChange={(checked) => 
                            handleActionSelection(action.id, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-medium mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(action.status)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {action.status}
                        </span>
                      </div>
                      {action.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteAction(action.id);
                          }}
                          disabled={executing}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // List view
              sortedActions.map(action => (
                <Card
                  key={action.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    state.selectedActions.includes(action.id) ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => {
                    if (state.batchMode) {
                      handleActionSelection(action.id, !state.selectedActions.includes(action.id));
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {state.batchMode && (
                          <Checkbox
                            checked={state.selectedActions.includes(action.id)}
                            onCheckedChange={(checked) => 
                              handleActionSelection(action.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {getActionIcon(action.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{action.title}</h3>
                            <Badge className={getPriorityColor(action.priority.level)}>
                              {action.priority.level}
                            </Badge>
                            <Badge variant="outline">
                              Score: {action.priority.score}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {action.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(action.status)}
                              <span className="capitalize">{action.status}</span>
                            </div>
                            <span>Created: {new Date(action.createdAt).toLocaleDateString()}</span>
                            {action.assignee && <span>Assignee: {action.assignee}</span>}
                            <span>Confidence: {action.aiConfidence}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {action.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteAction(action.id);
                            }}
                            disabled={executing}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open action details modal
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}