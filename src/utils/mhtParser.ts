/**
 * Comprehensive client-side MHT / MHTML / EML (RFC 2557 / RFC 822) Parser
 * Specifically tailored for Outlook email archives (.mht, .mhtml, .eml).
 * Extracts rich HTML, decodes Quoted-Printable & Base64, resolves inline cid: images to Data URIs,
 * and cleans Word/Outlook artifacts for seamless editing in Tiptap.
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
 * Checks if a given text is in MHT / MHTML / MIME multipart format
 */
export function isMhtContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const trimmed = content.trimStart();
  // Check for common MIME headers or indicators
  const hasMimeVersion = /MIME-Version\s*:/i.test(trimmed);
  const hasMultipart = /Content-Type\s*:\s*multipart\/(related|alternative|mixed)/i.test(trimmed);
  const hasBoundary = /boundary\s*=\s*["']?[^"'\r\n]+["']?/i.test(trimmed);
  const hasRfc822 = /Content-Type\s*:\s*message\/rfc822/i.test(trimmed);
  const hasNextPart = /------=_NextPart_/i.test(trimmed);

  return (hasMimeVersion && (hasMultipart || hasBoundary)) || hasNextPart || (hasMultipart && hasBoundary) || hasRfc822;
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
 * Extract attribute from a header value (e.g. boundary="..." from Content-Type)
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
  // Remove soft line breaks: '=' followed by CRLF or LF
  const withoutSoftBreaks = str.replace(/=\r?\n/g, '');
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
 * Decodes bytes to string using specified or fallback charset
 */
