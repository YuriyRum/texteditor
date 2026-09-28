import { PredefinedText } from '../types';

export const DEFAULT_PREDEFINED_TEXTS: PredefinedText[] = [
  {
    id: 'formal-greeting',
    label: 'Formal Greeting',
    category: 'Greetings',
    description: 'Polite professional opening greeting',
    text: '<p>Dear [Recipient Name],</p><p>I hope this email finds you well.</p>',
  },
  {
    id: 'follow-up',
    label: 'Follow-Up Inquiry',
    category: 'Follow-ups',
    description: 'Gentle follow-up message on a previous conversation',
    text: '<p>I am following up on our previous discussion. Could you please let me know your thoughts or provide an update when you have a moment?</p>',
  },
  {
    id: 'meeting-invitation',
    label: 'Meeting Request',
    category: 'Meetings',
    description: 'Request for a 30-minute sync session',
    text: '<p>I would like to propose a 30-minute meeting to discuss the next steps and align on our timeline. Please let me know what day and time works best for your schedule.</p>',
  },
  {
    id: 'status-update',
    label: 'Status Summary',
    category: 'Updates',
    description: 'Brief progress update template',
    text: '<p>Here is a quick summary of progress since our last update:</p><ul><li>Key milestone deliverable achieved on schedule.</li><li>Review session successfully concluded.</li><li>Next sprint tasks scheduled to begin next week.</li></ul>',
  },
  {
    id: 'action-items',
    label: 'Action Items List',
    category: 'Actions',
    description: 'Structured next steps callout',
    text: '<p><strong>Action Items & Next Steps:</strong></p><ol><li>Review and confirm document feedback by end of week.</li><li>Schedule technical deep-dive alignment.</li><li>Finalize budget and resource allocation.</li></ol>',
  },
  {
    id: 'professional-signoff',
    label: 'Professional Sign-off',
    category: 'Closings',
    description: 'Standard business signature closing',
    text: '<p>Best regards,<br/><strong>Your Name</strong><br/>Enterprise Operations Team</p>',
  },
  {
    id: 'confidentiality-notice',
    label: 'Confidentiality Disclaimer',
    category: 'Legal',
    description: 'Standard corporate confidentiality footer',
    text: '<p style="font-size: 8.5pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 16px;"><em>CONFIDENTIALITY NOTICE: This transmission is intended only for the use of the recipient to whom it is addressed and may contain confidential information. If you are not the intended recipient, please notify the sender immediately and delete this message.</em></p>',
  },
];
