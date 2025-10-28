import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Input } from '../ui/input';
import { WorkflowEngine } from '../../services/workflowEngine';
import {
  WorkflowExecution,
  WorkflowStats,
  WorkflowFilter,
  ActionType,
  ActionStatus,
  Priority
} from '../../lib/workflowTypes';
// import { ActionExecutionModal } from './ActionExecutionModal'; // TODO: implement
import { 
  Mail, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Bell, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2,
  Filter,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface WorkflowDashboardProps {
  workflowEngine: WorkflowEngine;
}

export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ 
  workflowEngine 
}) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [filter, setFilter] = useState<WorkflowFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    loadData();
    
    // Set up event listeners
    workflowEngine.on('execution:created', handleExecutionUpdate);
    workflowEngine.on('execution:updated', handleExecutionUpdate);
    workflowEngine.on('execution:completed', handleExecutionUpdate);
    workflowEngine.on('execution:failed', handleExecutionUpdate);
    workflowEngine.on('execution:cancelled', handleExecutionUpdate);

    return () => {
      workflowEngine.off('execution:created', handleExecutionUpdate);
      workflowEngine.off('execution:updated', handleExecutionUpdate);
      workflowEngine.off('execution:completed', handleExecutionUpdate);
      workflowEngine.off('execution:failed', handleExecutionUpdate);
      workflowEngine.off('execution:cancelled', handleExecutionUpdate);
    };
  }, [workflowEngine]);

  useEffect(() => {
    const filteredExecutions = workflowEngine.getExecutions(filter);
    const searchedExecutions = searchTerm 
      ? filteredExecutions.filter(exec => 
          exec.action.type.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          exec.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filteredExecutions;
    
    setExecutions(searchedExecutions);
  }, [filter, searchTerm, workflowEngine]);

  const loadData = () => {
    setStats(workflowEngine.getStats());
    setExecutions(workflowEngine.getExecutions());
  };

  const handleExecutionUpdate = (execution: WorkflowExecution) => {
    setExecutions(prev => 
      prev.map(exec => exec.id === execution.id ? execution : exec)
    );
    setStats(workflowEngine.getStats());
  };

  const handleCancelExecution = async (executionId: string) => {
    const success = workflowEngine.cancelExecution(executionId);
    if (success) {
      loadData();
    }
  };

  const handleRetryExecution = async (executionId: string) => {
    const success = await workflowEngine.retryExecution(executionId);
    if (success) {
      loadData();
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case ActionType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ActionType.MEETING:
        return <Calendar className="h-4 w-4" />;
      case ActionType.TASK:
        return <CheckSquare className="h-4 w-4" />;
      case ActionType.DOCUMENT:
        return <FileText className="h-4 w-4" />;
      case ActionType.NOTIFICATION:
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ActionStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case ActionStatus.RUNNING:
        return <Play className="h-4 w-4 text-blue-500" />;
      case ActionStatus.PENDING:
      case ActionStatus.SCHEDULED:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return 'default';
      case ActionStatus.FAILED:
        return 'destructive';
      case ActionStatus.RUNNING:
        return 'secondary';
      case ActionStatus.PENDING:
        return 'outline';
      case ActionStatus.SCHEDULED:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return 'text-red-600';
      case Priority.HIGH:
        return 'text-orange-600';
      case Priority.MEDIUM:
        return 'text-yellow-600';
      case Priority.LOW:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.running || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageExecutionTime ? formatDuration(stats.averageExecutionTime) : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsActionModalOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          
          <Select
            value={filter.type || ''}
            onValueChange={(value) => setFilter(prev => ({ 
              ...prev, 
              type: value as ActionType || undefined 
            }))}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value={ActionType.EMAIL}>Email</SelectItem>
              <SelectItem value={ActionType.MEETING}>Meeting</SelectItem>
              <SelectItem value={ActionType.TASK}>Task</SelectItem>
              <SelectItem value={ActionType.DOCUMENT}>Document</SelectItem>
              <SelectItem value={ActionType.NOTIFICATION}>Notification</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.status || ''}
            onValueChange={(value) => setFilter(prev => ({ 
              ...prev, 
              status: value as ActionStatus || undefined 
            }))}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value={ActionStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ActionStatus.RUNNING}>Running</SelectItem>
              <SelectItem value={ActionStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={ActionStatus.FAILED}>Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Executions</CardTitle>
          <CardDescription>
            Monitor and manage your workflow executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No workflow executions found
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <TableRow 
                    key={execution.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedExecution(execution)}
                  >
                    <TableCell className="font-mono text-xs">
                      {execution.id.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(execution.action.type)}
                        <span className="capitalize">{execution.action.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        <Badge variant={getStatusBadgeVariant(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={execution.progress} className="w-16" />
                        <span className="text-xs">{execution.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {execution.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {execution.startedAt && execution.completedAt
                        ? formatDuration(
                            execution.completedAt.getTime() - execution.startedAt.getTime()
                          )
                        : execution.startedAt
                        ? formatDuration(Date.now() - execution.startedAt.getTime())
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {execution.status === ActionStatus.PENDING && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelExecution(execution.id);
                            }}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {execution.status === ActionStatus.FAILED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryExecution(execution.id);
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Execution Modal */}
      {/* <ActionExecutionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        workflowEngine={workflowEngine}
        onActionExecuted={loadData}
      /> */}

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getActionIcon(selectedExecution.action.type)}
                    <span className="capitalize">{selectedExecution.action.type} Workflow</span>
                  </CardTitle>
                  <CardDescription>
                    ID: {selectedExecution.id}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExecution(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedExecution.status)}
                    <Badge variant={getStatusBadgeVariant(selectedExecution.status)}>
                      {selectedExecution.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Progress</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={selectedExecution.progress} className="w-24" />
                    <span className="text-sm">{selectedExecution.progress}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm mt-1">{selectedExecution.createdAt.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Updated</label>
                  <p className="text-sm mt-1">{selectedExecution.updatedAt.toLocaleString()}</p>
                </div>
                {selectedExecution.startedAt && (
                  <div>
                    <label className="text-sm font-medium">Started</label>
                    <p className="text-sm mt-1">{selectedExecution.startedAt.toLocaleString()}</p>
                  </div>
                )}
                {selectedExecution.completedAt && (
                  <div>
                    <label className="text-sm font-medium">Completed</label>
                    <p className="text-sm mt-1">{selectedExecution.completedAt.toLocaleString()}</p>
                  </div>
                )}
                {selectedExecution.scheduledAt && (
                  <div>
                    <label className="text-sm font-medium">Scheduled</label>
                    <p className="text-sm mt-1">{selectedExecution.scheduledAt.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedExecution.errorMessage && (
                <div>
                  <label className="text-sm font-medium">Error Message</label>
                  <p className="text-sm mt-1 text-red-600">{selectedExecution.errorMessage}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Action Details</label>
                <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(selectedExecution.action, null, 2)}
                </pre>
              </div>

              {selectedExecution.result && (
                <div>
                  <label className="text-sm font-medium">Result</label>
                  <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedExecution.result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};