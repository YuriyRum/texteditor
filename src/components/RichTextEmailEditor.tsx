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

export interface RichTextEmailEditorProps {
  /** Input parameter containing current HTML data / content */
  value?: string;
  /** Fallback initial HTML data when value is not provided */
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
}

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
}) => {
  const [showMainToolbarInTable, setShowMainToolbarInTable] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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

  // Determine initial content
  const initialContent = value !== undefined ? value : defaultValue;

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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 12px 0;',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          style: 'padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #fdf2f8; font-weight: 600; text-align: left;',
        },
      }),
      TableCell.configure({
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
        class: `outline-none text-slate-800 text-sm leading-relaxed p-6 bg-white min-h-[${minHeight}]`,
        style: `min-height: ${minHeight};`,
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

    const currentRaw = editor.getHTML();
    if (value !== currentRaw) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Sync readOnly prop
  useEffect(() => {
    if (editor && editor.isEditable === readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Reset toolbar override when selection leaves table
  const isInTable = editor?.isActive('table');
  useEffect(() => {
    if (!isInTable) {
      setShowMainToolbarInTable(false);
    }
  }, [isInTable]);

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
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      {/* Contextual Editor Toolbar */}
      {!readOnly && (
        isInTable && !showMainToolbarInTable ? (
          <TableControls
            editor={editor}
            onToggleMainToolbar={() => setShowMainToolbarInTable(true)}
          />
        ) : (
          <Toolbar
            editor={editor}
            onOpenTableModal={() => setIsTableModalOpen(true)}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
            predefinedTexts={predefinedTexts}
          />
        )
      )}

      {/* Canvas */}
      <div
        className="flex-1 p-2 sm:p-6 bg-slate-100/60 overflow-y-auto cursor-text"
        onContextMenu={handleContextMenu}
      >
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden transition-all">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Attachment Right-Click Context Menu */}
      <AttachmentContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
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
