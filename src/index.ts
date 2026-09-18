export { RichTextEmailEditor } from './components/RichTextEmailEditor';
export type { RichTextEmailEditorProps } from './components/RichTextEmailEditor';
export { Toolbar } from './components/Toolbar';
export { TableControls } from './components/TableControls';
export { MhtEmailHeader } from './components/MhtEmailHeader';

export {
  isMhtContent,
  parseMht,
  readFileAsMht,
} from './utils/mhtParser';
export type { ParsedMhtResult } from './utils/mhtParser';

export {
  cleanHtmlForOutlook,
  convertHtmlToPlainText,
  copyRichTextToClipboard,
  EMAIL_FONTS,
  FONT_SIZES,
  COLOR_PALETTE,
} from './utils/outlookFormatter';

export {
  wrapPlainTextInHtml,
  isHtmlContent,
  escapeHtml,
} from './utils/textToHtml';

export { ViewHtmlModal } from './components/ViewHtmlModal';
export { adaptPastedEmailHtml } from './utils/pasteAdapter';

export * from './types';