function decodeBytesToString(bytes: Uint8Array, charset = 'utf-8'): string {
  let normalizedCharset = (charset || 'utf-8').trim().toLowerCase().replace(/^["']|["']$/g, '');

  if (normalizedCharset === 'us-ascii' || normalizedCharset === 'ascii' || normalizedCharset === '7bit') {
    normalizedCharset = 'utf-8';
  } else if (normalizedCharset === 'cp1252' || normalizedCharset === 'windows-1252') {
    normalizedCharset = 'windows-1252';
  } else if (normalizedCharset === 'iso-8859-1' || normalizedCharset === 'latin1') {
    normalizedCharset = 'windows-1252'; // windows-1252 is a superset with proper typographic quotes
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
  try {
    const clean = base64Str.replace(/[\r\n\s]+/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return decodeBytesToString(bytes, charset);
  } catch {
    return base64Str;
  }
}

/**
 * Clean base64 string for image data URL
 */
function cleanBase64(str: string): string {
  return str.replace(/[\r\n\s]+/g, '');
}

/**
 * Strips Word / Outlook XML artifacts, conditional comments, and unnecessary wrappers
 */
function cleanOutlookHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Remove XML islands: <xml>...</xml>
  html = html.replace(/<xml[\s\S]*?<\/xml>/gi, '');

  // 2. Remove MSO conditional comments: <!--[if ...]>...<![endif]-->
  html = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');

  // 3. Remove Word document artifacts: <w:WordDocument>...</w:WordDocument>
  html = html.replace(/<w:[^>]+>[\s\S]*?<\/w:[^>]+>/gi, '');
  html = html.replace(/<o:OfficeDocumentSettings>[\s\S]*?<\/o:OfficeDocumentSettings>/gi, '');

  // 4. Remove empty <o:p></o:p> and </o:p>
  html = html.replace(/<o:p>\s*<\/o:p>/gi, '');
  html = html.replace(/<\/?o:p[^>]*>/gi, '');

  // 5. Remove VML shapes or preserve image data
  html = html.replace(/<v:shape[\s\S]*?<v:imagedata[^>]*src=["']([^"']+)["'][\s\S]*?<\/v:shape>/gi, '<img src="$1" />');
  html = html.replace(/<\/?v:[^>]*>/gi, '');

  // 6. Extract <body> content if present
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    html = bodyMatch[1];
  }

  // 7. Strip <script> tags for security
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 8. Fix Outlook list bullets (e.g., <p class="MsoListParagraph"> with · or o or bullets)
  html = html.replace(/<span[^>]*style=["'][^"']*mso-list:[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '');

  // 9. Clean MSO CSS properties
  html = html.replace(/mso-[^:;"]+:[^;"]+;?/gi, '');

  // 10. Ensure all content is editable by stripping contenteditable="false", readonly, or pointer-events:none
  html = html.replace(/\s+contenteditable\s*=\s*["']?false["']?/gi, '');
  html = html.replace(/\s+aria-readonly\s*=\s*["']?true["']?/gi, '');
  html = html.replace(/user-select\s*:\s*none;?/gi, '');
  html = html.replace(/pointer-events\s*:\s*none;?/gi, '');

  return html.trim();
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

  // Split top headers from main body
  const headerSplit = content.split(/\r?\n\r?\n/);
  const topHeaderRaw = headerSplit[0] || '';
  const topHeaders = parseHeaderBlock(topHeaderRaw);

  result.subject = topHeaders['subject'] || undefined;
  result.from = topHeaders['from'] || undefined;
  result.to = topHeaders['to'] || undefined;
  result.date = topHeaders['date'] || undefined;

  // Decode subject if encoded like =?UTF-8?B?...?= or =?UTF-8?Q?...?=
  if (result.subject && result.subject.startsWith('=?')) {
    result.subject = decodeMimeHeader(result.subject);
  }

  // Find boundary
  const contentType = topHeaders['content-type'] || '';
  let boundary = getHeaderParam(contentType, 'boundary');

  // If boundary not found in top headers, search content for boundary
  if (!boundary) {
    const boundaryMatch = content.match(/boundary\s*=\s*["']?([^"';\r\n]+)["']?/i);
    if (boundaryMatch) {
      boundary = boundaryMatch[1].trim();
    }
  }

  // If still no boundary, this might be a single part HTML or text
  if (!boundary) {
    const encoding = (topHeaders['content-transfer-encoding'] || '').toLowerCase();
    const charset = getHeaderParam(contentType, 'charset') || 'utf-8';
    const bodyContent = content.slice(topHeaderRaw.length).trim();

    let decodedBody = bodyContent;
    if (encoding.includes('quoted-printable')) {
      decodedBody = decodeQuotedPrintable(bodyContent, charset);
    } else if (encoding.includes('base64')) {
      decodedBody = decodeBase64ToString(bodyContent, charset);
    }

    if (contentType.includes('text/html') || decodedBody.includes('<html') || decodedBody.includes('<p') || decodedBody.includes('<body')) {
      result.html = cleanOutlookHtml(decodedBody);
    } else {
      result.html = `<p>${escapeHtml(decodedBody).replace(/\n/g, '<br/>')}</p>`;
      result.text = decodedBody;
    }
    return result;
  }

  // Multi-part processing
  const delimiter = `--${boundary}`;
  const partsRaw = content.split(delimiter);

  const parts: MimePart[] = [];

  for (let i = 1; i < partsRaw.length; i++) {
    const partRaw = partsRaw[i];
    // Stop at end boundary "--"
    if (partRaw.startsWith('--') || partRaw.trim() === '--') {
      break;
    }

    const doubleNewlineIndex = partRaw.search(/\r?\n\r?\n/);
    if (doubleNewlineIndex === -1) continue;

    const partHeaderRaw = partRaw.slice(0, doubleNewlineIndex);
    const partBody = partRaw.slice(doubleNewlineIndex).replace(/^(\r?\n\r?\n)/, '');

    const headers = parseHeaderBlock(partHeaderRaw);
    const pContentType = (headers['content-type'] || 'text/plain').split(';')[0].trim().toLowerCase();
    const pCharset = getHeaderParam(headers['content-type'] || '', 'charset') || 'utf-8';
    const pEncoding = (headers['content-transfer-encoding'] || '').trim().toLowerCase();

    // Content-ID can be <image001.png@01C12345.6789ABCD>
    let pContentId = headers['content-id'] || '';
    pContentId = pContentId.replace(/^<|>$/g, '').trim();

    const pContentLocation = (headers['content-location'] || '').trim();
    const pFilename =
      getHeaderParam(headers['content-disposition'] || '', 'filename') ||
      getHeaderParam(headers['content-type'] || '', 'name') ||
      '';

    parts.push({
      headers,
      contentType: pContentType,
      charset: pCharset,
      encoding: pEncoding,
      contentId: pContentId,
      contentLocation: pContentLocation,
      filename: pFilename,
      body: partBody,
    });
  }

  // Separate HTML part, text part, and resources (images, etc.)
  let primaryHtmlPart: MimePart | null = null;
  let primaryTextPart: MimePart | null = null;
  const resourceMap = new Map<string, string>(); // Key: cid or filename or location -> Value: data URI

  for (const part of parts) {
    if (part.contentType === 'text/html' && !primaryHtmlPart) {
      primaryHtmlPart = part;
    } else if (part.contentType === 'text/plain' && !primaryTextPart) {
      primaryTextPart = part;
    }

    // Is it an image or media resource?
    if (part.contentType.startsWith('image/') || part.contentType.startsWith('audio/') || part.contentType.startsWith('video/')) {
      let dataUrl = '';
      if (part.encoding.includes('base64')) {
        dataUrl = `data:${part.contentType};base64,${cleanBase64(part.body)}`;
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
        }
        if (part.contentLocation) {
          resourceMap.set(part.contentLocation, dataUrl);
          // Also handle relative filename extracted from Content-Location
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

  let finalHtml = '';

  if (primaryHtmlPart) {
    let decoded = primaryHtmlPart.body;
    if (primaryHtmlPart.encoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(decoded, primaryHtmlPart.charset);
    } else if (primaryHtmlPart.encoding.includes('base64')) {
      decoded = decodeBase64ToString(decoded, primaryHtmlPart.charset);
    }

    // Replace inline images (cid:... or file:... or relative filenames)
    finalHtml = replaceInlineResources(decoded, resourceMap);
    finalHtml = cleanOutlookHtml(finalHtml);
  } else if (primaryTextPart) {
    let decoded = primaryTextPart.body;
    if (primaryTextPart.encoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(decoded, primaryTextPart.charset);
    } else if (primaryTextPart.encoding.includes('base64')) {
      decoded = decodeBase64ToString(decoded, primaryTextPart.charset);
    }
    result.text = decoded;
    finalHtml = `<p>${escapeHtml(decoded).replace(/\n/g, '<br/>')}</p>`;
  }

  result.html = finalHtml;
  return result;
}

/**
 * Replaces cid: and relative URLs in HTML with embedded Data URIs from MHT resources
 */
function replaceInlineResources(html: string, resourceMap: Map<string, string>): string {
  if (!html || resourceMap.size === 0) return html;

  // 1. Replace src="cid:..." or src='cid:...'
  let updated = html.replace(/src=["']cid:([^"']+)["']/gi, (match, cid) => {
    const cleanCid = cid.replace(/^<|>$/g, '').trim();
    const dataUrl = resourceMap.get(`cid:${cleanCid}`) || resourceMap.get(cleanCid);
    if (dataUrl) {
      return `src="${dataUrl}"`;
    }
    return match;
  });

  // 2. Replace any other img src that matches a filename in resourceMap
  updated = updated.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (fullTag, before, src, after) => {
    // If it's already a data URI or http, keep unless matched in resourceMap
    if (resourceMap.has(src)) {
      return `<img${before}src="${resourceMap.get(src)}"${after}>`;
    }
    const filenameOnly = src.split(/[\/\\]/).pop();
    if (filenameOnly && resourceMap.has(filenameOnly)) {
      return `<img${before}src="${resourceMap.get(filenameOnly)}"${after}>`;
    }
    return fullTag;
  });

  // 3. Replace CSS background urls with cid:
  updated = updated.replace(/url\(\s*["']?cid:([^"')]+)["']?\s*\)/gi, (match, cid) => {
    const cleanCid = cid.replace(/^<|>$/g, '').trim();
    const dataUrl = resourceMap.get(`cid:${cleanCid}`) || resourceMap.get(cleanCid);
    if (dataUrl) {
      return `url("${dataUrl}")`;
    }
    return match;
  });

  return updated;
}

/**
 * Helper to escape HTML characters
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
 * Reads a File or Blob as an MHT archive with automatic charset detection
 */
export async function readFileAsMht(file: File | Blob): Promise<ParsedMhtResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Read preview of first 4096 bytes to detect charset
  let preview = '';
  const checkLimit = Math.min(bytes.length, 4096);
  for (let i = 0; i < checkLimit; i++) {
    preview += String.fromCharCode(bytes[i]);
  }

  let detectedCharset = 'utf-8';
  const charsetMatch = preview.match(/charset\s*=\s*["']?([^"';\r\n]+)["']?/i);
  if (charsetMatch && charsetMatch[1]) {
    detectedCharset = charsetMatch[1].trim();
  }

  const decodedContent = decodeBytesToString(bytes, detectedCharset);
  return parseMht(decodedContent);
}
