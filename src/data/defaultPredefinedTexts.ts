import { PredefinedText } from '../types';

export const DEFAULT_PREDEFINED_TEXTS: PredefinedText[] = [
  {
    id: 'greeting-formal',
    label: 'Formal Greeting',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">Dear [Recipient Name],</p><p style="font-family: Calibri, sans-serif; font-size: 11pt;">I hope this email finds you well and having a productive week.</p>',
  },
  {
    id: 'meeting-request',
    label: 'Meeting Request',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">Could we schedule a quick 15-minute call later this week to discuss the project updates? Please let me know what times work best for your schedule.</p>',
  },
  {
    id: 'thank-you',
    label: 'Thank You Note',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">Thank you for taking the time to meet with us today. We truly appreciate your insight and look forward to our next steps together.</p>',
  },
  {
    id: 'follow-up',
    label: 'Follow Up',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">I am following up on my previous email regarding the status of our pending deliverables. Could you please provide a brief update when you have a moment?</p>',
  },
  {
    id: 'call-to-action',
    label: 'Action Required',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;"><strong>Action Required:</strong> Please review the attached details at your earliest convenience and confirm approval by end of day tomorrow.</p>',
  },
  {
    id: 'signature-standard',
    label: 'Professional Signature',
    text: '<div style="margin-top: 16px; border-top: 2px solid #e20074; padding-top: 10px; font-family: Calibri, sans-serif; font-size: 10pt; color: #334155;"><strong style="font-size: 11pt; color: #1e293b;">[Your Name]</strong><br/><span style="color: #e20074; font-weight: 600;">[Your Title]</span> | [Company Name]<br/>📧 <a href="mailto:name@company.com" style="color: #0284c7;">name@company.com</a> | 📞 +1 (555) 019-2834</div>',
  },
  {
    id: 'out-of-office',
    label: 'Out of Office Notice',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt; color: #475569;">Thank you for your message. I am currently out of the office with limited access to email until [Return Date]. For urgent matters, please contact [Colleague Name] at <a href="mailto:support@company.com" style="color: #e20074;">support@company.com</a>.</p>',
  },
  {
    id: 'status-update',
    label: 'Project Status Update',
    text: '<h3 style="color: #e20074; font-family: Calibri, sans-serif;">Weekly Project Status Update</h3><p style="font-family: Calibri, sans-serif; font-size: 11pt;">Here is a summary of our progress for this sprint:</p><ul style="font-family: Calibri, sans-serif; font-size: 11pt;"><li><strong>Completed:</strong> Initial design reviews and backend API integrations.</li><li><strong>In Progress:</strong> Frontend styling polish and quality testing.</li><li><strong>Next Steps:</strong> Final deployment and user feedback collection.</li></ul>',
  },
  {
    id: 'proposal-pitch',
    label: 'Proposal Summary',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">We are excited to share our tailored proposal designed to streamline your workflows and accelerate team productivity. Please find the executive summary attached for your review.</p>',
  },
  {
    id: 'support-confirmation',
    label: 'Support Request Acknowledgment',
    text: '<p style="font-family: Calibri, sans-serif; font-size: 11pt;">We have successfully received your inquiry (Ticket #<b>[Ticket ID]</b>). Our dedicated team is currently reviewing your request and will follow up within 24 hours.</p>',
  },
];
