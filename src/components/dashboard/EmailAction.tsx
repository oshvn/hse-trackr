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
  Mail, 
  Send, 
  Users, 
  Paperclip, 
  Eye, 
  Clock, 
  Edit,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EmailAction } from '@/lib/aiTypes';

interface EmailActionComponentProps {
  action: EmailAction;
  onSave?: (action: EmailAction) => void;
  onExecute?: (action: EmailAction) => void;
  readOnly?: boolean;
}

export function EmailActionComponent({ 
  action, 
  onSave, 
  onExecute, 
  readOnly = false 
}: EmailActionComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAction, setEditedAction] = useState<EmailAction>(action);
  const [newRecipient, setNewRecipient] = useState('');
  const [newCc, setNewCc] = useState('');
  const [newAttachment, setNewAttachment] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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

  const addRecipient = () => {
    if (newRecipient.trim() && isValidEmail(newRecipient.trim())) {
      setEditedAction(prev => ({
        ...prev,
        emailDetails: {
          ...prev.emailDetails,
          recipients: [...prev.emailDetails.recipients, newRecipient.trim()]
        }
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      emailDetails: {
        ...prev.emailDetails,
        recipients: prev.emailDetails.recipients.filter((_, i) => i !== index)
      }
    }));
  };

  const addCc = () => {
    if (newCc.trim() && isValidEmail(newCc.trim())) {
      setEditedAction(prev => ({
        ...prev,
        emailDetails: {
          ...prev.emailDetails,
          cc: [...prev.emailDetails.cc, newCc.trim()]
        }
      }));
      setNewCc('');
    }
  };

  const removeCc = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      emailDetails: {
        ...prev.emailDetails,
        cc: prev.emailDetails.cc.filter((_, i) => i !== index)
      }
    }));
  };

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setEditedAction(prev => ({
        ...prev,
        emailDetails: {
          ...prev.emailDetails,
          attachments: [...prev.emailDetails.attachments, newAttachment.trim()]
        }
      }));
      setNewAttachment('');
    }
  };

  const removeAttachment = (index: number) => {
    setEditedAction(prev => ({
      ...prev,
      emailDetails: {
        ...prev.emailDetails,
        attachments: prev.emailDetails.attachments.filter((_, i) => i !== index)
      }
    }));
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  const getEmailTemplatePreview = () => {
    // This would typically fetch the actual template content
    // For now, we'll use a placeholder
    return {
      subject: editedAction.emailDetails.subject,
      body: `This is a preview of the email template: ${editedAction.emailDetails.template}\n\n` +
             `Dear [Recipient Name],\n\n` +
             `${editedAction.description}\n\n` +
             `Best regards,\n` +
             `[Your Name]`
    };
  };

  if (readOnly) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Email Action</span>
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
              <Label className="text-sm font-medium">Template</Label>
              <Badge variant="outline">{action.emailDetails.template}</Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              <p className="text-sm font-medium">{action.emailDetails.subject}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Recipients ({action.emailDetails.recipients.length})</Label>
            <div className="flex flex-wrap gap-2">
              {action.emailDetails.recipients.map((recipient, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {recipient}
                </Badge>
              ))}
            </div>
          </div>

          {action.emailDetails.cc.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">CC ({action.emailDetails.cc.length})</Label>
              <div className="flex flex-wrap gap-2">
                {action.emailDetails.cc.map((cc, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {cc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {action.emailDetails.attachments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Attachments ({action.emailDetails.attachments.length})</Label>
              <div className="space-y-1">
                {action.emailDetails.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span>{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={action.emailDetails.trackingEnabled} disabled />
              <Label className="text-sm">Email Tracking</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox checked={action.emailDetails.followUpRequired} disabled />
              <Label className="text-sm">Follow-up Required</Label>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Success Probability: {action.successProbability.overall}%
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleExecute} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
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
            <Mail className="h-5 w-5 text-green-600" />
            <span>Email Action</span>
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
                placeholder="Email action title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedAction.description}
                onChange={(e) => setEditedAction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Email action description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select
                  value={editedAction.emailDetails.template}
                  onValueChange={(value) => setEditedAction(prev => ({
                    ...prev,
                    emailDetails: {
                      ...prev.emailDetails,
                      template: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="escalation">Escalation</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editedAction.emailDetails.subject}
                  onChange={(e) => setEditedAction(prev => ({
                    ...prev,
                    emailDetails: {
                      ...prev.emailDetails,
                      subject: e.target.value
                    }
                  }))}
                  placeholder="Email subject"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="space-y-2">
                {editedAction.emailDetails.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={recipient} readOnly className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeRecipient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Add recipient email"
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <Button size="sm" onClick={addRecipient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>CC</Label>
              <div className="space-y-2">
                {editedAction.emailDetails.cc.map((cc, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={cc} readOnly className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCc(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newCc}
                    onChange={(e) => setNewCc(e.target.value)}
                    placeholder="Add CC email"
                    onKeyPress={(e) => e.key === 'Enter' && addCc()}
                  />
                  <Button size="sm" onClick={addCc}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-2">
                {editedAction.emailDetails.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <Input value={attachment} readOnly className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAttachment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newAttachment}
                    onChange={(e) => setNewAttachment(e.target.value)}
                    placeholder="Add attachment name or path"
                    onKeyPress={(e) => e.key === 'Enter' && addAttachment()}
                  />
                  <Button size="sm" onClick={addAttachment}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tracking"
                  checked={editedAction.emailDetails.trackingEnabled}
                  onCheckedChange={(checked) => setEditedAction(prev => ({
                    ...prev,
                    emailDetails: {
                      ...prev.emailDetails,
                      trackingEnabled: checked as boolean
                    }
                  }))}
                />
                <Label htmlFor="tracking">Enable Email Tracking</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUp"
                  checked={editedAction.emailDetails.followUpRequired}
                  onCheckedChange={(checked) => setEditedAction(prev => ({
                    ...prev,
                    emailDetails: {
                      ...prev.emailDetails,
                      followUpRequired: checked as boolean
                    }
                  }))}
                />
                <Label htmlFor="followUp">Follow-up Required</Label>
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
                <Label className="text-sm font-medium">Template</Label>
                <Badge variant="outline">{action.emailDetails.template}</Badge>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm font-medium">{action.emailDetails.subject}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipients ({action.emailDetails.recipients.length})</Label>
              <div className="flex flex-wrap gap-2">
                {action.emailDetails.recipients.map((recipient, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {recipient}
                  </Badge>
                ))}
              </div>
            </div>

            {action.emailDetails.cc.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">CC ({action.emailDetails.cc.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {action.emailDetails.cc.map((cc, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {action.emailDetails.attachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments ({action.emailDetails.attachments.length})</Label>
                <div className="space-y-1">
                  {action.emailDetails.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox checked={action.emailDetails.trackingEnabled} disabled />
                <Label className="text-sm">Email Tracking</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox checked={action.emailDetails.followUpRequired} disabled />
                <Label className="text-sm">Follow-up Required</Label>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Success Probability: {action.successProbability.overall}%
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleExecute} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of the email that will be sent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">From:</Label>
                <p className="text-sm">system@hse-trackr.com</p>
              </div>
              <div>
                <Label className="text-sm font-medium">To:</Label>
                <p className="text-sm">{editedAction.emailDetails.recipients.join(', ')}</p>
              </div>
              {editedAction.emailDetails.cc.length > 0 && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">CC:</Label>
                  <p className="text-sm">{editedAction.emailDetails.cc.join(', ')}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Subject:</Label>
                <p className="text-sm font-medium">{editedAction.emailDetails.subject}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Message Body:</Label>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {getEmailTemplatePreview().body}
                </pre>
              </div>
            </div>

            {editedAction.emailDetails.attachments.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Attachments:</Label>
                <div className="space-y-1">
                  {editedAction.emailDetails.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handleExecute} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}