/**
 * Comprehensive client-side MHT / MHTML / EML (RFC 2557 / RFC 822) Parser
 * Specifically tailored for Microsoft Outlook & Word email archives (.mht, .mhtml, .eml).
 * Features:
 * - Recursive MIME multipart tree traversal (handles nested multipart/related & multipart/alternative)
 * - Complete Quoted-Printable & Base64 decoding with multi-charset support (UTF-8, Windows-1252, ISO-8859-1, Windows-1251, etc.)
 * - CID, Content-Location, and filename resolution for embedded images & attachments to Data URIs
 * - Full CSS inlining: parses all embedded <style> stylesheets and applies rules directly to matching DOM elements
 * - Preserves ALL content (no accidental comment truncation, keeps text in shapes and Word textboxes)
 * - Normalizes Word 'windowtext' colors, pt/in units, tables, and borders for high-fidelity Tiptap editing
 */

export interface ParsedMhtResult {
  html: string;
  text: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  attachments: {
    id: string;
    name: string;
    size?: string;
    type?: string;
    dataUrl?: string;
  }[];
}

interface MimePart {
  headers: Record<string, string>;
  contentType: string;
  charset: string;
  encoding: string;
  contentId: string;
  contentLocation: string;
  filename: string;
  body: string;
}

/**
 * Checks if a given text or content is in MHT / MHTML / MIME multipart format
 */
export function isMhtContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const sample = content.slice(0, 4000);
  const hasMimeVersion = /MIME-Version\s*:/i.test(sample);
  const hasMultipart = /Content-Type\s*:\s*multipart\//i.test(sample);
  const hasBoundary = /boundary\s*=\s*["']?[^"'\r\n]+["']?/i.test(sample);
  const hasRfc822 = /Content-Type\s*:\s*message\/rfc822/i.test(sample);
  const hasNextPart = /------=_NextPart_/i.test(sample);
  const hasSavedBy = /From:\s*<Saved by/i.test(sample);

  return (
    (hasMimeVersion && (hasMultipart || hasBoundary)) ||
    hasNextPart ||
    (hasMultipart && hasBoundary) ||
    hasRfc822 ||
    hasSavedBy
  );
}

/**
 * Unfolds MIME headers according to RFC 822 / RFC 2822
 * Lines starting with space or tab are continuations of the previous line.
 */
function unfoldHeaders(rawHeaders: string): string {
  return rawHeaders.replace(/\r?\n[ \t]+/g, ' ');
}

/**
 * Parses header block into key-value map
 */
function parseHeaderBlock(headerText: string): Record<string, string> {
  const unfolded = unfoldHeaders(headerText);
  const lines = unfolded.split(/\r?\n/);
  const headers: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();
      headers[key] = val;
    }
  }

  return headers;
}

/**
 * Extracts attribute from a header value (e.g. boundary="..." from Content-Type)
 */
function getHeaderParam(headerValue: string, paramName: string): string {
  if (!headerValue) return '';
  const regex = new RegExp(`(?:^|[;\\s])${paramName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^;\\s]+))`, 'i');
  const match = headerValue.match(regex);
  if (!match) return '';
  return (match[1] || match[2] || match[3] || '').trim();
}

/**
 * Decodes Quoted-Printable bytes into a Uint8Array
 */
