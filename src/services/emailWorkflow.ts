import { EmailAction, WorkflowValidation, ActionType } from '../lib/workflowTypes';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'aws-ses';
  config: Record<string, any>;
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  recipients: string[];
  timestamp: Date;
  opens?: number;
  clicks?: number;
}

export class EmailWorkflowService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Validate email action
   */
  public async validate(action: EmailAction): Promise<WorkflowValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate recipients
    if (!action.to || action.to.length === 0) {
      errors.push('Email must have at least one recipient');
    } else {
      action.to.forEach(email => {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid email address: ${email}`);
        }
      });
    }

    // Validate CC recipients
    if (action.cc) {
      action.cc.forEach(email => {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid CC email address: ${email}`);
        }
      });
    }

    // Validate BCC recipients
    if (action.bcc) {
      action.bcc.forEach(email => {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid BCC email address: ${email}`);
        }
      });
    }

    // Validate subject
    if (!action.subject || action.subject.trim() === '') {
      errors.push('Email subject is required');
    }

    // Validate template
    if (!action.template || action.template.trim() === '') {
      errors.push('Email template is required');
    }

    // Validate follow-up configuration
    if (action.followUp) {
      if (action.followUp.enabled && (!action.followUp.delay || action.followUp.delay <= 0)) {
        errors.push('Follow-up delay must be greater than 0 when follow-up is enabled');
      }
      if (action.followUp.enabled && !action.followUp.template) {
        errors.push('Follow-up template is required when follow-up is enabled');
      }
    }

    // Warnings
    if (action.to && action.to.length > 50) {
      warnings.push('Sending to more than 50 recipients may impact deliverability');
    }

    if (action.attachments && action.attachments.length > 10) {
      warnings.push('More than 10 attachments may cause delivery issues');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Execute email action
   */
  public async execute(
    action: EmailAction, 
    progressCallback?: (progress: number) => void
  ): Promise<EmailResult> {
    progressCallback?.(10);

    try {
      // Prepare email content
      const emailContent = await this.prepareEmailContent(action);
      progressCallback?.(30);

      // Send email
      const result = await this.sendEmail(action, emailContent);
      progressCallback?.(70);

      // Schedule follow-up if configured
      if (action.followUp?.enabled) {
        await this.scheduleFollowUp(action, result);
      }
      progressCallback?.(90);

      // Setup tracking if enabled
      if (action.trackOpens || action.trackClicks) {
        await this.setupTracking(result.messageId, action);
      }
      progressCallback?.(100);

      return result;

    } catch (error) {
      throw new Error(`Email execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare email content from template
   */
  private async prepareEmailContent(action: EmailAction): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    // In a real implementation, this would use a template engine
    // For now, we'll simulate template processing
    let html = action.template;
    let text = this.htmlToText(action.template);
    let subject = action.subject;

    // Replace template variables
    if (action.templateData) {
      Object.entries(action.templateData).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
        text = text.replace(new RegExp(placeholder, 'g'), String(value));
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    return { html, text, subject };
  }

  /**
   * Send email using configured provider
   */
  private async sendEmail(action: EmailAction, content: any): Promise<EmailResult> {
    const messageId = this.generateMessageId();
    
    switch (this.config.provider) {
      case 'smtp':
        return await this.sendViaSMTP(action, content, messageId);
      case 'sendgrid':
        return await this.sendViaSendGrid(action, content, messageId);
      case 'aws-ses':
        return await this.sendViaSES(action, content, messageId);
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(action: EmailAction, content: any, messageId: string): Promise<EmailResult> {
    // Simulate SMTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      messageId,
      status: 'sent',
      recipients: [...action.to, ...(action.cc || []), ...(action.bcc || [])],
      timestamp: new Date()
    };
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(action: EmailAction, content: any, messageId: string): Promise<EmailResult> {
    // Simulate SendGrid API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      messageId,
      status: 'sent',
      recipients: [...action.to, ...(action.cc || []), ...(action.bcc || [])],
      timestamp: new Date()
    };
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(action: EmailAction, content: any, messageId: string): Promise<EmailResult> {
    // Simulate SES API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      messageId,
      status: 'sent',
      recipients: [...action.to, ...(action.cc || []), ...(action.bcc || [])],
      timestamp: new Date()
    };
  }

  /**
   * Schedule follow-up email
   */
  private async scheduleFollowUp(action: EmailAction, originalResult: EmailResult): Promise<void> {
    if (!action.followUp?.enabled) return;

    const followUpDelay = action.followUp.delay * 60 * 60 * 1000; // Convert hours to milliseconds
    
    setTimeout(async () => {
      try {
        const followUpAction: EmailAction = {
          type: ActionType.EMAIL,
          to: action.to,
          cc: action.cc,
          bcc: action.bcc,
          subject: `Follow-up: ${action.subject}`,
          template: action.followUp!.template,
          templateData: action.templateData,
          trackOpens: action.trackOpens,
          trackClicks: action.trackClicks
        };

        await this.execute(followUpAction);
      } catch (error) {
        console.error('Failed to send follow-up email:', error);
      }
    }, followUpDelay);
  }

  /**
   * Setup email tracking
   */
  private async setupTracking(messageId: string, action: EmailAction): Promise<void> {
    // In a real implementation, this would setup tracking pixels and click tracking
    // For now, we'll simulate the setup
    console.log(`Setting up tracking for email ${messageId}:`, {
      trackOpens: action.trackOpens,
      trackClicks: action.trackClicks
    });
  }

  /**
   * Get email tracking data
   */
  public async getTrackingData(messageId: string): Promise<{
    opens: number;
    clicks: number;
    lastOpened?: Date;
    lastClicked?: Date;
  }> {
    // Simulate tracking data retrieval
    return {
      opens: Math.floor(Math.random() * 10),
      clicks: Math.floor(Math.random() * 5),
      lastOpened: new Date(),
      lastClicked: new Date()
    };
  }

  /**
   * Handle email bounce
   */
  public async handleBounce(messageId: string, bounceData: any): Promise<void> {
    console.log(`Handling bounce for email ${messageId}:`, bounceData);
    
    // In a real implementation, this would:
    // 1. Update the email status in database
    // 2. Remove bounced email from mailing lists
    // 3. Notify administrators
    // 4. Create follow-up actions if needed
  }

  /**
   * Handle email reply
   */
  public async handleReply(messageId: string, replyData: any): Promise<void> {
    console.log(`Handling reply for email ${messageId}:`, replyData);
    
    // In a real implementation, this would:
    // 1. Parse the reply content
    // 2. Update conversation threads
    // 3. Trigger automated responses if configured
    // 4. Notify relevant team members
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .trim();
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get email templates
   */
  public async getTemplates(): Promise<{
    id: string;
    name: string;
    subject: string;
    html: string;
    category: string;
  }[]> {
    // Simulate template retrieval
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to our platform',
        html: '<h1>Welcome {{name}}!</h1><p>Thank you for joining us.</p>',
        category: 'onboarding'
      },
      {
        id: 'meeting-reminder',
        name: 'Meeting Reminder',
        subject: 'Reminder: {{meetingTitle}}',
        html: '<p>This is a reminder for your meeting: {{meetingTitle}}</p><p>Time: {{meetingTime}}</p>',
        category: 'meetings'
      },
      {
        id: 'task-assignment',
        name: 'Task Assignment',
        subject: 'New task assigned: {{taskTitle}}',
        html: '<p>You have been assigned a new task: {{taskTitle}}</p><p>Due date: {{dueDate}}</p>',
        category: 'tasks'
      }
    ];
  }

  /**
   * Get email delivery report
   */
  public async getDeliveryReport(messageId: string): Promise<{
    messageId: string;
    status: 'sent' | 'delivered' | 'bounced' | 'complained';
    deliveredAt?: Date;
    bouncedAt?: Date;
    bounceReason?: string;
    events: {
      type: string;
      timestamp: Date;
      data?: any;
    }[];
  }> {
    // Simulate delivery report
    return {
      messageId,
      status: 'delivered',
      deliveredAt: new Date(),
      events: [
        {
          type: 'processed',
          timestamp: new Date(Date.now() - 5000)
        },
        {
          type: 'delivered',
          timestamp: new Date()
        }
      ]
    };
  }
}