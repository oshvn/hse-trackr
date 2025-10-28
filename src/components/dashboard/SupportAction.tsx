import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  User, 
  Clock, 
  BookOpen, 
  Users, 
  Play,
  Save,
  Edit,
  X,
  Plus,
  Calendar,
  CheckCircle
} from 'lucide-react';
import type { SupportAction } from '@/lib/aiTypes';

interface SupportActionComponentProps {
  action: SupportAction;
  onSave?: (action: SupportAction) => void;
  onExecute?: (action: SupportAction) => void;
  readOnly?: boolean;
}

export function SupportActionComponent({ 
  action, 
  onSave, 
  onExecute, 
  readOnly = false 
}: SupportActionComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAction, setEditedAction] = useState<SupportAction>(action);
  const [newResource, setNewResource] = useState('');

  const handleSave = () => {
    if (onSave) {
      onSave(editedAction);
      setIsEditing(false);
    }
  };

  const handleExecute = () => {
    if (onExecute) {
      onExecute(editedAction);
    }
  };

  const addResource = () => {
    if (newResource.trim()) {
      setEditedAction(prev => ({
        ...prev,
        supportDetails: {
          ...prev.supportDetails,
          resources: [...prev.supportDetails.resources, newResource.trim()]
        }
      }));
      setNewResource('');
    }
  };

  const removeResource = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      supportDetails: {
        ...prev.supportDetails,
        resources: prev.supportDetails.resources.filter((_, i) => i !== index)
      }
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getSupportTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'administrative':
        return 'bg-green-100 text-green-800';
      case 'mentoring':
        return 'bg-purple-100 text-purple-800';
      case 'training':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'basic':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (readOnly) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Support Action</span>
            <Badge variant="outline">{action.priority.level}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
            <p className="text-muted-foreground">{action.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Support Type</Label>
              <Badge className={getSupportTypeColor(action.supportDetails.supportType)}>
                {action.supportDetails.supportType}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Support Level</Label>
              <Badge className={getSupportLevelColor(action.supportDetails.supportLevel)}>
                {action.supportDetails.supportLevel}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{action.supportDetails.duration} days</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(action.timeline.startDate)}</span>
              </div>
            </div>
          </div>

          {action.assignee && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assigned To</Label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{action.assignee}</span>
              </div>
            </div>
          )}

          {action.supportDetails.mentor && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mentor</Label>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{action.supportDetails.mentor}</span>
              </div>
            </div>
          )}

          {action.supportDetails.resources.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resources ({action.supportDetails.resources.length})</Label>
              <div className="space-y-1">
                {action.supportDetails.resources.map((resource, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm p-2 bg-muted/50 rounded">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{resource}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Success Probability: {action.successProbability.overall}%
            </div>
            <Button onClick={handleExecute} className="bg-purple-600 hover:bg-purple-700">
              <Play className="h-4 w-4 mr-2" />
              Deploy Support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Support Action</span>
            <Badge variant="outline">{action.priority.level}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedAction.title}
                onChange={(e) => setEditedAction(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Support action title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedAction.description}
                onChange={(e) => setEditedAction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Support action description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportType">Support Type</Label>
                <Select
                  value={editedAction.supportDetails.supportType}
                  onValueChange={(value) => setEditedAction(prev => ({
                    ...prev,
                    supportDetails: {
                      ...prev.supportDetails,
                      supportType: value as any
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="administrative">Administrative Support</SelectItem>
                    <SelectItem value="mentoring">Mentoring</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportLevel">Support Level</Label>
                <Select
                  value={editedAction.supportDetails.supportLevel}
                  onValueChange={(value) => setEditedAction(prev => ({
                    ...prev,
                    supportDetails: {
                      ...prev.supportDetails,
                      supportLevel: value as any
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editedAction.supportDetails.duration}
                  onChange={(e) => setEditedAction(prev => ({
                    ...prev,
                    supportDetails: {
                      ...prev.supportDetails,
                      duration: parseInt(e.target.value) || 1
                    }
                  }))}
                  min={1}
                  max={90}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={editedAction.assignee || ''}
                  onChange={(e) => setEditedAction(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="Assign to person or team"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mentor">Mentor (Optional)</Label>
                <Input
                  id="mentor"
                  value={editedAction.supportDetails.mentor || ''}
                  onChange={(e) => setEditedAction(prev => ({
                    ...prev,
                    supportDetails: {
                      ...prev.supportDetails,
                      mentor: e.target.value
                    }
                  }))}
                  placeholder="Assign mentor if needed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resources</Label>
              <div className="space-y-2">
                {editedAction.supportDetails.resources.map((resource, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <Input value={resource} readOnly className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeResource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    placeholder="Add resource (document, tool, link, etc.)"
                    onKeyPress={(e) => e.key === 'Enter' && addResource()}
                  />
                  <Button size="sm" onClick={addResource}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-muted-foreground">{action.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Support Type</Label>
                <Badge className={getSupportTypeColor(action.supportDetails.supportType)}>
                  {action.supportDetails.supportType}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Support Level</Label>
                <Badge className={getSupportLevelColor(action.supportDetails.supportLevel)}>
                  {action.supportDetails.supportLevel}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{action.supportDetails.duration} days</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(action.timeline.startDate)}</span>
                </div>
              </div>
            </div>

            {action.assignee && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned To</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{action.assignee}</span>
                </div>
              </div>
            )}

            {action.supportDetails.mentor && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mentor</Label>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{action.supportDetails.mentor}</span>
                </div>
              </div>
            )}

            {action.supportDetails.resources.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Resources ({action.supportDetails.resources.length})</Label>
                <div className="space-y-1">
                  {action.supportDetails.resources.map((resource, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm p-2 bg-muted/50 rounded">
                      <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{resource}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Success Probability: {action.successProbability.overall}%
          </div>
          <Button onClick={handleExecute} className="bg-purple-600 hover:bg-purple-700">
            <Play className="h-4 w-4 mr-2" />
            Deploy Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}