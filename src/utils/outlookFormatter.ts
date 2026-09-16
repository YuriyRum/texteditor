import { FontOption, FontSizeOption } from '../types';

export const EMAIL_FONTS: FontOption[] = [
  { name: 'Calibri (Outlook Default)', family: 'Calibri, sans-serif', category: 'sans-serif', isOutlookDefault: true },
  { name: 'Aptos (New Outlook Default)', family: 'Aptos, Calibri, sans-serif', category: 'sans-serif', isOutlookDefault: true },
  { name: 'Segoe UI (Windows)', family: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', category: 'sans-serif', isOutlookDefault: true },
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif', category: 'sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif', category: 'serif' },
  { name: 'Times New Roman', family: '"Times New Roman", Times, serif', category: 'serif' },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif', category: 'sans-serif' },
  { name: 'Tahoma', family: 'Tahoma, Verdana, Segoe, sans-serif', category: 'sans-serif' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", Helvetica, sans-serif', category: 'sans-serif' },
  { name: 'Courier New', family: '"Courier New", Courier, monospace', category: 'monospace' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", "Comic Sans", cursive', category: 'cursive' },
];

export const FONT_SIZES: FontSizeOption[] = [
  { label: '9 pt (8px)', value: '9pt', ptValue: '9pt' },
  { label: '10 pt (13px)', value: '10pt', ptValue: '10pt' },
  { label: '11 pt (14.5px - Default)', value: '11pt', ptValue: '11pt' },
  { label: '12 pt (16px)', value: '12pt', ptValue: '12pt' },
  { label: '14 pt (18.5px)', value: '14pt', ptValue: '14pt' },
  { label: '16 pt (21px)', value: '16pt', ptValue: '16pt' },
  { label: '18 pt (24px)', value: '18pt', ptValue: '18pt' },
  { label: '24 pt (32px)', value: '24pt', ptValue: '24pt' },
  { label: '36 pt (48px)', value: '36pt', ptValue: '36pt' },
];

export const COLOR_PALETTE = [
  '#000000', '#1f2937', '#4b5563', '#9ca3af', '#ffffff',
  '#005a9e', '#0078d4', '#107c41', '#d13438', '#a80000',
  '#5c2d91', '#b4009e', '#008272', '#004e8c', '#ca5010',
  '#f3f2f1', '#eff6fc', '#e6f2ed', '#fde8e8', '#fff4ce',
];

export function cleanHtmlForOutlook(rawHtml: string, defaultFont: string = 'Calibri, sans-serif'): string {
  if (!rawHtml || rawHtml === '<p></p>') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Format Tables for Outlook compatibility
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    table.setAttribute('border', '1');
    table.setAttribute('cellpadding', '8');
    table.setAttribute('cellspacing', '0');

    let existingStyle = table.getAttribute('style') || '';
    if (!existingStyle.includes('border-collapse')) {
      existingStyle += ' border-collapse: collapse; width: 100%; max-width: 100%; border: 1px solid #cbd5e1; margin: 12px 0;';
    }
    table.setAttribute('style', existingStyle.trim());

    // Cells formatting
    const cells = table.querySelectorAll('th, td');
    cells.forEach((cell) => {
      let cellStyle = cell.getAttribute('style') || '';
      if (!cellStyle.includes('border')) {
        cellStyle += ' border: 1px solid #cbd5e1;';
      }
      if (!cellStyle.includes('padding')) {
        cellStyle += ' padding: 8px 12px;';
      }
      if (!cellStyle.includes('text-align')) {
        cellStyle += ' text-align: left;';
      }
      if (cell.tagName.toLowerCase() === 'th' && !cellStyle.includes('background-color')) {
        cellStyle += ' background-color: #f1f5f9; font-weight: 600; color: #0f172a;';
      }
      cell.setAttribute('style', cellStyle.trim());
    });
  });

  // Paragraphs formatting
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach((p) => {
    let pStyle = p.getAttribute('style') || '';
    if (!pStyle.includes('margin')) {
      pStyle += ' margin: 0 0 10px 0;';
    }
    if (!pStyle.includes('line-height')) {
      pStyle += ' line-height: 1.5;';
    }
    p.setAttribute('style', pStyle.trim());
  });

  // Blockquotes formatting
  const quotes = doc.querySelectorAll('blockquote');
  quotes.forEach((q) => {
    let qStyle = q.getAttribute('style') || '';
    qStyle += ' margin: 12px 0; padding: 10px 16px; border-left: 4px solid #0078d4; background-color: #f8fafc; color: #334155; font-style: italic;';
    q.setAttribute('style', qStyle.trim());
  });

  // Links formatting
  const links = doc.querySelectorAll('a');
  links.forEach((a) => {
    let aStyle = a.getAttribute('style') || '';
    if (!aStyle.includes('color')) {
      aStyle += ' color: #0078d4; text-decoration: underline;';
    }
    a.setAttribute('style', aStyle.trim());
  });

  // Wrap in Outlook friendly container
  const bodyHtml = doc.body.innerHTML;
  return `<div style="font-family: ${defaultFont}; font-size: 11pt; color: #1e293b; line-height: 1.5; word-wrap: break-word;">
${bodyHtml}
</div>`;
}

export function convertHtmlToPlainText(rawHtml: string): string {
  if (!rawHtml || rawHtml === '<p></p>') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Convert tables to ASCII representation
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const tableData: string[][] = [];

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowTexts = cells.map((cell) => cell.textContent?.trim() || '');
      tableData.push(rowTexts);
    });

    if (tableData.length === 0) return;

    // Determine col widths
    const colCount = Math.max(...tableData.map((r) => r.length));
    const colWidths = new Array(colCount).fill(0);

    tableData.forEach((row) => {
      row.forEach((cellText, colIdx) => {
        colWidths[colIdx] = Math.max(colWidths[colIdx] || 0, cellText.length);
      });
    });

    // Build ASCII Table string
    const divider = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
    let asciiTable = '\n' + divider + '\n';

    tableData.forEach((row, rIdx) => {
      const line =
        '|' +
        row
          .map((cellText, cIdx) => {
            const pad = colWidths[cIdx] - cellText.length;
            return ' ' + cellText + ' '.repeat(pad) + ' ';
          })
          .join('|') +
        '|';
      asciiTable += line + '\n';
      if (rIdx === 0 && table.querySelector('th')) {
        asciiTable += divider + '\n';
      }
    });

    asciiTable += divider + '\n\n';

    const textNode = doc.createTextNode(asciiTable);
    table.parentNode?.replaceChild(textNode, table);
  });

  // Convert list items
  const listItems = doc.querySelectorAll('li');
  listItems.forEach((li) => {
    const parentTag = li.parentElement?.tagName.toLowerCase();
    const prefix = parentTag === 'ol' ? '1. ' : '• ';
    li.textContent = `${prefix}${li.textContent?.trim()}\n`;
  });

  // Headings
  const headings = doc.querySelectorAll('h1, h2, h3, h4');
  headings.forEach((h) => {
    const text = h.textContent?.trim() || '';
    h.textContent = `\n\n=== ${text.toUpperCase()} ===\n`;
  });

  // Line breaks & paragraphs
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach((p) => {
    p.textContent = `${p.textContent?.trim()}\n\n`;
  });

  let text = doc.body.textContent || '';
  // Clean up excess vertical spaces
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

export async function copyRichTextToClipboard(html: string, plainText: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      // Fallback
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy rich text:', err);
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch {
      return false;
    }
  }
}

export function generateOutlookDeepLink(bodyText: string): string {
  const bodyEncoded = encodeURIComponent(bodyText || '');
  return `https://outlook.office.com/mail/deeplink/compose?body=${bodyEncoded}`;
}

export function generateMailtoLink(bodyText: string): string {
  const bodyEncoded = encodeURIComponent(bodyText || '');
  return `mailto:?body=${bodyEncoded}`;
}
