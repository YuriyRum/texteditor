/**
 * Utility to adapt and sanitize pasted HTML content from external email clients
 * (e.g., Microsoft Outlook, Gmail, Apple Mail, Yahoo Mail, Microsoft Word, Thunderbird).
 */

export function adaptPastedEmailHtml(html: string): string {
  if (!html || !html.trim()) return html;

  let cleaned = html;

  // 1. Remove MS Office/Outlook conditional comments (<!--[if gte mso 9]>...<![endif]-->)
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?\]>[\s\S]*?<!\[endif\]-->/gi, '');

  // 2. Remove XML namespace declarations & MS Office tags like <o:p>, <w:WordDocument>, etc.
  cleaned = cleaned.replace(/<\/?o:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?w:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?v:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?m:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\?xml[^>]*>/gi, '');

  // 3. Remove embedded <style> tags that might break page layout, but retain inline styles
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Parse HTML into a DOM document to safely manipulate elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');

  // Convert legacy <font> tags to modern <span style="...">
  const fontTags = doc.querySelectorAll('font');
  fontTags.forEach((font) => {
    const span = doc.createElement('span');
    const color = font.getAttribute('color');
    const face = font.getAttribute('face');
    const size = font.getAttribute('size');

    const styles: string[] = [];

    if (color && color !== 'windowtext') {
      styles.push(`color: ${color}`);
    }
    if (face) {
      styles.push(`font-family: ${face}`);
    }
    if (size) {
      const sizeMap: Record<string, string> = {
        '1': '8pt',
        '2': '10pt',
        '3': '12pt',
        '4': '14pt',
        '5': '18pt',
        '6': '24pt',
        '7': '36pt',
      };
      const ptSize = sizeMap[size] || '11pt';
      styles.push(`font-size: ${ptSize}`);
    }

    if (styles.length > 0) {
      span.setAttribute('style', styles.join('; '));
    }

    while (font.firstChild) {
      span.appendChild(font.firstChild);
    }
    font.parentNode?.replaceChild(span, font);
  });

  // Normalize Outlook MsoListParagraph or custom list paragraphs
  const listParagraphs = doc.querySelectorAll('p[class*="MsoList"], p.MsoNormal');
  listParagraphs.forEach((p) => {
    p.removeAttribute('class');
  });

  // Ensure all <span> and <p> inline styles are normalized for Tiptap
  const styledElements = doc.querySelectorAll('[style]');
  styledElements.forEach((el) => {
    let styleAttr = el.getAttribute('style') || '';

    // Replace escaped quotes in font-family strings
    styleAttr = styleAttr.replace(/&quot;/g, '"');

    // Convert 'background:' to 'background-color:' if background is a color value
    if (styleAttr.includes('background:') && !styleAttr.includes('background-color:')) {
      styleAttr = styleAttr.replace(/background:\s*([^;]+)/gi, 'background-color: $1');
    }

    // Handle Outlook's 'color: windowtext' or 'color: initial'
    if (/color:\s*(windowtext|initial)/i.test(styleAttr)) {
      styleAttr = styleAttr.replace(/color:\s*(windowtext|initial);?/gi, '');
    }

    // Clean mso- inline properties that might clutter inline CSS
    styleAttr = styleAttr.replace(/mso-[^;]+;?/gi, '');

    // Remove or constrain fixed inline width/min-width declarations that exceed container
    styleAttr = styleAttr.replace(/(?:^|;\s*)(?:width|min-width)\s*:\s*[^;]+;?/gi, (match) => {
      // Keep width: 100% or percentages
      if (match.includes('%')) return match;
      return ' max-width: 100%; ';
    });

    // Replace white-space: nowrap with pre-wrap / normal
    styleAttr = styleAttr.replace(/white-space\s*:\s*nowrap;?/gi, 'white-space: pre-wrap; word-break: break-word; ');

    el.setAttribute('style', styleAttr.trim());
  });

  // Ensure all block elements wrap properly
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'td', 'th', 'span', 'li'].includes(tagName)) {
      let currentStyle = el.getAttribute('style') || '';
      if (!currentStyle.includes('overflow-wrap')) {
        currentStyle += ' overflow-wrap: break-word; word-break: break-word;';
      }
      el.setAttribute('style', currentStyle.trim());
    }
  });

  // Ensure pasted tables are correctly styled and visible
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    table.setAttribute('border', '1');
    table.setAttribute('cellpadding', '6');
    table.setAttribute('cellspacing', '0');

    let tableStyle = table.getAttribute('style') || '';
    // Strip fixed width from table style if present
    tableStyle = tableStyle.replace(/(?:^|;\s*)width\s*:\s*[^;]+;?/gi, '');
    tableStyle += ' border-collapse: collapse; width: 100%; max-width: 100%; table-layout: auto; word-break: break-word; border: 1px solid #cbd5e1; margin: 12px 0;';
    table.setAttribute('style', tableStyle.trim());

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
      if (!cellStyle.includes('word-break')) {
        cellStyle += ' word-break: break-word; overflow-wrap: break-word;';
      }
      cell.setAttribute('style', cellStyle.trim());
    });
  });

  // Preserve image formatting
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    img.removeAttribute('title');
    let imgStyle = img.getAttribute('style') || '';
    if (!imgStyle.includes('max-width')) {
      imgStyle += ' max-width: 100%; height: auto;';
    }
    img.setAttribute('style', imgStyle.trim());
  });

  // Ensure all elements are editable by removing contenteditable="false", disabled, or inert attributes
  const nonEditables = doc.querySelectorAll('[contenteditable], [disabled], [inert], [aria-readonly]');
  nonEditables.forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('disabled');
    el.removeAttribute('inert');
    el.removeAttribute('aria-readonly');
  });

  return doc.body.innerHTML;
}
