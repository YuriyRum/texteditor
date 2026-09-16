import { EmailAttachment } from '../types';

export const DEFAULT_ATTACHMENTS: EmailAttachment[] = [
  { id: 'att-1', name: 'Quarterly_Report_Q3.pdf', size: '2.4 MB', type: 'pdf' },
  { id: 'att-2', name: 'Design_System_Spec.docx', size: '1.1 MB', type: 'doc' },
  { id: 'att-3', name: 'Invoice_2026_09.pdf', size: '420 KB', type: 'pdf' },
  { id: 'att-4', name: 'Architecture_Diagram.png', size: '3.8 MB', type: 'image' },
  { id: 'att-5', name: 'Project_Schedule.xlsx', size: '850 KB', type: 'spreadsheet' },
];
