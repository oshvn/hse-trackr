import { MeetingAction, WorkflowValidation, ActionType } from '../lib/workflowTypes';

export interface CalendarConfig {
  provider: 'google' | 'outlook';
  config: Record<string, any>;
}

export interface MeetingResult {
  meetingId: string;
  eventId: string;
  status: 'created' | 'updated' | 'cancelled';
  attendees: string[];
  meetingLink?: string;
  calendarLinks: {
    google?: string;
    outlook?: string;
    ics?: string;
  };
  timestamp: Date;
}

export interface AttendeeResponse {
  email: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  respondedAt?: Date;
  comment?: string;
}

export class MeetingWorkflowService {
  private config: CalendarConfig;

  constructor(config: CalendarConfig) {
    this.config = config;
  }

  /**
   * Validate meeting action
   */
  public async validate(action: MeetingAction): Promise<WorkflowValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    if (!action.title || action.title.trim() === '') {
      errors.push('Meeting title is required');
    }

    // Validate attendees
    if (!action.attendees || action.attendees.length === 0) {
      errors.push('Meeting must have at least one attendee');
    } else {
      action.attendees.forEach(email => {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid attendee email: ${email}`);
        }
      });
    }

    // Validate time
    if (!action.startTime) {
      errors.push('Meeting start time is required');
    }
    if (!action.endTime) {
      errors.push('Meeting end time is required');
    }
    if (action.startTime && action.endTime && action.startTime >= action.endTime) {
      errors.push('Meeting end time must be after start time');
    }

    // Validate meeting duration
    if (action.startTime && action.endTime) {
      const duration = action.endTime.getTime() - action.startTime.getTime();
      const durationHours = duration / (1000 * 60 * 60);
      if (durationHours > 8) {
        warnings.push('Meeting duration exceeds 8 hours');
      }
      if (durationHours < 0.25) {
        warnings.push('Meeting duration is less than 15 minutes');
      }
    }

    // Validate virtual meeting settings
    if (action.isVirtual && !action.meetingLink) {
      warnings.push('Virtual meeting should have a meeting link');
    }

    // Validate reminders
    if (action.reminders?.enabled && (!action.reminders.times || action.reminders.times.length === 0)) {
      errors.push('Reminder times must be specified when reminders are enabled');
    }

    // Validate materials
    if (action.createMaterials && !action.materials) {
      warnings.push('Meeting materials creation is enabled but no materials specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Execute meeting action
   */
  public async execute(
    action: MeetingAction, 
    progressCallback?: (progress: number) => void
  ): Promise<MeetingResult> {
    progressCallback?.(10);

    try {
      // Create calendar event
      const eventResult = await this.createCalendarEvent(action);
      progressCallback?.(40);

      // Send invitations
      await this.sendInvitations(action, eventResult);
      progressCallback?.(60);

      // Setup reminders
      if (action.reminders?.enabled) {
        await this.setupReminders(action, eventResult);
      }
      progressCallback?.(80);

      // Create meeting materials if needed
      if (action.createMaterials) {
        await this.createMeetingMaterials(action, eventResult);
      }
      progressCallback?.(100);

      return eventResult;

    } catch (error) {
      throw new Error(`Meeting execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create calendar event
   */
  private async createCalendarEvent(action: MeetingAction): Promise<MeetingResult> {
    const eventId = this.generateEventId();
    const meetingId = this.generateMeetingId();

    switch (this.config.provider) {
      case 'google':
        return await this.createGoogleCalendarEvent(action, eventId, meetingId);
      case 'outlook':
        return await this.createOutlookCalendarEvent(action, eventId, meetingId);
      default:
        throw new Error(`Unsupported calendar provider: ${this.config.provider}`);
    }
  }

  /**
   * Create Google Calendar event
   */
  private async createGoogleCalendarEvent(
    action: MeetingAction, 
    eventId: string, 
    meetingId: string
  ): Promise<MeetingResult> {
    // Simulate Google Calendar API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const meetingLink = action.isVirtual ? this.generateMeetingLink() : undefined;

    return {
      meetingId,
      eventId,
      status: 'created',
      attendees: action.attendees,
      meetingLink,
      calendarLinks: {
        google: `https://calendar.google.com/calendar/event?eid=${eventId}`,
        ics: `https://calendar.google.com/calendar/ical/${eventId}.ics`
      },
      timestamp: new Date()
    };
  }

  /**
   * Create Outlook Calendar event
   */
  private async createOutlookCalendarEvent(
    action: MeetingAction, 
    eventId: string, 
    meetingId: string
  ): Promise<MeetingResult> {
    // Simulate Outlook API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const meetingLink = action.isVirtual ? this.generateMeetingLink() : undefined;

    return {
      meetingId,
      eventId,
      status: 'created',
      attendees: action.attendees,
      meetingLink,
      calendarLinks: {
        outlook: `https://outlook.office.com/calendar/event/${eventId}`,
        ics: `https://outlook.office.com/calendar/ical/${eventId}.ics`
      },
      timestamp: new Date()
    };
  }

  /**
   * Send meeting invitations
   */
  private async sendInvitations(action: MeetingAction, eventResult: MeetingResult): Promise<void> {
    // Simulate sending invitations
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`Sending invitations for meeting ${eventResult.meetingId}:`, {
      attendees: action.attendees,
      title: action.title,
      startTime: action.startTime,
      endTime: action.endTime,
      location: action.location,
      meetingLink: eventResult.meetingLink
    });
  }

  /**
   * Setup meeting reminders
   */
  private async setupReminders(action: MeetingAction, eventResult: MeetingResult): Promise<void> {
    if (!action.reminders?.enabled || !action.reminders.times) return;

    // Simulate setting up reminders
    for (const reminderTime of action.reminders.times) {
      const reminderDate = new Date(action.startTime.getTime() - (reminderTime * 60 * 1000));
      
      console.log(`Setting reminder for meeting ${eventResult.meetingId}:`, {
        reminderTime: `${reminderTime} minutes before`,
        reminderDate,
        attendees: action.attendees
      });
    }
  }

  /**
   * Create meeting materials
   */
  private async createMeetingMaterials(action: MeetingAction, eventResult: MeetingResult): Promise<void> {
    if (!action.materials) return;

    // Simulate creating meeting materials
    console.log(`Creating materials for meeting ${eventResult.meetingId}:`, action.materials);

    // Create agenda document
    if (action.materials.agenda) {
      await this.createAgendaDocument(eventResult.meetingId, action.materials.agenda);
    }

    // Attach supporting documents
    if (action.materials.documents && action.materials.documents.length > 0) {
      await this.attachSupportingDocuments(eventResult.meetingId, action.materials.documents);
    }
  }

  /**
   * Create agenda document
   */
  private async createAgendaDocument(meetingId: string, agenda: string): Promise<void> {
    // Simulate agenda document creation
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Created agenda document for meeting ${meetingId}`);
  }

  /**
   * Attach supporting documents
   */
  private async attachSupportingDocuments(meetingId: string, documents: string[]): Promise<void> {
    // Simulate document attachment
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Attached ${documents.length} documents to meeting ${meetingId}`);
  }

  /**
   * Update meeting
   */
  public async updateMeeting(
    meetingId: string, 
    updates: Partial<MeetingAction>
  ): Promise<MeetingResult> {
    // Simulate meeting update
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      meetingId,
      eventId: this.generateEventId(),
      status: 'updated',
      attendees: updates.attendees || [],
      calendarLinks: {},
      timestamp: new Date()
    };
  }

