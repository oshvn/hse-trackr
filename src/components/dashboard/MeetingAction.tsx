import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  FileText, 
  Plus,
  X,
  Save,
  Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MeetingAction } from '@/lib/aiTypes';

interface MeetingActionComponentProps {
  action: MeetingAction;
  onSave?: (action: MeetingAction) => void;
  onExecute?: (action: MeetingAction) => void;
  readOnly?: boolean;
}

export function MeetingActionComponent({ 
  action, 
  onSave, 
  onExecute, 
  readOnly = false 
}: MeetingActionComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAction, setEditedAction] = useState<MeetingAction>(action);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [newAttendee, setNewAttendee] = useState('');

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

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setEditedAction(prev => ({
        ...prev,
        meetingDetails: {
          ...prev.meetingDetails,
          agenda: [...prev.meetingDetails.agenda, newAgendaItem.trim()]
        }
      }));
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      meetingDetails: {
        ...prev.meetingDetails,
        agenda: prev.meetingDetails.agenda.filter((_, i) => i !== index)
      }
    }));
  };

  const addAttendee = () => {
    if (newAttendee.trim()) {
      setEditedAction(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), newAttendee.trim()]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      attendees: prev.attendees?.filter((_, i) => i !== index) || []
    }));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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

  if (readOnly) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Meeting Action</span>
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
              <Label className="text-sm font-medium">Date & Time</Label>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(action.timeline.startDate)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(action.meetingDetails.duration)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              <div className="flex items-center space-x-2 text-sm">
                {action.meetingDetails.virtual ? (
                  <Video className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{action.meetingDetails.location}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Meeting Type</Label>
              <Badge variant={action.meetingDetails.virtual ? "secondary" : "default"}>
                {action.meetingDetails.virtual ? 'Virtual' : 'In-Person'}
              </Badge>
            </div>
          </div>

          {action.attendees && action.attendees.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Attendees ({action.attendees.length})</Label>
              <div className="flex flex-wrap gap-2">
                {action.attendees.map((attendee, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {attendee}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {action.meetingDetails.agenda.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agenda</Label>
              <div className="space-y-2">
                {action.meetingDetails.agenda.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm flex-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {action.meetingDetails.requiredPreparation.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Required Preparation</Label>
              <div className="space-y-1">
                {action.meetingDetails.requiredPreparation.map((prep, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{prep}</span>
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
            <Button onClick={handleExecute} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Schedule Meeting
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
            <Users className="h-5 w-5 text-blue-600" />
            <span>Meeting Action</span>
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
                Edit
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
                placeholder="Meeting title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedAction.description}
                onChange={(e) => setEditedAction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editedAction.meetingDetails.duration}
                  onChange={(e) => setEditedAction(prev => ({
                    ...prev,
                    meetingDetails: {
                      ...prev.meetingDetails,
                      duration: parseInt(e.target.value) || 30
                    }
                  }))}
                  min={15}
                  max={480}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editedAction.meetingDetails.location}
                  onChange={(e) => setEditedAction(prev => ({
                    ...prev,
                    meetingDetails: {
                      ...prev.meetingDetails,
                      location: e.target.value
                    }
                  }))}
                  placeholder="Meeting location or virtual link"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="virtual"
                checked={editedAction.meetingDetails.virtual}
                onCheckedChange={(checked) => setEditedAction(prev => ({
                  ...prev,
                  meetingDetails: {
                    ...prev.meetingDetails,
                    virtual: checked as boolean
                  }
                }))}
              />
              <Label htmlFor="virtual">Virtual Meeting</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={editedAction.meetingDetails.recurring}
                onCheckedChange={(checked) => setEditedAction(prev => ({
                  ...prev,
                  meetingDetails: {
                    ...prev.meetingDetails,
                    recurring: checked as boolean
                  }
                }))}
              />
              <Label htmlFor="recurring">Recurring Meeting</Label>
            </div>

            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="space-y-2">
                {editedAction.attendees?.map((attendee, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={attendee} readOnly className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAttendee(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    placeholder="Add attendee email or name"
                    onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                  />
                  <Button size="sm" onClick={addAttendee}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Agenda</Label>
              <div className="space-y-2">
                {editedAction.meetingDetails.agenda.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-sm font-medium mt-2">{index + 1}.</span>
                    <Textarea
                      value={item}
                      onChange={(e) => {
                        const newAgenda = [...editedAction.meetingDetails.agenda];
                        newAgenda[index] = e.target.value;
                        setEditedAction(prev => ({
                          ...prev,
                          meetingDetails: {
                            ...prev.meetingDetails,
                            agenda: newAgenda
                          }
                        }));
                      }}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAgendaItem(index)}
                      className="mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    placeholder="Add agenda item"
                    onKeyPress={(e) => e.key === 'Enter' && addAgendaItem()}
                  />
                  <Button size="sm" onClick={addAgendaItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Required Preparation</Label>
              <Textarea
                value={editedAction.meetingDetails.requiredPreparation.join('\n')}
                onChange={(e) => setEditedAction(prev => ({
                  ...prev,
                  meetingDetails: {
                    ...prev.meetingDetails,
                    requiredPreparation: e.target.value.split('\n').filter(item => item.trim())
                  }
                }))}
                placeholder="List required preparation items (one per line)"
                rows={3}
              />
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
                <Label className="text-sm font-medium">Date & Time</Label>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(action.timeline.startDate)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(action.meetingDetails.duration)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <div className="flex items-center space-x-2 text-sm">
                  {action.meetingDetails.virtual ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{action.meetingDetails.location}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Meeting Type</Label>
                <Badge variant={action.meetingDetails.virtual ? "secondary" : "default"}>
                  {action.meetingDetails.virtual ? 'Virtual' : 'In-Person'}
                </Badge>
              </div>
            </div>

            {action.attendees && action.attendees.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attendees ({action.attendees.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {action.attendees.map((attendee, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {attendee}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {action.meetingDetails.agenda.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agenda</Label>
                <div className="space-y-2">
                  {action.meetingDetails.agenda.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm flex-1">{item}</span>
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
          <Button onClick={handleExecute} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}