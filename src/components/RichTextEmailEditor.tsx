import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';

import { FontSize } from '../extensions/FontSize';
import { Toolbar } from './Toolbar';
import { TableControls } from './TableControls';
import { InsertTableModal } from './InsertTableModal';
import { InsertLinkModal } from './InsertLinkModal';

import { TablePreset, PredefinedText, EmailAttachment } from '../types';
import { DEFAULT_PREDEFINED_TEXTS } from '../data/defaultPredefinedTexts';
import { DEFAULT_ATTACHMENTS } from '../data/defaultAttachments';
import { AttachmentContextMenu } from './AttachmentContextMenu';
import {
  cleanHtmlForOutlook,
  convertHtmlToPlainText,
} from '../utils/outlookFormatter';
import { adaptPastedEmailHtml } from '../utils/pasteAdapter';
import {
  isMhtContent,
  parseMht,
  readFileAsMht,
  ParsedMhtResult,
} from '../utils/mhtParser';
import { isHtmlContent, wrapPlainTextInHtml } from '../utils/textToHtml';
import { MhtEmailHeader } from './MhtEmailHeader';
import { Upload, CheckCircle2 } from 'lucide-react';

export interface RichTextEmailEditorProps {
  /** Input parameter containing current HTML data, plain text, OR raw .mht/.mhtml email archive */
  value?: string;
  /** Fallback initial HTML data, plain text, or MHT content when value is not provided */
  defaultValue?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Additional container wrapper classes */
  className?: string;
  /** Minimum height for the editor canvas (default: '420px') */
  minHeight?: string;
  /** Read-only mode flag */
  readOnly?: boolean;

  /** Input parameter containing array of predefined text templates ({ id, label, text }) */
  predefinedTexts?: PredefinedText[];

  /** Input parameter containing array of available attachments ({ id, name, size, type }) */
  attachments?: EmailAttachment[];

  /** Callback emitting both formatted HTML and pure text content whenever content updates */
  onChange?: (data: { html: string; text: string }) => void;
  /** Callback emitting formatted HTML content */
  onChangeHtml?: (html: string) => void;
  /** Callback emitting pure plain text content */
  onChangeText?: (text: string) => void;

  /** Optional callback providing direct access to the underlying Tiptap Editor instance */
  onEditorReady?: (editor: Editor) => void;

  /** Optional callback triggered when an MHT email is loaded/parsed */
  onMhtLoaded?: (result: ParsedMhtResult) => void;
}

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || element.getAttribute('bgcolor') || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return {
            style: `background-color: ${attributes.backgroundColor};`,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return {
            style: attributes.style,
          };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || element.getAttribute('bgcolor') || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return {
            style: `background-color: ${attributes.backgroundColor};`,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return {
            style: attributes.style,
          };
        },
      },
    };
  },
});

const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return {
            style: attributes.style,
          };
        },
      },
    };
  },
});

