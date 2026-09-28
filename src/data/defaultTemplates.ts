import { EmailTemplate } from '../types';
import { generateSvgPlaceholder } from '../utils/placeholderEngine';

const bannerSvg = generateSvgPlaceholder(600, 160, 'Project Operations & Status', 'Sprint 26 Deliverables', {
  bgColor: '#fdf2f8',
  textColor: '#9d174d',
  accentColor: '#e20074',
  icon: 'banner',
});

const logoSvg = generateSvgPlaceholder(180, 50, 'ACME GLOBAL', 'Solutions & Tech', {
  bgColor: '#f8fafc',
  textColor: '#0f172a',
  accentColor: '#e20074',
  icon: 'logo',
});

const meetingBannerSvg = generateSvgPlaceholder(600, 150, 'Strategic Alignment Session', 'Executive Briefing', {
  bgColor: '#f0fdf4',
  textColor: '#166534',
  accentColor: '#16a34a',
  icon: 'banner',
});

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'template-status-update',
    name: 'Weekly Project Status Report',
    category: 'Project Management',
    description: 'Executive status report with banner, progress milestones, action items table, and signoff.',
    subject: 'Project Status: &Project Name& - Sprint &Sprint Number& Progress',
    updatedAt: '2026-09-25',
    bodyHtml: `
      <div style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5;">
        <p style="text-align: center; margin-bottom: 16px;">
          <img src="${bannerSvg}" alt="Project Status Banner" style="max-width: 100%; height: auto; border-radius: 6px;" />
        </p>

        <p>Dear <strong>&Recipient Name&</strong>,</p>

        <p>
          Here is our weekly status summary for <strong>&Project Name&</strong> (Sprint &Sprint Number&) as of <em>&Current Date&</em>.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #e20074; padding: 12px 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0; color: #9d174d; font-size: 12pt;">Key Highlights & Milestones:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Core API integration completed ahead of scheduled timeline.</li>
            <li>Security audit and Outlook HTML styling compliance passed.</li>
            <li>User acceptance testing ongoing with <strong>&Company Name&</strong> stakeholders.</li>
          </ul>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt;" border="1" bordercolor="#cbd5e1" cellpadding="8" cellspacing="0">
          <thead>
            <tr style="background-color: #fdf2f8; color: #9d174d; font-weight: bold; text-align: left;">
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Deliverable</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Owner</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Status</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Target Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">&Document Name& Draft</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">&Sender Name&</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #166534; font-weight: 600;">Completed</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">&Current Date&</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Executive Sign-off</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">&Recipient Name&</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #b45309; font-weight: 600;">Pending Review</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>&Due Date&</strong></td>
            </tr>
          </tbody>
        </table>

        <p>Please reach out if you have any questions or require additional details before <strong>&Due Date&</strong>.</p>

        <div style="margin-top: 24px; border-top: 2px solid #e20074; padding-top: 12px; font-size: 10pt; color: #334155;">
          <strong>&Sender Name&</strong><br/>
          <span style="color: #e20074; font-weight: 600;">&Sender Title&</span> | &Company Name&<br/>
          📞 &Sender Phone&
        </div>
      </div>
    `,
  },
  {
    id: 'template-action-approval',
    name: 'Action Required / Approval Request',
    category: 'Approvals',
    description: 'Direct callout for document sign-off with clear deadlines and CTA button.',
    subject: 'Action Required: Approval needed for &Document Name& by &Due Date&',
    updatedAt: '2026-09-25',
    bodyHtml: `
      <div style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5;">
        <p>Hi <strong>&First Name&</strong>,</p>

        <table style="width: 100%; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin: 16px 0;" cellpadding="12" cellspacing="0">
          <tr>
            <td style="font-family: Calibri, sans-serif; font-size: 11pt; color: #9f1239;">
              <strong style="font-size: 12pt; color: #be123c;">⚠️ Action Required by &Due Date&:</strong><br/>
              Please review and sign off on <strong>&Document Name&</strong> for the <strong>&Project Name&</strong> release.
            </td>
          </tr>
        </table>

        <p>
          The latest draft incorporating feedback from the <strong>&Department&</strong> department is now ready for your final validation.
        </p>

        <table style="margin: 20px auto; text-align: center;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color: #e20074; border-radius: 6px; padding: 12px 28px; text-align: center;">
              <a href="https://example.com" style="font-family: Calibri, sans-serif; font-size: 11pt; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block;">
                Review &Document Name& →
              </a>
            </td>
          </tr>
        </table>

        <p>Thank you for your prompt attention to this delivery!</p>

        <div style="margin-top: 24px; border-top: 2px solid #e20074; padding-top: 12px; font-size: 10pt; color: #334155;">
          <strong>&Sender Name&</strong><br/>
          &Sender Title& | &Company Name&
        </div>
      </div>
    `,
  },
  {
    id: 'template-meeting-invitation',
    name: 'Executive Meeting Invitation & Agenda',
    category: 'Meetings',
    description: 'Formatted calendar meeting invite with meeting card, agenda topics, and RSVP.',
    subject: 'Meeting Invitation: &Meeting Topic& with &Company Name& (&Meeting Date&)',
    updatedAt: '2026-09-25',
    bodyHtml: `
      <div style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5;">
        <p style="text-align: center; margin-bottom: 16px;">
          <img src="${meetingBannerSvg}" alt="Meeting Banner" style="max-width: 100%; height: auto; border-radius: 6px;" />
        </p>

        <p>Dear <strong>&Recipient Name&</strong>,</p>

        <p>
          You are cordially invited to participate in the strategic discussion regarding <strong>&Meeting Topic&</strong>.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 12pt;">📅 Meeting Details:</h4>
          <p style="margin: 0 0 6px 0;"><strong>Topic:</strong> &Meeting Topic&</p>
          <p style="margin: 0 0 6px 0;"><strong>Scheduled Date:</strong> &Meeting Date&</p>
          <p style="margin: 0 0 6px 0;"><strong>Host:</strong> &Sender Name& (&Company Name&)</p>
          <p style="margin: 0;"><strong>Attendee:</strong> &Recipient Name& (&Recipient Email&)</p>
        </div>

        <h4 style="color: #1e293b; margin: 16px 0 8px 0;">Planned Agenda:</h4>
        <ol style="padding-left: 20px; margin: 0 0 16px 0;">
          <li>Review project milestones and sprint &Sprint Number& outcomes.</li>
          <li>Address risk mitigation for &Document Name&.</li>
          <li>Align on deliverables deadline before <strong>&Due Date&</strong>.</li>
        </ol>

        <p>A calendar invitation has also been sent to your inbox. Looking forward to our discussion.</p>

        <div style="margin-top: 24px; border-top: 2px solid #16a34a; padding-top: 12px; font-size: 10pt; color: #334155;">
          <strong>&Sender Name&</strong><br/>
          &Sender Title& | &Company Name&<br/>
          📞 &Sender Phone&
        </div>
      </div>
    `,
  },
  {
    id: 'template-customer-ticket',
    name: 'Customer Support Ticket Resolution',
    category: 'Support',
    description: 'Ticket acknowledgment with ticket ID placeholders, resolution steps, and satisfaction check.',
    subject: 'Ticket #&Ticket ID&: Resolution & Follow-up regarding &Project Name&',
    updatedAt: '2026-09-25',
    bodyHtml: `
      <div style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5;">
        <p>
          <img src="${logoSvg}" alt="Company Logo" style="height: 40px; width: auto; margin-bottom: 12px;" />
        </p>

        <p>Hi <strong>&First Name&</strong>,</p>

        <p>
          Thank you for reaching out to <strong>&Company Name&</strong> support. We are writing to confirm that Ticket #<strong>&Ticket ID&</strong> regarding <em>&Project Name&</em> has been addressed.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">Ticket Summary:</p>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            <li><strong>Ticket ID:</strong> &Ticket ID&</li>
            <li><strong>Reported By:</strong> &Recipient Name& (&Recipient Email&)</li>
            <li><strong>Resolution Date:</strong> &Current Date&</li>
            <li><strong>Assigned Agent:</strong> &Sender Name&</li>
          </ul>
        </div>

        <p>
          If you have any further questions or if the issue persists, please reply directly to this email to automatically reopen your request.
        </p>

        <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9.5pt; color: #64748b;">
          <strong>&Company Name& Customer Success Team</strong><br/>
          Support Ticket Reference: #&Ticket ID&
        </div>
      </div>
    `,
  },
];
