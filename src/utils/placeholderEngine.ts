/**
 * Utilities for extracting, filling, and handling email template placeholders and placeholder images.
 * Formats placeholders with single ampersands: &Variable Name& or &variable&
 */

// Matches &Variable Name& or &variable& (single ampersands on each side), as well as &amp;variable&amp; or &&variable&&
const AMPERSAND_PLACEHOLDER_REGEX = /(?:&amp;|&){1,2}([^&;\r\n<>]+?)(?:&amp;|&){1,2}/g;

// Fallback match for legacy {{Variable}}
const CURLY_PLACEHOLDER_REGEX = /\{\{([^{}\r\n]+)\}\}/g;

/**
 * Formats a raw user-provided identifier into a valid placeholder token: &placeholder_id&
 */
export function formatPlaceholderToken(rawId: string): string {
  const clean = rawId.replace(/^[{&;\s]+|[{&;\s]+$/g, '').trim();
  return `&${clean}&`;
}

/**
 * Extracts unique placeholder keys from a template string (e.g. "Recipient Name" from "&Recipient Name&")
 */
export function extractPlaceholders(text: string): string[] {
  if (!text) return [];
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  // Extract &key& (single ampersands)
  const ampersandRegex = new RegExp(AMPERSAND_PLACEHOLDER_REGEX);
  while ((match = ampersandRegex.exec(text)) !== null) {
    const key = match[1].trim();
    // Exclude common HTML entity fragments like &amp; &nbsp; &lt; &gt; &quot;
    if (
      key &&
      !['amp', 'nbsp', 'lt', 'gt', 'quot', '#39', '#x27'].includes(key.toLowerCase()) &&
      key.length < 50
    ) {
      matches.add(key);
    }
  }

  // Also extract legacy {{key}} if present
  const curlyRegex = new RegExp(CURLY_PLACEHOLDER_REGEX);
  while ((match = curlyRegex.exec(text)) !== null) {
    const key = match[1].trim();
    if (key && key.length < 50) {
      matches.add(key);
    }
  }

  return Array.from(matches);
}

/**
 * Replaces placeholders in a string with supplied values.
 * If a value is missing, falls back to the original placeholder or optional fallback.
 */
export function fillPlaceholders(
  template: string,
  values: Record<string, string>,
  fallbackToPlaceholder = true
): string {
  if (!template) return '';

  let result = template;

  // Replace &Key& / &amp;Key&amp;
  result = result.replace(AMPERSAND_PLACEHOLDER_REGEX, (fullMatch, keyName) => {
    const cleanKey = keyName.trim();
    if (['amp', 'nbsp', 'lt', 'gt', 'quot'].includes(cleanKey.toLowerCase())) {
      return fullMatch;
    }
    if (values[cleanKey] !== undefined && values[cleanKey] !== '') {
      return values[cleanKey];
    }
    return fallbackToPlaceholder ? fullMatch : '';
  });

  // Replace legacy {{Key}}
  result = result.replace(CURLY_PLACEHOLDER_REGEX, (fullMatch, keyName) => {
    const cleanKey = keyName.trim();
    if (values[cleanKey] !== undefined && values[cleanKey] !== '') {
      return values[cleanKey];
    }
    return fallbackToPlaceholder ? fullMatch : '';
  });

  return result;
}

/**
 * Generates an SVG data URL for a crisp, high-resolution email placeholder image.
 * Requires no external network calls and renders reliably in all email clients & browsers.
 */
export function generateSvgPlaceholder(
  width: number,
  height: number,
  title: string,
  subtitle?: string,
  options?: {
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    icon?: 'image' | 'banner' | 'logo' | 'avatar' | 'metric' | 'feature';
  }
): string {
  const bg = options?.bgColor || '#f1f5f9';
  const text = options?.textColor || '#334155';
  const accent = options?.accentColor || '#e20074';
  const icon = options?.icon || 'image';

  // SVG icon paths
  let iconSvg = '';
  if (icon === 'logo') {
    iconSvg = `<polygon points="20,10 32,34 8,34" fill="${accent}" opacity="0.9" />`;
  } else if (icon === 'avatar') {
    iconSvg = `
      <circle cx="20" cy="15" r="7" fill="${accent}" opacity="0.8" />
      <path d="M8,33 C8,26 13,24 20,24 C27,24 32,26 32,33" fill="${accent}" opacity="0.8" />
    `;
  } else if (icon === 'metric') {
    iconSvg = `
      <rect x="8" y="22" width="6" height="12" fill="${accent}" rx="1" />
      <rect x="17" y="14" width="6" height="20" fill="${accent}" rx="1" />
      <rect x="26" y="8" width="6" height="26" fill="${accent}" rx="1" />
    `;
  } else {
    // Default image / banner landscape icon
    iconSvg = `
      <rect x="6" y="8" width="28" height="24" rx="3" fill="none" stroke="${accent}" stroke-width="2.5" />
      <circle cx="14" cy="15" r="2.5" fill="${accent}" />
      <path d="M8,28 L17,19 L23,25 L26,22 L32,28" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `;
  }

  const cleanTitle = escapeXml(title);
  const cleanSubtitle = subtitle ? escapeXml(subtitle) : `${width} × ${height}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.75" />
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="${bg}" />
    <rect width="${width}" height="${height}" fill="url(#grid)" />
    <rect width="${width}" height="${height}" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
    <g transform="translate(${Math.max(10, width / 2 - 20)}, ${Math.max(10, height / 2 - 32)})">
      ${iconSvg}
    </g>
    <text x="${width / 2}" y="${Math.max(30, height / 2 + 14)}" font-family="Calibri, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="${text}" text-anchor="middle">
      ${cleanTitle}
    </text>
    <text x="${width / 2}" y="${Math.max(45, height / 2 + 30)}" font-family="Calibri, -apple-system, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">
      ${cleanSubtitle}
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
