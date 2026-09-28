export type ViewMode = 'editor' | 'preview' | 'html' | 'text';

export type AppMode = 'editor' | 'builder';

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

export type TablePreset =
  | 'standard'
  | 'striped'
  | 'minimal'
  | 'accent-header'
  | 'borderless'
  | 'thick-accent'
  | 'callout-box';

export type BorderLineStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

export type BorderSidesPreset =
  | 'all'
  | 'none'
  | 'outer'
  | 'inner'
  | 'horizontal'
  | 'vertical'
  | 'bottom'
  | 'top'
  | 'left'
  | 'right';

export type BorderScope = 'table' | 'cells';

export interface TableBorderConfig {
  width: string; // e.g., '0px', '0.5px', '1px', '1.5px', '2px', '3px', '4px', '6px'
  style: BorderLineStyle;
  color: string;
  sides: BorderSidesPreset;
  scope?: BorderScope;
}

export interface PredefinedText {
  id: string;
  label: string;
  text: string;
  category?: string;
  description?: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
}

export interface PlaceholderDefinition {
  key: string; // e.g. "Recipient Name" or "Company"
  label: string;
  category: 'recipient' | 'sender' | 'company' | 'project' | 'date' | 'custom';
  sampleValue: string;
  description?: string;
}

export interface ImagePlaceholderPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  label: string;
  type: 'banner' | 'logo' | 'feature' | 'avatar' | 'metric';
  description: string;
}

export interface TemplateImageObject {
  id: string;
  cid: string; // e.g. "image001.svg@01DA9F80.OUTLOOK"
  filename: string; // e.g. "image001.svg"
  contentLocation: string; // e.g. "file:///C:/OutlookTemplate/image001.svg"
  contentType: string; // e.g. "image/svg+xml" or "image/png"
  encoding: 'base64';
  base64Data: string; // Raw Base64 payload
  sizeBytes: number;
  width?: string;
  height?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category?: string;
  description?: string;
  subject: string;
  bodyHtml: string; // HTML with src="cid:..." references to separate image objects
  images?: TemplateImageObject[]; // Separate image objects referenced by the template
  updatedAt: string;
}
