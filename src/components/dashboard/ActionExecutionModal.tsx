import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { WorkflowEngine } from '../../services/workflowEngine';
import { 
  WorkflowAction, 
  ActionType, 
  Priority,
  EmailAction,
  MeetingAction,
  TaskAction,
  DocumentAction,
  NotificationAction
} from '../../lib/workflowTypes';
import { 
  Mail, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  FileText, 
  Bell,
  Plus,
  X,
  CalendarDays,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';

interface ActionExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowEngine: WorkflowEngine;
  onActionExecuted?: () => void;
}

export const ActionExecutionModal: React.FC<ActionExecutionModalProps> = ({
  isOpen,
  onClose,
  workflowEngine,
  onActionExecuted
}) => {
  const [selectedType, setSelectedType] = useState<ActionType>(ActionType.EMAIL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [isScheduled, setIsScheduled] = useState(false);

  // Email action state
  const [emailAction, setEmailAction] = useState<Partial<EmailAction>>({
    type: ActionType.EMAIL,
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    template: '',
    templateData: {},
    attachments: [],
    trackOpens: true,
    trackClicks: true,
    followUp: {
      enabled: false,
      delay: 24,
      template: ''
    }
  });

  // Meeting action state
  const [meetingAction, setMeetingAction] = useState<Partial<MeetingAction>>({
    type: ActionType.MEETING,
    title: '',
    description: '',
    attendees: [],
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    location: '',
    isVirtual: false,
    meetingLink: '',
    reminders: {
      enabled: true,
      times: [60, 15]
    },
    createMaterials: false,
    materials: {
      agenda: '',
      documents: []
    }
  });

  // Task action state
  const [taskAction, setTaskAction] = useState<Partial<TaskAction>>({
    type: ActionType.TASK,
    title: '',
    description: '',
    assignee: '',
    assigneeEmail: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: Priority.MEDIUM,
    project: '',
    tags: [],
    dependencies: [],
    subtasks: []
  });

  // Document action state
  const [documentAction, setDocumentAction] = useState<Partial<DocumentAction>>({
    type: ActionType.DOCUMENT,
    documentId: '',
    action: 'create',
    version: '1.0',
    reviewers: [],
    approvers: [],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: Priority.MEDIUM,
    comments: '',
    metadata: {}
  });

  // Notification action state
  const [notificationAction, setNotificationAction] = useState<Partial<NotificationAction>>({
    type: ActionType.NOTIFICATION,
    recipients: [],
    title: '',
    message: '',
    channels: ['email'],
    priority: Priority.MEDIUM
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let action: WorkflowAction;

      switch (selectedType) {
        case ActionType.EMAIL:
          action = emailAction as EmailAction;
          break;
        case ActionType.MEETING:
          action = meetingAction as MeetingAction;
          break;
        case ActionType.TASK:
          action = taskAction as TaskAction;
          break;
        case ActionType.DOCUMENT:
          action = documentAction as DocumentAction;
          break;
        case ActionType.NOTIFICATION:
          action = notificationAction as NotificationAction;
          break;
        default:
          throw new Error(`Unknown action type: ${selectedType}`);
      }

      await workflowEngine.executeAction(action, isScheduled ? scheduleDate : undefined);
      
      onActionExecuted?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType(ActionType.EMAIL);
    setIsScheduled(false);
    setScheduleDate(undefined);
    
    // Reset all action states
    setEmailAction({
      type: ActionType.EMAIL,
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      template: '',
      templateData: {},
      attachments: [],
      trackOpens: true,
      trackClicks: true,
      followUp: {
        enabled: false,
        delay: 24,
        template: ''
      }
    });
  };

  const addEmailRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
    if (email && !emailAction[field]?.includes(email)) {
      setEmailAction(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), email]
      }));
    }
  };

  const removeEmailRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
    setEmailAction(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(e => e !== email)
    }));
  };

  const addMeetingAttendee = (email: string) => {
    if (email && !meetingAction.attendees?.includes(email)) {
      setMeetingAction(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), email]
      }));
    }
  };

  const removeMeetingAttendee = (email: string) => {
    setMeetingAction(prev => ({
      ...prev,
      attendees: (prev.attendees || []).filter(e => e !== email)
    }));
  };

  const addTaskTag = (tag: string) => {
    if (tag && !taskAction.tags?.includes(tag)) {
      setTaskAction(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTaskTag = (tag: string) => {
    setTaskAction(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const addDocumentReviewer = (email: string) => {
    if (email && !documentAction.reviewers?.includes(email)) {
      setDocumentAction(prev => ({
        ...prev,
        reviewers: [...(prev.reviewers || []), email]
      }));
    }
  };

  const removeDocumentReviewer = (email: string) => {
    setDocumentAction(prev => ({
      ...prev,
      reviewers: (prev.reviewers || []).filter(e => e !== email)
    }));
  };

  const addNotificationRecipient = (email: string) => {
    if (email && !notificationAction.recipients?.includes(email)) {
      setNotificationAction(prev => ({
        ...prev,
        recipients: [...(prev.recipients || []), email]
      }));
    }
  };

  const removeNotificationRecipient = (email: string) => {
    setNotificationAction(prev => ({
      ...prev,
      recipients: (prev.recipients || []).filter(e => e !== email)
    }));
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case ActionType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ActionType.MEETING:
        return <CalendarIcon className="h-4 w-4" />;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon(selectedType)}
            Execute Workflow Action
          </DialogTitle>
          <DialogDescription>
            Create and execute a new workflow action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Type Selection */}
          <div>
            <Label className="text-sm font-medium">Action Type</Label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ActionType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ActionType.EMAIL}>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value={ActionType.MEETING}>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Meeting
                  </div>
                </SelectItem>
                <SelectItem value={ActionType.TASK}>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Task
                  </div>
                </SelectItem>
                <SelectItem value={ActionType.DOCUMENT}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document
                  </div>
                </SelectItem>
                <SelectItem value={ActionType.NOTIFICATION}>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Configuration */}
          <Tabs value={selectedType} className="w-full">
            <TabsContent value={ActionType.EMAIL} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input
                        id="email-subject"
                        value={emailAction.subject || ''}
                        onChange={(e) => setEmailAction(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-template">Template</Label>
                      <Select
                        value={emailAction.template || ''}
                        onValueChange={(value) => setEmailAction(prev => ({ ...prev, template: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome Email</SelectItem>
                          <SelectItem value="meeting-reminder">Meeting Reminder</SelectItem>
                          <SelectItem value="task-assignment">Task Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Recipients (To)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add email address"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addEmailRecipient('to', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add email address"]') as HTMLInputElement;
                          if (input?.value) {
                            addEmailRecipient('to', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {emailAction.to?.map(email => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeEmailRecipient('to', email)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-opens"
                      checked={emailAction.trackOpens}
                      onCheckedChange={(checked) => setEmailAction(prev => ({ ...prev, trackOpens: !!checked }))}
                    />
                    <Label htmlFor="track-opens">Track email opens</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-clicks"
                      checked={emailAction.trackClicks}
                      onCheckedChange={(checked) => setEmailAction(prev => ({ ...prev, trackClicks: !!checked }))}
                    />
                    <Label htmlFor="track-clicks">Track email clicks</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={ActionType.MEETING} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meeting Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meeting-title">Title</Label>
                      <Input
                        id="meeting-title"
                        value={meetingAction.title || ''}
                        onChange={(e) => setMeetingAction(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Meeting title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-location">Location</Label>
                      <Input
                        id="meeting-location"
                        value={meetingAction.location || ''}
                        onChange={(e) => setMeetingAction(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Meeting location"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="meeting-description">Description</Label>
                    <Textarea
                      id="meeting-description"
                      value={meetingAction.description || ''}
                      onChange={(e) => setMeetingAction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Meeting description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {meetingAction.startTime ? format(meetingAction.startTime, 'PPP HH:mm') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={meetingAction.startTime}
                            onSelect={(date) => setMeetingAction(prev => ({ ...prev, startTime: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {meetingAction.endTime ? format(meetingAction.endTime, 'PPP HH:mm') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={meetingAction.endTime}
                            onSelect={(date) => setMeetingAction(prev => ({ ...prev, endTime: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>Attendees</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add attendee email"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addMeetingAttendee(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add attendee email"]') as HTMLInputElement;
                          if (input?.value) {
                            addMeetingAttendee(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {meetingAction.attendees?.map(email => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeMeetingAttendee(email)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-virtual"
                      checked={meetingAction.isVirtual}
                      onCheckedChange={(checked) => setMeetingAction(prev => ({ ...prev, isVirtual: !!checked }))}
                    />
                    <Label htmlFor="is-virtual">Virtual meeting</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={ActionType.TASK} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-title">Title</Label>
                      <Input
                        id="task-title"
                        value={taskAction.title || ''}
                        onChange={(e) => setTaskAction(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-assignee">Assignee</Label>
                      <Input
                        id="task-assignee"
                        value={taskAction.assignee || ''}
                        onChange={(e) => setTaskAction(prev => ({ ...prev, assignee: e.target.value }))}
                        placeholder="Assignee email or ID"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={taskAction.description || ''}
                      onChange={(e) => setTaskAction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="task-project">Project</Label>
                      <Input
                        id="task-project"
                        value={taskAction.project || ''}
                        onChange={(e) => setTaskAction(prev => ({ ...prev, project: e.target.value }))}
                        placeholder="Project name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select
                        value={taskAction.priority || Priority.MEDIUM}
                        onValueChange={(value) => setTaskAction(prev => ({ ...prev, priority: value as Priority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Priority.LOW}>Low</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={Priority.HIGH}>High</SelectItem>
                          <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {taskAction.dueDate ? format(taskAction.dueDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={taskAction.dueDate}
                            onSelect={(date) => setTaskAction(prev => ({ ...prev, dueDate: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addTaskTag(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add tag"]') as HTMLInputElement;
                          if (input?.value) {
                            addTaskTag(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {taskAction.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTaskTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={ActionType.DOCUMENT} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="document-id">Document ID</Label>
                      <Input
                        id="document-id"
                        value={documentAction.documentId || ''}
                        onChange={(e) => setDocumentAction(prev => ({ ...prev, documentId: e.target.value }))}
                        placeholder="Document ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-action">Action</Label>
                      <Select
                        value={documentAction.action || 'create'}
                        onValueChange={(value) => setDocumentAction(prev => ({ ...prev, action: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="archive">Archive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="document-version">Version</Label>
                      <Input
                        id="document-version"
                        value={documentAction.version || ''}
                        onChange={(e) => setDocumentAction(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-priority">Priority</Label>
                      <Select
                        value={documentAction.priority || Priority.MEDIUM}
                        onValueChange={(value) => setDocumentAction(prev => ({ ...prev, priority: value as Priority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Priority.LOW}>Low</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={Priority.HIGH}>High</SelectItem>
                          <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="document-comments">Comments</Label>
                    <Textarea
                      id="document-comments"
                      value={documentAction.comments || ''}
                      onChange={(e) => setDocumentAction(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder="Document comments"
                      rows={3}
                    />
                  </div>

                  {(documentAction.action === 'review' || documentAction.action === 'approve') && (
                    <div>
                      <Label>
                        {documentAction.action === 'review' ? 'Reviewers' : 'Approvers'}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder={`Add ${documentAction.action === 'review' ? 'reviewer' : 'approver'} email`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (documentAction.action === 'review') {
                                addDocumentReviewer(e.currentTarget.value);
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.querySelector(`input[placeholder="Add ${documentAction.action === 'review' ? 'reviewer' : 'approver'} email"]`) as HTMLInputElement;
                            if (input?.value && documentAction.action === 'review') {
                              addDocumentReviewer(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {documentAction.action === 'review' && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {documentAction.reviewers?.map(email => (
                            <Badge key={email} variant="secondary" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {email}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeDocumentReviewer(email)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={ActionType.NOTIFICATION} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="notification-title">Title</Label>
                      <Input
                        id="notification-title"
                        value={notificationAction.title || ''}
                        onChange={(e) => setNotificationAction(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notification-priority">Priority</Label>
                      <Select
                        value={notificationAction.priority || Priority.MEDIUM}
                        onValueChange={(value) => setNotificationAction(prev => ({ ...prev, priority: value as Priority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Priority.LOW}>Low</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={Priority.HIGH}>High</SelectItem>
                          <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notification-message">Message</Label>
                    <Textarea
                      id="notification-message"
                      value={notificationAction.message || ''}
                      onChange={(e) => setNotificationAction(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Notification message"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Channels</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['email', 'sms', 'push', 'in-app'].map(channel => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={notificationAction.channels?.includes(channel as any)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNotificationAction(prev => ({
                                  ...prev,
                                  channels: [...(prev.channels || []), channel as any]
                                }));
                              } else {
                                setNotificationAction(prev => ({
                                  ...prev,
                                  channels: (prev.channels || []).filter(c => c !== channel)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`channel-${channel}`} className="capitalize">
                            {channel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Recipients</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add recipient email"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addNotificationRecipient(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add recipient email"]') as HTMLInputElement;
                          if (input?.value) {
                            addNotificationRecipient(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {notificationAction.recipients?.map(email => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeNotificationRecipient(email)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduling</CardTitle>
              <CardDescription>
                Schedule the action to be executed at a specific time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-action"
                  checked={isScheduled}
                  onCheckedChange={(checked) => setIsScheduled(!!checked)}
                />
                <Label htmlFor="schedule-action">Schedule for later</Label>
              </div>

              {isScheduled && (
                <div className="mt-4">
                  <Label>Schedule Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                        <Clock className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, 'PPP HH:mm') : 'Pick a date and time'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={(date) => setScheduleDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Executing...' : 'Execute Action'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};