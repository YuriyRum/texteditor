export type ViewMode = 'editor' | 'preview' | 'html' | 'text';

export type FontOption = {
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'cursive';
  isOutlookDefault?: boolean;
};

export type FontSizeOption = {
  label: string;
  value: string; // e.g. '11pt', '14px'
  ptValue: string;
};

export type TablePreset = 'standard' | 'striped' | 'minimal' | 'accent-header' | 'callout-box';

export interface PredefinedText {
  id: string;
  label: string;
  text: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
}


