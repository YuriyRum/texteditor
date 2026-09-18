/**
 * Utilities for detecting, sanitizing, and converting raw plain text inputs into
 * fully formatted, Outlook-compatible HTML wrapped in semantic tags.
 */

const HTML_TAG_REGEX = /<\/?(?:p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|tbody|thead|tfoot|b|i|u|strong|em|a|br|hr|img|blockquote|pre|code|font|html|body|head|style|section|article)\b[^>]*>/i;

/**
 * Checks if a string contains actual HTML tags.
 */
export function isHtmlContent(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return true;
  return HTML_TAG_REGEX.test(trimmed);
}

/**
 * Escapes HTML characters (&, <, >, ", ') so raw text is safely displayed
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface WrapTextOptions {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  color?: string;
  paragraphSpacing?: string;
}

/**
 * Wraps raw plain text input into semantic, Outlook-compatible HTML paragraphs.
 * Preserves double-line breaks as distinct paragraphs and single-line breaks as <br/>.
 */
export function wrapPlainTextInHtml(
  text: string,
  options: WrapTextOptions = {}
): string {
  if (!text || typeof text !== 'string') {
    return '<p></p>';
  }

  const {
    fontFamily = "Calibri, 'Segoe UI', sans-serif",
    fontSize = '11pt',
    lineHeight = '1.5',
    color = '#1e293b',
    paragraphSpacing = '12px',
  } = options;

  const styleAttr = `style="margin: 0 0 ${paragraphSpacing} 0; font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}; color: ${color};"`;

  // Normalize all Windows/Mac line endings to \n
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!normalized) {
    return `<p ${styleAttr}></p>`;
  }

  // Split into paragraphs by two or more newlines
  const paragraphs = normalized.split(/\n\s*\n+/);

  const htmlParagraphs = paragraphs.map((paragraph) => {
    // Check if the paragraph is a bullet list
    const lines = paragraph.split('\n');
    const isBulletList = lines.length > 0 && lines.every((line) => /^\s*[-*•]\s+/.test(line));

    if (isBulletList) {
      const listItems = lines
        .map((line) => {
          const itemContent = line.replace(/^\s*[-*•]\s+/, '').trim();
          return `<li style="margin-bottom: 4px;">${escapeHtml(itemContent)}</li>`;
        })
        .join('');
      return `<ul style="margin: 0 0 ${paragraphSpacing} 0; padding-left: 24px; font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}; color: ${color};">${listItems}</ul>`;
    }

    // Process normal paragraph: escape HTML and convert single newlines to <br/>
    const escapedLines = lines.map((line) => escapeHtml(line)).join('<br/>');
    return `<p ${styleAttr}>${escapedLines}</p>`;
  });

  return htmlParagraphs.join('\n');
}

/**
 * Process any input string (MHT, HTML, or plain text):
 * - If MHT: returns parsed HTML
 * - If HTML: returns the HTML as-is
 * - If Plain Text: converts and wraps in semantic HTML paragraphs
 */
export function normalizeInputContent(
  input: string | undefined,
  defaultFont = "Calibri, 'Segoe UI', sans-serif"
): {
  html: string;
  type: 'mht' | 'html' | 'text';
  wasWrappedFromText: boolean;
} {
  if (!input) {
    return { html: '', type: 'text', wasWrappedFromText: false };
  }

  // Check for HTML
  if (isHtmlContent(input)) {
    return { html: input, type: 'html', wasWrappedFromText: false };
  }

  // Raw plain text -> wrap into HTML
  const wrapped = wrapPlainTextInHtml(input, { fontFamily: defaultFont });
  return { html: wrapped, type: 'text', wasWrappedFromText: true };
}