function decodeQuotedPrintableToBytes(str: string): Uint8Array {
  // Remove soft line breaks: '=' followed by CRLF or LF or CR
  const withoutSoftBreaks = str.replace(/=\r?\n/g, '').replace(/=\r/g, '');
  const bytes: number[] = [];
  let i = 0;
  const len = withoutSoftBreaks.length;

  while (i < len) {
    const ch = withoutSoftBreaks[i];
    if (ch === '=' && i + 2 < len) {
      const hex = withoutSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    bytes.push(withoutSoftBreaks.charCodeAt(i) & 0xff);
    i++;
  }

  return new Uint8Array(bytes);
}

/**
 * Decodes Base64 to Uint8Array safely
 */
function decodeBase64ToBytes(base64Str: string): Uint8Array {
  try {
    const clean = base64Str.replace(/[^A-Za-z0-9+/=]/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

/**
 * Decodes bytes to string using specified or fallback charset
 */
function decodeBytesToString(bytes: Uint8Array, charset = 'utf-8'): string {
  let normalizedCharset = (charset || 'utf-8').trim().toLowerCase().replace(/^["']|["']$/g, '');

  if (normalizedCharset === 'us-ascii' || normalizedCharset === 'ascii' || normalizedCharset === '7bit') {
    normalizedCharset = 'utf-8';
  } else if (normalizedCharset === 'cp1252' || normalizedCharset === 'windows-1252') {
    normalizedCharset = 'windows-1252';
  } else if (normalizedCharset === 'iso-8859-1' || normalizedCharset === 'latin1') {
    normalizedCharset = 'windows-1252'; // Windows-1252 is a superset preserving smart quotes & euro
  } else if (normalizedCharset === 'cp1251' || normalizedCharset === 'windows-1251') {
    normalizedCharset = 'windows-1251';
  } else if (normalizedCharset === 'iso-8859-2' || normalizedCharset === 'latin2') {
    normalizedCharset = 'iso-8859-2';
  }

  try {
    const decoder = new TextDecoder(normalizedCharset, { fatal: false });
    return decoder.decode(bytes);
  } catch {
    try {
      const fallbackDecoder = new TextDecoder('utf-8', { fatal: false });
      return fallbackDecoder.decode(bytes);
    } catch {
      let out = '';
      for (let i = 0; i < bytes.length; i++) {
        out += String.fromCharCode(bytes[i]);
      }
      return out;
    }
  }
}

/**
 * Decodes Quoted-Printable string
 */
function decodeQuotedPrintable(str: string, charset = 'utf-8'): string {
  const bytes = decodeQuotedPrintableToBytes(str);
  return decodeBytesToString(bytes, charset);
}

/**
 * Decodes Base64 to string with charset awareness
 */
function decodeBase64ToString(base64Str: string, charset = 'utf-8'): string {
  const bytes = decodeBase64ToBytes(base64Str);
  return decodeBytesToString(bytes, charset);
}

/**
 * Decodes binary string (Latin1) to string with specified charset
 */
function decodeRawBody(bodyStr: string, charset = 'utf-8'): string {
  const bytes = new Uint8Array(bodyStr.length);
  for (let i = 0; i < bodyStr.length; i++) {
    bytes[i] = bodyStr.charCodeAt(i) & 0xff;
  }
  return decodeBytesToString(bytes, charset);
}

/**
 * Extracts boundary string from header or content
 */
function extractBoundary(contentType: string, rawContent: string): string {
  let boundary = getHeaderParam(contentType, 'boundary');
  if (!boundary) {
    const boundaryMatch = rawContent.match(/boundary\s*=\s*["']?([^"';\r\n]+)["']?/i);
    if (boundaryMatch) {
      boundary = boundaryMatch[1].trim();
    }
  }
  return boundary;
}

/**
 * Recursively parses MIME parts, descending into nested multipart/related and multipart/alternative
 */
function parseMimePartsRecursive(content: string, boundary: string): MimePart[] {
  if (!boundary) return [];

  const delimiter = `--${boundary}`;
  const partsRaw = content.split(delimiter);
  const collectedParts: MimePart[] = [];

  for (let i = 1; i < partsRaw.length; i++) {
    const partRaw = partsRaw[i];
    const trimmed = partRaw.trim();
    // Reached boundary terminator '--'
    if (trimmed === '--' || partRaw.startsWith('--')) {
      break;
    }

    const doubleNewlineMatch = partRaw.match(/\r?\n\r?\n/);
    if (!doubleNewlineMatch || doubleNewlineMatch.index === undefined) continue;

    const partHeaderRaw = partRaw.slice(0, doubleNewlineMatch.index);
    let partBody = partRaw.slice(doubleNewlineMatch.index + doubleNewlineMatch[0].length);

    // Remove single trailing CRLF or LF before next delimiter
    partBody = partBody.replace(/\r?\n$/, '');

    const headers = parseHeaderBlock(partHeaderRaw);
    const rawContentType = headers['content-type'] || 'text/plain';
    const contentType = rawContentType.split(';')[0].trim().toLowerCase();
    const charset = getHeaderParam(rawContentType, 'charset') || 'utf-8';
    const encoding = (headers['content-transfer-encoding'] || '').trim().toLowerCase();

    let contentId = headers['content-id'] || '';
    contentId = contentId.replace(/^<|>$/g, '').trim();

    const contentLocation = (headers['content-location'] || '').trim();
    const filename =
      getHeaderParam(headers['content-disposition'] || '', 'filename') ||
      getHeaderParam(rawContentType, 'name') ||
      '';

    // If this part is ITSELF a multipart (e.g., multipart/alternative inside multipart/related),
    // recursively parse its sub-parts!
    if (contentType.startsWith('multipart/')) {
      const subBoundary = extractBoundary(rawContentType, partRaw);
      if (subBoundary) {
        const subParts = parseMimePartsRecursive(partBody, subBoundary);
        collectedParts.push(...subParts);
        continue;
      }
    }

    collectedParts.push({
      headers,
      contentType,
      charset,
      encoding,
      contentId,
      contentLocation,
      filename,
      body: partBody,
    });
  }

  return collectedParts;
}

/**
 * Comprehensive CSS inliner and Outlook/Word HTML normalizer.
 * 1. Extracts all <style> blocks (from <head> or <body>).
 * 2. Parses CSS rules and maps them directly to matching DOM element inline styles.
 * 3. Normalizes Word 'windowtext' to visible dark slate (#1e293b).
 * 4. Ensures table borders, cell paddings, and background colors are fully preserved.
 * 5. Pushes block-level text styling (color, font-family, font-size) down so Tiptap marks capture it.
 * 6. Safely cleans Microsoft Office XML metadata without deleting actual content or textboxes.
 */
export function cleanAndInlineOutlookHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Remove Office <xml> islands (WordDocument settings, etc.)
  html = html.replace(/<xml[\s\S]*?<\/xml>/gi, '');

  // 2. Remove purely MSO document settings conditional blocks (e.g. <!--[if gte mso 9]><xml>...)
  html = html.replace(/<!--\[if gte mso \d+\]>[\s\S]*?<xml>[\s\S]*?<\/xml>[\s\S]*?<!\[endif\]-->/gi, '');
  html = html.replace(/<!--\[if gte mso \d+\]>[\s\S]*?<w:[^>]+>[\s\S]*?<\/w:[^>]+>[\s\S]*?<!\[endif\]-->/gi, '');
  html = html.replace(/<!--\[if gte mso \d+\]>[\s\S]*?<o:[^>]+>[\s\S]*?<\/o:[^>]+>[\s\S]*?<!\[endif\]-->/gi, '');

  // 3. Unwrap non-MSO conditional comments (<!--[if !mso]><!--> ... <!--<![endif]-->) so Web content is preserved
  html = html.replace(/<!--\[if\s*!mso\]><!-->([\s\S]*?)<!--<!\[endif\]-->/gi, '$1');
  html = html.replace(/<!--\[if\s*!mso\]>([\s\S]*?)<!\[endif\]-->/gi, '$1');

  // 4. Remove standalone MSO conditional wrappers without eating content
  html = html.replace(/<!--\[if[^\]]*\]>/gi, '');
  html = html.replace(/<!\[endif\]-->/gi, '');

  // 5. Convert VML imagedata tags to standard <img> tags
  html = html.replace(/<v:imagedata[^>]*src=["']([^"']+)["'][^>]*>/gi, '<img src="$1" style="max-width:100%;height:auto;" />');

  // 6. Strip VML and MSO tags while strictly PRESERVING all inner text & elements (e.g., textboxes, shapes)
  html = html.replace(/<\/?(?:v|w|o|m):[a-z0-9_-]+[^>]*>/gi, '');

  // 7. Strip <script> tags for safety
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Parse into DOM for CSS inlining and element normalization
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 8. CSS Inlining: Parse all <style> tags and inline them into matching elements
  const styleElements = Array.from(doc.querySelectorAll('style'));
  const cssRules: { selector: string; declarations: Record<string, string> }[] = [];

  for (const styleEl of styleElements) {
    let cssText = styleEl.textContent || '';
    // Strip comments
    cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(cssText)) !== null) {
      const rawSelectors = match[1].trim();
      const rawDeclarations = match[2].trim();

      // Skip @-rules (@font-face, @page, @media)
      if (rawSelectors.startsWith('@')) continue;

      const declarations: Record<string, string> = {};
      const pairs = rawDeclarations.split(';');

      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx > 0) {
          const prop = pair.slice(0, colonIdx).trim().toLowerCase();
          let val = pair.slice(colonIdx + 1).trim();

          // Skip pure mso- properties unless helpful
          if (prop.startsWith('mso-')) continue;

          // Replace 'windowtext' with clear, accessible slate
          val = val.replace(/windowtext/gi, '#1e293b');

          if (prop && val) {
            declarations[prop] = val;
          }
        }
      }

      if (Object.keys(declarations).length === 0) continue;

      // Handle multiple comma-separated selectors (e.g. p.MsoNormal, li.MsoNormal)
      const selectors = rawSelectors.split(',');
      for (const sel of selectors) {
        const cleanSel = sel.trim();
        // Ignore pseudo-selectors that querySelectorAll cannot match
        if (cleanSel && !cleanSel.includes(':hover') && !cleanSel.includes(':focus') && !cleanSel.includes('::')) {
          cssRules.push({ selector: cleanSel, declarations });
        }
      }
    }
  }

  // Apply parsed CSS rules to matching elements
  for (const { selector, declarations } of cssRules) {
    try {
      const matchedElements = doc.querySelectorAll(selector);
      matchedElements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        for (const [prop, val] of Object.entries(declarations)) {
          // Only set if not already defined directly in existing inline style
          if (!el.style.getPropertyValue(prop)) {
            el.style.setProperty(prop, val);
          }
        }
      });
    } catch {
      // Ignore selectors unsupported by querySelectorAll
    }
  }

  // 9. Normalize existing inline styles across all elements
  const allStyled = doc.querySelectorAll('[style]');
  allStyled.forEach((el) => {
    if (el instanceof HTMLElement) {
      let s = el.getAttribute('style') || '';
      // Replace windowtext
      if (/windowtext/i.test(s)) {
        s = s.replace(/windowtext/gi, '#1e293b');
      }
      // Clean pure mso- rules
      s = s.replace(/mso-[^:;"]+:[^;"]+;?/gi, '');
      el.setAttribute('style', s);
    }
  });

  // 10. Table Normalization: ensure borders, cell paddings, and background colors are visible & editable
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    let tStyle = table.getAttribute('style') || '';
    if (!tStyle.includes('border-collapse')) {
      tStyle = `border-collapse: collapse; width: 100%; max-width: 100%; ${tStyle}`;
    }
    table.setAttribute('style', tStyle.trim());

    // Process all cells in table
    const cells = table.querySelectorAll('th, td');
    cells.forEach((cell) => {
      if (!(cell instanceof HTMLElement)) return;
      let cStyle = cell.getAttribute('style') || '';

      // Convert legacy bgcolor attribute to background-color
      const bgcolor = cell.getAttribute('bgcolor');
      if (bgcolor && !cStyle.includes('background-color') && !cStyle.includes('background:')) {
        cStyle += ` background-color: ${bgcolor};`;
      }

      // Convert valign to vertical-align
      const valign = cell.getAttribute('valign');
      if (valign && !cStyle.includes('vertical-align')) {
        cStyle += ` vertical-align: ${valign};`;
      }

      // Convert align to text-align
      const align = cell.getAttribute('align');
      if (align && !cStyle.includes('text-align')) {
        cStyle += ` text-align: ${align};`;
      }

      // Ensure cell has a visible border if table or cell hints at it
      if (!cStyle.includes('border')) {
        cStyle += ' border: 1px solid #cbd5e1;';
      }

      // Ensure cell has readable padding
      if (!cStyle.includes('padding')) {
        cStyle += ' padding: 8px 12px;';
      }

      cell.setAttribute('style', cStyle.trim());
    });
  });

  // 11. Convert legacy <font> tags to modern <span style="...">
  const fonts = doc.querySelectorAll('font');
  fonts.forEach((font) => {
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
      styles.push(`font-size: ${sizeMap[size] || '11pt'}`);
    }

    if (styles.length > 0) {
      span.setAttribute('style', styles.join('; '));
    }

    while (font.firstChild) {
      span.appendChild(font.firstChild);
    }
    font.parentNode?.replaceChild(span, font);
  });

  // 12. Text Styling Propagation: ensure paragraph font, size, and color are preserved in Tiptap
  // When a <p> has inline style with color/fontFamily/fontSize, wrap direct text nodes in a <span>
  // so Tiptap's TextStyle marks parse them accurately!
  const paragraphs = doc.querySelectorAll('p, div.WordSection1 > div');
  paragraphs.forEach((p) => {
    if (!(p instanceof HTMLElement)) return;
    const pColor = p.style.color;
    const pFamily = p.style.fontFamily;
    const pSize = p.style.fontSize;

    if (pColor || pFamily || pSize) {
      const childSpans = p.querySelectorAll('span');
      // If there are direct text nodes or no styled spans, propagate styling
      if (childSpans.length === 0 && p.childNodes.length > 0) {
        const span = doc.createElement('span');
        const s: string[] = [];
        if (pColor) s.push(`color: ${pColor}`);
        if (pFamily) s.push(`font-family: ${pFamily}`);
        if (pSize) s.push(`font-size: ${pSize}`);
        span.setAttribute('style', s.join('; '));

        while (p.firstChild) {
          span.appendChild(p.firstChild);
        }
        p.appendChild(span);
      }
    }
  });

  // 13. Clean up Outlook list bullet artifacts so lists are readable
  const listParagraphs = doc.querySelectorAll('p[class*="MsoList"]');
  listParagraphs.forEach((p) => {
    p.removeAttribute('class');
  });

  // 14. Ensure all content is editable (strip accidental contenteditable=false)
  const nonEditable = doc.querySelectorAll('[contenteditable="false"], [aria-readonly="true"]');
  nonEditable.forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('aria-readonly');
  });

  // Extract body content or document element content
  const bodyContent = doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;
  return bodyContent.trim();
}

