import { EmailTemplate, TemplateImageObject } from '../types';

const IMAGE_STORE_STORAGE_KEY = 'email_template_images_store';

/**
 * Loads the separate image object repository from localStorage (keyed by cid)
 */
export function loadSavedImageObjectsStore(): Record<string, TemplateImageObject> {
  try {
    const raw = localStorage.getItem(IMAGE_STORE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves image objects to the separate image object repository in localStorage
 */
export function saveImageObjectsToStore(images: TemplateImageObject[]): void {
  if (!images || images.length === 0) return;
  try {
    const current = loadSavedImageObjectsStore();
    for (const img of images) {
      current[img.cid] = img;
    }
    localStorage.setItem(IMAGE_STORE_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to persist separate image objects:', err);
  }
}

/**
 * Converts a UTF-8 string to Base64 safely
 */
function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Parses any data:image/... URI (base64 or utf8 SVG) into standard Base64 and MIME metadata
 */
export function parseDataUriToBase64(dataUri: string): {
  contentType: string;
  base64Data: string;
  ext: string;
} | null {
  if (!dataUri || !dataUri.startsWith('data:')) return null;

  const commaIdx = dataUri.indexOf(',');
  if (commaIdx === -1) return null;

  const header = dataUri.slice(5, commaIdx); // e.g. "image/svg+xml;utf8" or "image/png;base64"
  const payload = dataUri.slice(commaIdx + 1);

  const parts = header.split(';');
  const contentType = (parts[0] || 'image/png').trim().toLowerCase();
  const isBase64 = parts.some((p) => p.trim().toLowerCase() === 'base64');

  let base64Data = '';
  if (isBase64) {
    base64Data = payload.replace(/\s+/g, '');
  } else {
    // Decode URI component if needed (for utf8 SVG data URLs) and convert to Base64
    let rawText = payload;
    try {
      rawText = decodeURIComponent(payload);
    } catch {
      rawText = payload;
    }
    base64Data = utf8ToBase64(rawText);
  }

  let ext = 'png';
  if (contentType.includes('svg')) ext = 'svg';
  else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
  else if (contentType.includes('gif')) ext = 'gif';
  else if (contentType.includes('webp')) ext = 'webp';
  else if (contentType.includes('bmp')) ext = 'bmp';

  return {
    contentType,
    base64Data,
    ext,
  };
}

/**
 * Extracts all inline images from HTML into separate TemplateImageObject records
 * and replaces <img src="data:..."> with Outlook-compatible <img src="cid:...">.
 * Also enforces explicit HTML width/height attributes on <img> for Outlook Word rendering engine.
 */
export function extractImagesFromHtmlToCid(
  html: string,
  existingImages: TemplateImageObject[] = []
): {
  cidHtml: string;
  images: TemplateImageObject[];
} {
  if (!html) {
    return { cidHtml: '', images: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgElements = Array.from(doc.querySelectorAll('img'));

  if (imgElements.length === 0) {
    return { cidHtml: html, images: [] };
  }

  const savedStore = loadSavedImageObjectsStore();
  const existingByCid = new Map<string, TemplateImageObject>();
  const existingByBase64 = new Map<string, TemplateImageObject>();

  Object.values(savedStore).forEach((img) => {
    existingByCid.set(img.cid, img);
    existingByBase64.set(img.base64Data, img);
  });

  existingImages.forEach((img) => {
    existingByCid.set(img.cid, img);
    existingByBase64.set(img.base64Data, img);
  });

  const collectedImages: TemplateImageObject[] = [];
  const collectedByCid = new Map<string, TemplateImageObject>();

  imgElements.forEach((img, idx) => {
    const src = img.getAttribute('src') || '';

    // Extract explicit pixel dimensions for Outlook compatibility
    const rawWidth = img.getAttribute('width') || img.style.width || '';
    const rawHeight = img.getAttribute('height') || img.style.height || '';
    const numericWidth = rawWidth.replace(/[^\d.]/g, '');
    const numericHeight = rawHeight.replace(/[^\d.]/g, '');

    if (numericWidth) {
      img.setAttribute('width', String(Math.round(Number(numericWidth))));
    }
    if (numericHeight) {
      img.setAttribute('height', String(Math.round(Number(numericHeight))));
    }
    if (!img.getAttribute('border')) {
      img.setAttribute('border', '0');
    }

    if (src.startsWith('data:')) {
      const parsed = parseDataUriToBase64(src);
      if (!parsed) return;

      let imgObj = existingByBase64.get(parsed.base64Data);
      if (!imgObj) {
        const seqNum = String(collectedImages.length + 1).padStart(3, '0');
        const hashSuffix = Math.abs(
          parsed.base64Data
            .slice(0, 120)
            .split('')
            .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
        )
          .toString(16)
          .toUpperCase()
          .padStart(6, '0')
          .slice(0, 6);

        const filename = `image${seqNum}.${parsed.ext}`;
        const cid = `image${seqNum}.${parsed.ext}@01DA${hashSuffix}.OUTLOOK`;
        const sizeBytes = Math.round((parsed.base64Data.length * 3) / 4);

        imgObj = {
          id: `img-${seqNum}-${hashSuffix}`,
          cid,
          filename,
          contentLocation: `file:///C:/OutlookTemplate/${filename}`,
          contentType: parsed.contentType,
          encoding: 'base64',
          base64Data: parsed.base64Data,
          sizeBytes,
          width: numericWidth ? `${Math.round(Number(numericWidth))}px` : undefined,
          height: numericHeight ? `${Math.round(Number(numericHeight))}px` : undefined,
        };

        existingByBase64.set(parsed.base64Data, imgObj);
        existingByCid.set(cid, imgObj);
      } else {
        // Update dimensions if resized
        imgObj = {
          ...imgObj,
          width: numericWidth ? `${Math.round(Number(numericWidth))}px` : imgObj.width,
          height: numericHeight ? `${Math.round(Number(numericHeight))}px` : imgObj.height,
        };
      }

      if (!collectedByCid.has(imgObj.cid)) {
        collectedByCid.set(imgObj.cid, imgObj);
        collectedImages.push(imgObj);
      }

      // Replace inline data URI with MHT/Outlook cid: reference
      img.setAttribute('src', `cid:${imgObj.cid}`);
    } else if (src.toLowerCase().startsWith('cid:')) {
      const cleanCid = src.slice(4).replace(/^<|>$/g, '').trim();
      const found = existingByCid.get(cleanCid);
      if (found) {
        const updatedObj: TemplateImageObject = {
          ...found,
          width: numericWidth ? `${Math.round(Number(numericWidth))}px` : found.width,
          height: numericHeight ? `${Math.round(Number(numericHeight))}px` : found.height,
        };
        if (!collectedByCid.has(updatedObj.cid)) {
          collectedByCid.set(updatedObj.cid, updatedObj);
          collectedImages.push(updatedObj);
        }
      } else {
        // Fallback placeholder reference record if external cid
        const seqNum = String(idx + 1).padStart(3, '0');
        const placeholderObj: TemplateImageObject = {
          id: `img-${seqNum}`,
          cid: cleanCid,
          filename: cleanCid.split('@')[0] || `image${seqNum}.png`,
          contentLocation: `file:///C:/OutlookTemplate/${cleanCid.split('@')[0] || `image${seqNum}.png`}`,
          contentType: 'image/png',
          encoding: 'base64',
          base64Data: '',
          sizeBytes: 0,
        };
        if (!collectedByCid.has(cleanCid)) {
          collectedByCid.set(cleanCid, placeholderObj);
          collectedImages.push(placeholderObj);
        }
      }
    }
  });

  if (collectedImages.length > 0) {
    saveImageObjectsToStore(collectedImages);
  }

  return {
    cidHtml: doc.body.innerHTML,
    images: collectedImages,
  };
}

/**
 * Resolves src="cid:..." references in template HTML back to data: URIs
 * from the template's separate image objects so the browser editor and preview can display them.
 */
export function resolveCidImagesInHtml(
  html: string,
  templateImages: TemplateImageObject[] = []
): string {
  if (!html || !/cid:/i.test(html)) return html;

  const savedStore = loadSavedImageObjectsStore();
  const cidMap = new Map<string, TemplateImageObject>();

  Object.values(savedStore).forEach((img) => {
    cidMap.set(img.cid, img);
    cidMap.set(img.cid.toLowerCase(), img);
    const prefix = img.cid.split('@')[0];
    if (prefix) cidMap.set(prefix.toLowerCase(), img);
  });

  templateImages.forEach((img) => {
    cidMap.set(img.cid, img);
    cidMap.set(img.cid.toLowerCase(), img);
    const prefix = img.cid.split('@')[0];
    if (prefix) cidMap.set(prefix.toLowerCase(), img);
  });

  return html.replace(/src=["']cid:([^"']+)["']/gi, (fullMatch, rawCid) => {
    const cleanCid = rawCid.replace(/^<|>$/g, '').trim();
    const imgObj =
      cidMap.get(cleanCid) ||
      cidMap.get(cleanCid.toLowerCase()) ||
      cidMap.get(cleanCid.split('@')[0]?.toLowerCase());

    if (imgObj && imgObj.base64Data) {
      return `src="data:${imgObj.contentType};base64,${imgObj.base64Data}"`;
    }
    return fullMatch;
  });
}

/**
 * Normalizes a list of templates so any embedded data: images are extracted into separate
 * TemplateImageObject[] and the template's bodyHtml uses src="cid:..." references.
 */
export function normalizeTemplatesWithSeparateImages(
  templates: EmailTemplate[]
): EmailTemplate[] {
  return templates.map((tpl) => {
    const { cidHtml, images } = extractImagesFromHtmlToCid(
      tpl.bodyHtml,
      tpl.images || []
    );
    return {
      ...tpl,
      bodyHtml: cidHtml,
      images: images.length > 0 ? images : tpl.images || [],
    };
  });
}

/**
 * Wraps Base64 string at 76 characters per line according to RFC 2045 MIME specification
 */
function wrapBase64Lines(base64Str: string, lineLength = 76): string {
  const clean = base64Str.replace(/\s+/g, '');
  const lines: string[] = [];
  for (let i = 0; i < clean.length; i += lineLength) {
    lines.push(clean.slice(i, i + lineLength));
  }
  return lines.join('\r\n');
}

/**
 * Encodes string into Quoted-Printable (UTF-8) for MHT HTML body part
 */
function encodeQuotedPrintableUtf8(html: string): string {
  const bytes = new TextEncoder().encode(html);
  let out = '';
  let lineLen = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];

    // Preserve standard CRLF / LF
    if (b === 13 && bytes[i + 1] === 10) {
      out += '\r\n';
      lineLen = 0;
      i++;
      continue;
    }
    if (b === 10) {
      out += '\r\n';
      lineLen = 0;
      continue;
    }

    // Printable ASCII except '=' (61)
    const isSafeChar = (b >= 33 && b <= 126 && b !== 61) || b === 32 || b === 9;
    const token = isSafeChar
      ? String.fromCharCode(b)
      : `=${b.toString(16).toUpperCase().padStart(2, '0')}`;

    if (lineLen + token.length > 73) {
      out += '=\r\n';
      lineLen = 0;
    }
    out += token;
    lineLen += token.length;
  }

  return out;
}

/**
 * Generates a complete Outlook-compatible .MHT (RFC 2557 multipart/related) archive
 * where the HTML body references images via src="cid:..." and each image is stored as a separate Base64 MIME part.
 */
export function generateOutlookMhtDocument(params: {
  subject: string;
  bodyHtml: string;
  images?: TemplateImageObject[];
}): {
  mhtContent: string;
  cidHtml: string;
  images: TemplateImageObject[];
} {
  const { cidHtml, images } = extractImagesFromHtmlToCid(
    params.bodyHtml,
    params.images || []
  );

  const boundary = '----=_NextPart_01DA9F80.OUTLOOK_EMAIL_STUDIO';
  const dateStr = new Date().toUTCString();

  const fullHtmlDoc = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<title>${(params.subject || 'Email Template').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
<!--[if gte mso 9]><xml>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]-->
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 11pt;
    color: #1e293b;
    line-height: 1.5;
  }
  table {
    border-collapse: collapse;
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    outline: none;
    text-decoration: none;
  }
</style>
</head>
<body lang="EN-US" link="#0078d4" vlink="#5c2d91" style="tab-interval:36.0pt;word-wrap:break-word">
<div class="WordSection1">
${cidHtml}
</div>
</body>
</html>`;

  const qpHtml = encodeQuotedPrintableUtf8(fullHtmlDoc);

  const mimeLines: string[] = [
    'From: <Saved by Outlook Email Studio>',
    `Subject: ${params.subject || 'Email Template'}`,
    `Date: ${dateStr}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/related;`,
    `\ttype="text/html";`,
    `\tboundary="${boundary}"`,
    '',
    'This is a multi-part message in MIME format.',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: quoted-printable',
    'Content-Location: file:///C:/OutlookTemplate/body.htm',
    '',
    qpHtml,
    '',
  ];

  // Append each separate image object as an individual MIME part with Content-ID
  for (const img of images) {
    if (!img.base64Data) continue;
    mimeLines.push(
      `--${boundary}`,
      `Content-Type: ${img.contentType}; name="${img.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${img.cid}>`,
      `Content-Location: ${img.contentLocation}`,
      `Content-Disposition: inline; filename="${img.filename}"`,
      '',
      wrapBase64Lines(img.base64Data, 76),
      ''
    );
  }

  mimeLines.push(`--${boundary}--`, '');

  return {
    mhtContent: mimeLines.join('\r\n'),
    cidHtml,
    images,
  };
}
