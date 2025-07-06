interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // In a real implementation, you would integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    
    console.log('Email would be sent:', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + '...',
    });

    // For now, just log the email. In production, replace with actual email service
    // Example with SendGrid:
    // const msg = {
    //   to: options.to,
    //   from: 'noreply@vaultspace.com',
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // };
    // await sgMail.send(msg);
  }

  generateInvitationEmail(
    inviterName: string,
    dataRoomName: string,
    invitationLink: string
  ): EmailTemplate {
    const subject = `You've been invited to access ${dataRoomName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Data Room Invitation</h2>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to access the data room <strong>${dataRoomName}</strong>.</p>
        <p>Click the link below to accept the invitation and gain access:</p>
        <p style="margin: 20px 0;">
          <a href="${invitationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by VaultSpace. If you believe you received this email in error, please ignore it.
        </p>
      </div>
    `;
    const text = `You've been invited to access ${dataRoomName} by ${inviterName}. Click this link to accept: ${invitationLink}`;

    return { subject, html, text };
  }

  generateQuestionNotificationEmail(
    questionAuthor: string,
    question: string,
    dataRoomName: string,
    questionLink: string
  ): EmailTemplate {
    const subject = `New question in ${dataRoomName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Q&A Question</h2>
        <p>A new question has been posted in <strong>${dataRoomName}</strong>:</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-style: italic;">"${question}"</p>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">— ${questionAuthor}</p>
        </div>
        <p>
          <a href="${questionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View & Answer Question
          </a>
        </p>
      </div>
    `;
    const text = `New question in ${dataRoomName} by ${questionAuthor}: "${question}". View at: ${questionLink}`;

    return { subject, html, text };
  }

  generateSecurityAlertEmail(
    userName: string,
    action: string,
    details: string,
    timestamp: Date
  ): EmailTemplate {
    const subject = `Security Alert: ${action}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Security Alert</h2>
        <p>A security-related action has occurred on your account:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <p><strong>Action:</strong> ${action}</p>
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Time:</strong> ${timestamp.toISOString()}</p>
          <p><strong>Details:</strong> ${details}</p>
        </div>
        <p>If this action was not authorized by you, please contact your administrator immediately.</p>
      </div>
    `;
    const text = `Security Alert: ${action} by ${userName} at ${timestamp.toISOString()}. Details: ${details}`;

    return { subject, html, text };
  }

  generateFileShareEmail(
    senderName: string,
    fileName: string,
    recipientName: string,
    shareUrl: string,
    message?: string
  ): EmailTemplate {
    const subject = `${senderName} shared a file with you: ${fileName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">File Shared</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${senderName}</strong> has shared a file with you:</p>
        
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1f2937;">${fileName}</h3>
        </div>
        
        ${message ? `
          <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${message}"</p>
          </div>
        ` : ''}
        
        <p style="margin: 20px 0;">
          <a href="${shareUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View File
          </a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          This link may have viewing limits or expiration. If you have any questions, please contact ${senderName}.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by VaultSpace. If you believe you received this email in error, please ignore it.
        </p>
      </div>
    `;
    
    const text = `${senderName} shared a file with you: ${fileName}. ${message ? `Message: "${message}". ` : ''}View the file at: ${shareUrl}`;

    return { subject, html, text };
  }
}

export const emailService = EmailService.getInstance();
