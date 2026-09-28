import { PlaceholderDefinition, ImagePlaceholderPreset } from '../types';

export const DEFAULT_PLACEHOLDERS: PlaceholderDefinition[] = [
  // Recipient info
  {
    key: 'Recipient Name',
    label: 'Recipient Full Name',
    category: 'recipient',
    sampleValue: 'Jane Doe',
    description: 'Full name of the recipient',
  },
  {
    key: 'First Name',
    label: 'First Name',
    category: 'recipient',
    sampleValue: 'Jane',
    description: 'First name for warm, friendly greetings',
  },
  {
    key: 'Recipient Email',
    label: 'Recipient Email Address',
    category: 'recipient',
    sampleValue: 'jane.doe@example.com',
    description: 'Email destination',
  },
  {
    key: 'Recipient Title',
    label: 'Recipient Job Title',
    category: 'recipient',
    sampleValue: 'VP of Engineering',
    description: 'Professional role or title',
  },

  // Company info
  {
    key: 'Company Name',
    label: 'Company Name',
    category: 'company',
    sampleValue: 'Acme Global Corp',
    description: 'Target or partner organization',
  },
  {
    key: 'Department',
    label: 'Department',
    category: 'company',
    sampleValue: 'Product Operations',
    description: 'Relevant division or unit',
  },

  // Project / Work
  {
    key: 'Project Name',
    label: 'Project Name',
    category: 'project',
    sampleValue: 'Cloud Migration Sprint 4',
    description: 'Title of the current project or initiative',
  },
  {
    key: 'Document Name',
    label: 'Document Name',
    category: 'project',
    sampleValue: 'Q3 Architectural Architecture.pdf',
    description: 'Attached or linked document',
  },
  {
    key: 'Sprint Number',
    label: 'Sprint Number',
    category: 'project',
    sampleValue: '26.4',
    description: 'Agile iteration identifier',
  },
  {
    key: 'Ticket ID',
    label: 'Support Ticket ID',
    category: 'project',
    sampleValue: 'SUP-8924',
    description: 'Helpdesk ticket reference number',
  },
  {
    key: 'Meeting Topic',
    label: 'Meeting Topic',
    category: 'project',
    sampleValue: 'Quarterly Strategic Alignment',
    description: 'Subject of an upcoming meeting',
  },

  // Dates & Times
  {
    key: 'Due Date',
    label: 'Due Date',
    category: 'date',
    sampleValue: 'Friday, Oct 15 at 5:00 PM',
    description: 'Target completion deadline',
  },
  {
    key: 'Meeting Date',
    label: 'Meeting Date & Time',
    category: 'date',
    sampleValue: 'Tuesday, Oct 12, 10:00 AM EST',
    description: 'Scheduled conference time',
  },
  {
    key: 'Current Date',
    label: 'Today\'s Date',
    category: 'date',
    sampleValue: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    description: 'Current formatted date',
  },

  // Sender info
  {
    key: 'Sender Name',
    label: 'Your Name',
    category: 'sender',
    sampleValue: 'Alex Morgan',
    description: 'Signer or account owner name',
  },
  {
    key: 'Sender Title',
    label: 'Your Title',
    category: 'sender',
    sampleValue: 'Lead Systems Architect',
    description: 'Sender designation',
  },
  {
    key: 'Sender Phone',
    label: 'Your Phone',
    category: 'sender',
    sampleValue: '+1 (555) 392-8190',
    description: 'Direct contact phone number',
  },
];

export const DEFAULT_IMAGE_PRESETS: ImagePlaceholderPreset[] = [
  {
    id: 'hero-banner',
    name: 'Hero Email Banner',
    width: 600,
    height: 180,
    label: 'Header Banner',
    type: 'banner',
    description: 'Full-width email header banner (600×180px) for announcements and campaigns.',
  },
  {
    id: 'company-logo',
    name: 'Company Logo',
    width: 180,
    height: 60,
    label: 'Logo Placeholder',
    type: 'logo',
    description: 'Crisp brand logo placeholder (180×60px) for email top bar or signature.',
  },
  {
    id: 'product-feature',
    name: 'Feature / Product Image',
    width: 480,
    height: 240,
    label: 'Product Showcase',
    type: 'feature',
    description: 'Central product screenshot or feature showcase image (480×240px).',
  },
  {
    id: 'metric-card',
    name: 'Metric / Stat Card',
    width: 260,
    height: 130,
    label: 'KPI Metric Graphic',
    type: 'metric',
    description: 'Key performance indicator or highlight callout graphic (260×130px).',
  },
  {
    id: 'avatar-profile',
    name: 'Profile / Speaker Avatar',
    width: 90,
    height: 90,
    label: 'Author Avatar',
    type: 'avatar',
    description: 'Circular/square author or team member portrait placeholder (90×90px).',
  },
];