export const RichTextEmailEditor: React.FC<RichTextEmailEditorProps> = ({
  value,
  defaultValue = '',
  placeholder = 'Compose your email body here...',
  className = '',
  minHeight = '420px',
  readOnly = false,
  predefinedTexts = DEFAULT_PREDEFINED_TEXTS,
  attachments = DEFAULT_ATTACHMENTS,
  onChange,
  onChangeHtml,
  onChangeText,
  onEditorReady,
  onMhtLoaded,
}) => {
  const [isInTable, setIsInTable] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // MHT Metadata state (subject, from, to, date, etc.)
  const [mhtMetadata, setMhtMetadata] = useState<ParsedMhtResult | null>(() => {
    const initialRaw = value !== undefined ? value : defaultValue;
    if (initialRaw && isMhtContent(initialRaw)) {
      return parseMht(initialRaw);
    }
    return null;
  });

  // Drag and Drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Right-click context menu state for attachments
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (readOnly || !editor) return;
    e.preventDefault();

    // Set cursor position at right-clicked location in editor
    const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (pos) {
      editor.chain().setTextSelection(pos.pos).focus().run();
    }
    setIsInTable(editor.isActive('table'));

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleSelectAttachment = (attachment: EmailAttachment) => {
    if (!editor) return;

    // Insert filename in square brackets [filename] at cursor
    editor.chain().focus().insertContent(` [${attachment.name}] `).run();
  };

  // Determine initial content: if MHT -> parse, if HTML -> use, if plain text -> wrap in HTML
  const initialContent = useMemo(() => {
    const raw = value !== undefined ? value : defaultValue;
    if (!raw) return '';
    if (isMhtContent(raw)) {
      const parsed = parseMht(raw);
      return parsed.html;
    }
    if (isHtmlContent(raw)) {
      return raw;
    }
    // Text provided as an input must be shown wrapped in HTML
    return wrapPlainTextInHtml(raw);
  }, []);

  // Track controlled value ref to prevent redundant updates
  const isFirstRenderRef = useRef(true);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #e20074; text-decoration: underline;',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      CustomTable.configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 12px 0;',
        },
      }),
      TableRow,
      CustomTableHeader.configure({
        HTMLAttributes: {
          style: 'padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #fdf2f8; font-weight: 600; text-align: left;',
        },
      }),
      CustomTableCell.configure({
        HTMLAttributes: {
          style: 'padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left;',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: `outline-none text-slate-800 text-sm leading-relaxed p-6 bg-white min-h-full flex-1 w-full max-w-full break-words overflow-wrap-break-word box-border`,
        style: `min-height: 100%; max-width: 100%; word-break: break-word; overflow-wrap: break-word;`,
      },
      transformPastedHTML(html) {
        return adaptPastedEmailHtml(html);
      },
    },
    onUpdate({ editor: currentEditor }) {
      const rawHtml = currentEditor.getHTML();
      const currentFont = currentEditor.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif';
      const cleaned = cleanHtmlForOutlook(rawHtml, currentFont);
      const pureText = convertHtmlToPlainText(rawHtml);

      // Trigger callbacks
      onChange?.({ html: cleaned, text: pureText });
      onChangeHtml?.(cleaned);
      onChangeText?.(pureText);
    },
    onSelectionUpdate({ editor: currentEditor }) {
      const active = currentEditor.isActive('table');
      setIsInTable((prev) => (prev !== active ? active : prev));
    },
  });

  // Notify parent component when editor instance is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync external controlled 'value' changes if updated outside
  useEffect(() => {
    if (!editor || value === undefined) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (isMhtContent(value)) {
      const parsed = parseMht(value);
      setMhtMetadata(parsed);
      editor.commands.setContent(parsed.html);
      onMhtLoaded?.(parsed);
      if (!readOnly && !editor.isEditable) {
        editor.setEditable(true);
      }
      return;
    }

    // If text provided as an input is plain text, it must be shown wrapped in HTML
    if (!isHtmlContent(value)) {
      const wrapped = wrapPlainTextInHtml(value);
      const currentRaw = editor.getHTML();
      if (wrapped !== currentRaw) {
        editor.commands.setContent(wrapped);
      }
      if (!readOnly && !editor.isEditable) {
        editor.setEditable(true);
      }
      return;
    }

    const currentRaw = editor.getHTML();
    if (value !== currentRaw) {
      editor.commands.setContent(value);
    }
    if (!readOnly && !editor.isEditable) {
      editor.setEditable(true);
    }
  }, [value, editor, onMhtLoaded, readOnly]);

  // Ensure editor is editable in any case
  useEffect(() => {
    if (editor) {
      const shouldBeEditable = !readOnly;
      if (editor.isEditable !== shouldBeEditable) {
        editor.setEditable(shouldBeEditable);
      }
    }
  }, [readOnly, editor]);

  // File loading helper (for drag-and-drop or manual file picking)
  const processUploadedFile = async (file: File) => {
    if (!editor) return;

    try {
      let isMht =
        file.name.endsWith('.mht') ||
        file.name.endsWith('.mhtml') ||
        file.name.endsWith('.eml') ||
        file.type.includes('multipart') ||
        file.type.includes('message');

      if (!isMht) {
        // Read small sample to detect MIME headers even if file extension is .txt, .dat, etc.
        try {
          const sample = await file.slice(0, 2048).text();
          if (isMhtContent(sample)) {
            isMht = true;
          }
        } catch {
          // ignore
        }
      }

      if (isMht) {
        const parsed = await readFileAsMht(file);
        setMhtMetadata(parsed);
        editor.commands.setContent(parsed.html);
        onMhtLoaded?.(parsed);
        setNotification(`Loaded Outlook email: ${file.name}`);
      } else {
        const text = await file.text();
        if (isHtmlContent(text)) {
          const adapted = adaptPastedEmailHtml(text);
          editor.commands.setContent(adapted);
          setNotification(`Loaded HTML document: ${file.name}`);
        } else {
          const wrapped = wrapPlainTextInHtml(text);
          editor.commands.setContent(wrapped);
          setNotification(`Loaded plain text (wrapped in HTML): ${file.name}`);
        }
      }

      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to parse uploaded file:', err);
      setNotification(`Failed to load file: ${file.name}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Drag and drop handlers - ONLY for external files from the user's computer
  const handleDragOver = (e: React.DragEvent) => {
    const isFileDrag = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
    if (!isFileDrag) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const isFileDrag = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
    if (!isFileDrag) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const isFileDrag = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
    if (!isFileDrag) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleInsertMhtHeaderIntoBody = () => {
    if (!editor || !mhtMetadata) return;

    const headerHtml = `
      <div style="border-bottom: 2px solid #e20074; padding: 12px 16px; margin-bottom: 16px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #334155; background-color: #fdf2f8; border-radius: 8px;">
        ${mhtMetadata.subject ? `<div style="font-size: 13pt; font-weight: bold; color: #9d174d; margin-bottom: 6px;">${mhtMetadata.subject}</div>` : ''}
        ${mhtMetadata.from ? `<div><b>From:</b> ${mhtMetadata.from}</div>` : ''}
        ${mhtMetadata.to ? `<div><b>To:</b> ${mhtMetadata.to}</div>` : ''}
        ${mhtMetadata.date ? `<div><b>Sent:</b> ${mhtMetadata.date}</div>` : ''}
      </div>
    `;

    editor.chain().focus().setTextSelection(0).insertContent(headerHtml).run();
    setMhtMetadata(null);
  };

  // Table Insertion Handler
  const handleInsertTable = (config: {
    rows: number;
    cols: number;
    withHeaderRow: boolean;
    preset: TablePreset;
  }) => {
    if (!editor) return;

    editor.chain().focus().insertTable({
      rows: config.rows,
      cols: config.cols,
      withHeaderRow: config.withHeaderRow,
    }).run();

    let bgHeader = '#fdf2f8';
    let borderStyle = '1px solid #cbd5e1';

    if (config.preset === 'striped') bgHeader = '#f1f5f9';
    if (config.preset === 'accent-header') bgHeader = '#e20074';
    if (config.preset === 'minimal') borderStyle = '1px solid #e2e8f0';

    if (config.preset === 'accent-header') {
      editor
        .chain()
        .focus()
        .setCellAttribute('backgroundColor', bgHeader)
        .run();
    }

    setIsInTable(true);
    setIsTableModalOpen(false);
  };

  // Link Insertion Handler
  const handleInsertLink = (url: string, text?: string) => {
    if (!editor) return;

    if (text) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    setIsLinkModalOpen(false);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Editor Toolbars */}
      {!readOnly && (
        <>
          <Toolbar
            editor={editor}
            isInTable={isInTable}
            onOpenTableModal={() => setIsTableModalOpen(true)}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
            predefinedTexts={predefinedTexts}
          />
          {isInTable && (
            <TableControls
              editor={editor}
            />
          )}
        </>
      )}

      {/* Outlook Email Header summary banner if MHT has metadata */}
      {mhtMetadata && (
        <MhtEmailHeader
          metadata={mhtMetadata}
          onInsertIntoBody={handleInsertMhtHeaderIntoBody}
          onDismiss={() => setMhtMetadata(null)}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-14 right-4 z-40 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-from-top-1 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] border-3 border-dashed border-magenta-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-magenta-200 flex flex-col items-center gap-3 max-w-md">
            <div className="w-14 h-14 rounded-full bg-magenta-100 flex items-center justify-center text-magenta-600">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Drop Outlook .MHT Email Here</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Release your file to instantly parse the email body, tables, formatting, and inline images into this editable rich text editor.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-magenta-700 bg-magenta-50 px-2.5 py-1 rounded-full border border-magenta-200">
                Supports: .mht, .mhtml, .eml, .html, .txt
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        className="flex-1 p-2 sm:p-4 bg-slate-100/60 overflow-y-auto cursor-text flex flex-col min-h-0 min-w-0"
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          if (editor && !readOnly && e.target === e.currentTarget) {
            // Only focus at the end if the user clicked the blank gray margin AND has no active selection
            if (editor.state.selection.empty) {
              editor.commands.focus('end');
            }
          }
        }}
      >
        <div className="w-full flex-1 flex flex-col bg-white rounded-xl shadow-md border border-slate-200/80 transition-all min-h-full min-w-0 max-w-full overflow-hidden cursor-text">
          <EditorContent
            editor={editor}
            className="flex-1 flex flex-col min-h-full w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden cursor-text"
          />
        </div>
      </div>

      {/* Attachment Right-Click Context Menu */}
      <AttachmentContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        editor={editor}
        isInTable={isInTable}
        attachments={attachments}
        onSelect={handleSelectAttachment}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
      />

      {/* Insert Table Modal */}
      <InsertTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={handleInsertTable}
      />

      {/* Insert Link Modal */}
      <InsertLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={handleInsertLink}
        initialUrl={editor?.getAttributes('link').href || ''}
        initialText={
          editor?.state.selection.empty
            ? ''
            : editor?.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                ' '
              ) || ''
        }
      />
    </div>
  );
};