  /**
   * Cancel meeting
   */
  public async cancelMeeting(meetingId: string, reason?: string): Promise<MeetingResult> {
    // Simulate meeting cancellation
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`Cancelled meeting ${meetingId}${reason ? ` with reason: ${reason}` : ''}`);

    return {
      meetingId,
      eventId: this.generateEventId(),
      status: 'cancelled',
      attendees: [],
      calendarLinks: {},
      timestamp: new Date()
    };
  }

  /**
   * Get attendee responses
   */
  public async getAttendeeResponses(meetingId: string): Promise<AttendeeResponse[]> {
    // Simulate attendee response retrieval
    return [
      {
        email: 'user1@example.com',
        status: 'accepted',
        respondedAt: new Date()
      },
      {
        email: 'user2@example.com',
        status: 'tentative',
        respondedAt: new Date(),
        comment: 'Might be running 5 minutes late'
      },
      {
        email: 'user3@example.com',
        status: 'needsAction'
      }
    ];
  }

  /**
   * Track attendance
   */
  public async trackAttendance(meetingId: string): Promise<{
    expected: number;
    attended: number;
    absent: number;
    late: number;
    attendees: {
      email: string;
      joinedAt?: Date;
      leftAt?: Date;
      duration?: number;
    }[];
  }> {
    // Simulate attendance tracking
    return {
      expected: 5,
      attended: 4,
      absent: 1,
      late: 1,
      attendees: [
        {
          email: 'user1@example.com',
          joinedAt: new Date(),
          leftAt: new Date(Date.now() + 60 * 60 * 1000),
          duration: 60
        },
        {
          email: 'user2@example.com',
          joinedAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes late
          leftAt: new Date(Date.now() + 65 * 60 * 1000),
          duration: 55
        }
      ]
    };
  }

  /**
   * Generate meeting outcomes report
   */
  public async generateOutcomesReport(meetingId: string): Promise<{
    meetingId: string;
    title: string;
    date: Date;
    attendees: string[];
    decisions: string[];
    actionItems: {
      task: string;
      assignee: string;
      dueDate: Date;
    }[];
    nextSteps: string[];
  }> {
    // Simulate outcomes report generation
    return {
      meetingId,
      title: 'Project Review Meeting',
      date: new Date(),
      attendees: ['user1@example.com', 'user2@example.com'],
      decisions: [
        'Approved Q4 budget',
        'Decided to launch new feature in January'
      ],
      actionItems: [
        {
          task: 'Prepare budget documentation',
          assignee: 'user1@example.com',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ],
      nextSteps: [
        'Schedule follow-up meeting for next week',
        'Send meeting minutes to all attendees'
      ]
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique meeting ID
   */
  private generateMeetingId(): string {
    return `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate meeting link for virtual meetings
   */
  private generateMeetingLink(): string {
    return `https://meet.example.com/room/${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get meeting templates
   */
  public async getMeetingTemplates(): Promise<{
    id: string;
    name: string;
    description: string;
    duration: number; // minutes
    defaultReminders: number[];
    template: Partial<MeetingAction>;
  }[]> {
    return [
      {
        id: 'weekly-standup',
        name: 'Weekly Standup',
        description: 'Weekly team standup meeting',
        duration: 30,
        defaultReminders: [15, 5],
        template: {
          title: 'Weekly Standup - {{team}}',
          description: 'Weekly team synchronization meeting',
          reminders: {
            enabled: true,
            times: [15, 5]
          }
        }
      },
      {
        id: 'project-review',
        name: 'Project Review',
        description: 'Project progress review meeting',
        duration: 60,
        defaultReminders: [60, 15],
        template: {
          title: 'Project Review - {{projectName}}',
          description: 'Review project progress and discuss next steps',
          createMaterials: true,
          reminders: {
            enabled: true,
            times: [60, 15]
          }
        }
      },
      {
        id: 'client-meeting',
        name: 'Client Meeting',
        description: 'Client consultation or presentation',
        duration: 90,
        defaultReminders: [120, 60, 15],
        template: {
          title: 'Client Meeting - {{clientName}}',
          description: 'Meeting with {{clientName}} to discuss {{topic}}',
          isVirtual: true,
          createMaterials: true,
          reminders: {
            enabled: true,
            times: [120, 60, 15]
          }
        }
      }
    ];
  }
}