/**
 * Replaces cid: and relative URLs in HTML with embedded Data URIs from MHT resources
 */
export function replaceInlineResources(html: string, resourceMap: Map<string, string>): string {
  if (!html || resourceMap.size === 0) return html;

  let updated = html;

  // 1. Replace src="cid:..." or src='cid:...'
  updated = updated.replace(/src=["']cid:([^"']+)["']/gi, (match, cid) => {
    const cleanCid = cid.replace(/^<|>$/g, '').trim();
    const dataUrl =
      resourceMap.get(`cid:${cleanCid}`) ||
      resourceMap.get(cleanCid) ||
      resourceMap.get(cleanCid.split('@')[0]);
    if (dataUrl) {
      return `src="${dataUrl}"`;
    }
    return match;
  });

  // 2. Replace any other img src matching a filename or path in resourceMap
  updated = updated.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (fullTag, before, src, after) => {
    if (resourceMap.has(src)) {
      return `<img${before}src="${resourceMap.get(src)}"${after}>`;
    }
    const cleanSrc = src.replace(/^<|>$/g, '').trim();
    if (resourceMap.has(cleanSrc)) {
      return `<img${before}src="${resourceMap.get(cleanSrc)}"${after}>`;
    }
    const filenameOnly = cleanSrc.split(/[\/\\]/).pop();
    if (filenameOnly && resourceMap.has(filenameOnly)) {
      return `<img${before}src="${resourceMap.get(filenameOnly)}"${after}>`;
    }
    return fullTag;
  });

  // 3. Replace CSS background urls with cid:
  updated = updated.replace(/url\(\s*["']?cid:([^"')]+)["']?\s*\)/gi, (match, cid) => {
    const cleanCid = cid.replace(/^<|>$/g, '').trim();
    const dataUrl =
      resourceMap.get(`cid:${cleanCid}`) ||
      resourceMap.get(cleanCid) ||
      resourceMap.get(cleanCid.split('@')[0]);
    if (dataUrl) {
      return `url("${dataUrl}")`;
    }
    return match;
  });

  return updated;
}

/**
 * Decodes MIME encoded-word headers (RFC 2047): =?charset?encoding?encoded_text?=
 */
function decodeMimeHeader(header: string): string {
  return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return decodeBase64ToString(text, charset);
      } else if (encoding.toUpperCase() === 'Q') {
        const qDecoded = text.replace(/_/g, ' ');
        return decodeQuotedPrintable(qDecoded, charset);
      }
    } catch {
      return text;
    }
    return text;
  });
}

/**
 * Escapes HTML characters for plain text fallback
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses raw MHT / MHTML file content into editable HTML and metadata
 */
export function parseMht(content: string): ParsedMhtResult {
  const result: ParsedMhtResult = {
    html: '',
    text: '',
    attachments: [],
  };

  if (!content) return result;

  // Split top-level MIME headers from body
  const headerSplit = content.split(/\r?\n\r?\n/);
  const topHeaderRaw = headerSplit[0] || '';
  const topHeaders = parseHeaderBlock(topHeaderRaw);

  result.subject = topHeaders['subject'] || undefined;
  result.from = topHeaders['from'] || undefined;
  result.to = topHeaders['to'] || undefined;
  result.date = topHeaders['date'] || undefined;

  if (result.subject && result.subject.startsWith('=?')) {
    result.subject = decodeMimeHeader(result.subject);
  }

  // Find top-level boundary
  const topContentType = topHeaders['content-type'] || '';
  const boundary = extractBoundary(topContentType, content);

  // If no boundary, this might be a single part email/document
  if (!boundary) {
    const encoding = (topHeaders['content-transfer-encoding'] || '').toLowerCase();
    const charset = getHeaderParam(topContentType, 'charset') || 'utf-8';
    const bodyContent = content.slice(topHeaderRaw.length).trim();

    let decodedBody = bodyContent;
    if (encoding.includes('quoted-printable')) {
      decodedBody = decodeQuotedPrintable(bodyContent, charset);
    } else if (encoding.includes('base64')) {
      decodedBody = decodeBase64ToString(bodyContent, charset);
    } else {
      decodedBody = decodeRawBody(bodyContent, charset);
    }

    if (topContentType.includes('text/html') || /<html|<body|<p/i.test(decodedBody)) {
      result.html = cleanAndInlineOutlookHtml(decodedBody);
    } else {
      result.html = `<p>${escapeHtml(decodedBody).replace(/\n/g, '<br/>')}</p>`;
      result.text = decodedBody;
    }
    return result;
  }

  // Recursively parse all MIME parts (leaf parts across all nested multipart levels)
  const parts = parseMimePartsRecursive(content, boundary);

  // Map resources (images, fonts, stylesheets)
  const resourceMap = new Map<string, string>();
  let primaryHtmlPart: MimePart | null = null;
  let primaryTextPart: MimePart | null = null;
  const htmlParts: MimePart[] = [];

  for (const part of parts) {
    if (part.contentType === 'text/html') {
      htmlParts.push(part);
      if (!primaryHtmlPart) {
        primaryHtmlPart = part;
      }
    } else if (part.contentType === 'text/plain' && !primaryTextPart) {
      primaryTextPart = part;
    }

    // Process image / media attachment
    if (
      part.contentType.startsWith('image/') ||
      part.contentType.startsWith('audio/') ||
      part.contentType.startsWith('video/')
    ) {
      let dataUrl = '';
      if (part.encoding.includes('base64')) {
        const clean = part.body.replace(/[^A-Za-z0-9+/=]/g, '');
        dataUrl = `data:${part.contentType};base64,${clean}`;
      } else if (part.encoding.includes('quoted-printable')) {
        const bytes = decodeQuotedPrintableToBytes(part.body);
        let binaryStr = '';
        for (let b = 0; b < bytes.length; b++) {
          binaryStr += String.fromCharCode(bytes[b]);
        }
        dataUrl = `data:${part.contentType};base64,${btoa(binaryStr)}`;
      }

      if (dataUrl) {
        if (part.contentId) {
          resourceMap.set(`cid:${part.contentId}`, dataUrl);
          resourceMap.set(part.contentId, dataUrl);
          const prefix = part.contentId.split('@')[0];
          if (prefix) {
            resourceMap.set(prefix, dataUrl);
          }
        }
        if (part.contentLocation) {
          resourceMap.set(part.contentLocation, dataUrl);
          const filenameOnly = part.contentLocation.split(/[\/\\]/).pop();
          if (filenameOnly) {
            resourceMap.set(filenameOnly, dataUrl);
          }
        }
        if (part.filename) {
          resourceMap.set(part.filename, dataUrl);
        }

        result.attachments.push({
          id: part.contentId || part.filename || `att-${result.attachments.length + 1}`,
          name: part.filename || part.contentLocation || part.contentId || `image-${result.attachments.length + 1}`,
          type: part.contentType,
          dataUrl,
        });
      }
    }
  }

  // If multiple HTML parts exist, pick the largest one (main document body)
  if (htmlParts.length > 1) {
    let maxLen = 0;
    for (const hPart of htmlParts) {
      if (hPart.body.length > maxLen) {
        maxLen = hPart.body.length;
        primaryHtmlPart = hPart;
      }
    }
  }

  let finalHtml = '';

  if (primaryHtmlPart) {
    let decoded = '';
    // Detect if charset is declared in <meta> tag inside the raw body
    let effectiveCharset = primaryHtmlPart.charset;
    const metaCharsetMatch = primaryHtmlPart.body.match(/<meta[^>]+charset=["']?([^"'>\s;]+)/i);
    if (metaCharsetMatch && metaCharsetMatch[1]) {
      effectiveCharset = metaCharsetMatch[1].trim();
    }

    if (primaryHtmlPart.encoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(primaryHtmlPart.body, effectiveCharset);
    } else if (primaryHtmlPart.encoding.includes('base64')) {
      decoded = decodeBase64ToString(primaryHtmlPart.body, effectiveCharset);
    } else {
      decoded = decodeRawBody(primaryHtmlPart.body, effectiveCharset);
    }

    // Replace inline images with resolved Data URIs
    finalHtml = replaceInlineResources(decoded, resourceMap);
    // Inline CSS styles and clean Word artifacts
    finalHtml = cleanAndInlineOutlookHtml(finalHtml);
  } else if (primaryTextPart) {
    let decoded = '';
    if (primaryTextPart.encoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(primaryTextPart.body, primaryTextPart.charset);
    } else if (primaryTextPart.encoding.includes('base64')) {
      decoded = decodeBase64ToString(primaryTextPart.body, primaryTextPart.charset);
    } else {
      decoded = decodeRawBody(primaryTextPart.body, primaryTextPart.charset);
    }
    result.text = decoded;
    finalHtml = `<p>${escapeHtml(decoded).replace(/\n/g, '<br/>')}</p>`;
  }

  result.html = finalHtml;
  return result;
}

/**
 * Reads a File or Blob as an MHT archive with zero-byte-loss Latin1 decoding
 * preserving all raw bytes for recursive MIME, Quoted-Printable, and Base64 parsing.
 */
export async function readFileAsMht(file: File | Blob): Promise<ParsedMhtResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // ISO-8859-1 (Latin1) maps 0x00-0xFF 1:1 to characters without byte loss or substitution
  const decoder = new TextDecoder('iso-8859-1');
  const binaryString = decoder.decode(bytes);

  return parseMht(binaryString);
}
