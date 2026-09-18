import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Link2,
  Highlighter,
  Palette,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
  Type,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlertCircle,
  FileText,
} from 'lucide-react';

import { EMAIL_FONTS, FONT_SIZES, COLOR_PALETTE } from '../utils/outlookFormatter';
import { PredefinedText } from '../types';

interface ToolbarProps {
  editor: Editor | null;
  isInTable?: boolean;
  onOpenTableModal: () => void;
  onOpenLinkModal: () => void;
  predefinedTexts?: PredefinedText[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  isInTable = false,
  onOpenTableModal,
  onOpenLinkModal,
  predefinedTexts = [],
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Keep track of non-empty text selections
  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { selection } = editor.state;
      if (!selection.empty) {
        lastSelectionRef.current = { from: selection.from, to: selection.to };
      }
    };

    editor.on('selectionUpdate', updateSelection);
    editor.on('transaction', updateSelection);

    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('transaction', updateSelection);
    };
  }, [editor]);

  if (!editor) return null;

  const showNoSelectionWarning = () => {
    setSelectionNotice('Select text first to apply formatting');
    setTimeout(() => {
      setSelectionNotice(null);
    }, 2500);
  };

  /**
   * Helper that ensures formatting changes are strictly applied ONLY to the selected text range.
   */
  const runOnSelection = (action: (chain: ReturnType<typeof editor.chain>) => void) => {
    if (!editor) return;

    const currentSelection = editor.state.selection;
    let targetRange: { from: number; to: number } | null = null;

    if (!currentSelection.empty) {
      targetRange = { from: currentSelection.from, to: currentSelection.to };
    } else if (lastSelectionRef.current) {
      targetRange = lastSelectionRef.current;
    }

    if (!targetRange || targetRange.from === targetRange.to) {
      showNoSelectionWarning();
      return;
    }

    // Explicitly scope the chain operation to the text selection range
    const chain = editor.chain().focus().setTextSelection(targetRange);
    action(chain);
  };

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '11pt';

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    runOnSelection((chain) => {
      if (val === 'reset') {
        chain.unsetFontFamily().run();
      } else {
        chain.setFontFamily(val).run();
      }
    });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    runOnSelection((chain) => {
      if (val === 'reset') {
        chain.unsetFontSize().run();
      } else {
        chain.setFontSize(val).run();
      }
    });
  };

  const setTextColor = (color: string) => {
    runOnSelection((chain) => {
      chain.setColor(color).run();
    });
    setShowColorPicker(false);
  };

  const setHighlightColor = (color: string) => {
    runOnSelection((chain) => {
      chain.toggleHighlight({ color }).run();
    });
    setShowHighlightPicker(false);
  };

  const handlePredefinedTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId || !editor) return;

    const snippet = predefinedTexts.find((item) => item.id === selectedId);
    if (snippet && snippet.text) {
      editor.chain().focus().insertContent(snippet.text).run();
    }

    // Reset dropdown selection so it can be re-triggered
    e.target.value = '';
  };

  return (
    <div className="relative bg-white border-b border-slate-200 p-2 flex flex-wrap items-center gap-1.5 text-slate-700 select-none shadow-2xs">
      {/* Optional selection warning toast */}
      {selectionNotice && (
        <div className="absolute top-full left-4 mt-2 z-50 bg-amber-950 text-amber-100 text-xs px-3 py-1.5 rounded-lg shadow-lg border border-amber-800 flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{selectionNotice}</span>
        </div>
      )}

      {/* Font Family Selector */}
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
        <Type className="w-3.5 h-3.5 text-slate-400 pl-0.5" />
        <select
          value={currentFontFamily}
          onChange={handleFontFamilyChange}
          className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
          title="Font Family (Applies to selected text)"
        >
          {EMAIL_FONTS.map((font) => (
            <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size Selector */}
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
        <select
          value={currentFontSize}
          onChange={handleFontSizeChange}
          className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
          title="Font Size (Applies to selected text)"
        >
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      {/* Predefined Text Snippets Selector */}
      {predefinedTexts && predefinedTexts.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-magenta-600 pl-0.5 shrink-0" />
          <select
            defaultValue=""
            onChange={handlePredefinedTextChange}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer max-w-[170px] truncate"
            title="Insert Predefined Text / Template"
          >
            <option value="" disabled hidden>
              Insert Predefined Text...
            </option>
            {predefinedTexts.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Formatting Marks (Bold, Italic, Underline, Strikethrough, Subscript, Superscript) */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleBold().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('bold') ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Bold (Applies to selected text)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleItalic().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('italic') ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Italic (Applies to selected text)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleUnderline().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('underline') ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Underline (Applies to selected text)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleStrike().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('strike') ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Strikethrough (Applies to selected text)"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleSubscript().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('subscript') ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Subscript (Applies to selected text)"
        >
          <SubscriptIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleSuperscript().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('superscript') ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Superscript (Applies to selected text)"
        >
          <SuperscriptIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Colors (Text Color & Highlight) */}
      <div className="flex items-center gap-1 relative">
        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="p-1.5 rounded hover:bg-slate-100 flex items-center gap-1"
            title="Text Color (Applies to selected text)"
          >
            <Palette className="w-4 h-4 text-slate-700" />
            <div
              className="w-3 h-3 rounded-full border border-slate-300 -ml-0.5"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute left-0 mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-52 animate-in fade-in duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Font Color
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTextColor(c)}
                    className="w-7 h-7 rounded border border-slate-200 hover:scale-110 transition shadow-2xs"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Custom Color</span>
                <input
                  type="color"
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className={`p-1.5 rounded hover:bg-slate-100 flex items-center gap-1 ${
              editor.isActive('highlight') ? 'bg-magenta-100 text-magenta-700' : ''
            }`}
            title="Text Highlight Background (Applies to selected text)"
          >
            <Highlighter className="w-4 h-4 text-magenta-600" />
          </button>

          {showHighlightPicker && (
            <div className="absolute left-0 mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-48 animate-in fade-in duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Highlight Color
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['#fce7f3', '#ffff00', '#a6f4d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setHighlightColor(c)}
                    className="w-8 h-8 rounded border border-slate-200 hover:scale-105 transition"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  runOnSelection((chain) => chain.unsetHighlight().run());
                  setShowHighlightPicker(false);
                }}
                className="mt-2.5 w-full py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
              >
                Clear Highlight
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Headings */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleHeading({ level: 1 }).run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Heading 1 (Applies to selection)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleHeading({ level: 2 }).run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Heading 2 (Applies to selection)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleHeading({ level: 3 }).run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Heading 3 (Applies to selection)"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.setTextAlign('left').run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Align Left (Applies to selection)"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.setTextAlign('center').run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Align Center (Applies to selection)"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.setTextAlign('right').run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Align Right (Applies to selection)"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.setTextAlign('justify').run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Justify (Applies to selection)"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleBulletList().run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('bulletList') ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleOrderedList().run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('orderedList') ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Insertables: Table, Link */}
      <div className="flex items-center gap-1">
        {/* Table Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenTableModal}
          className="p-1.5 rounded hover:bg-magenta-100 text-magenta-700 font-semibold flex items-center gap-1 text-xs border border-magenta-200 bg-magenta-50/50 cursor-pointer transition"
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4 text-magenta-600" />
          <span className="hidden sm:inline">Table</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenLinkModal}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive('link') ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Insert Link"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-slate-100"
          title="Horizontal Divider Line"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto mx-0.5" />

      {/* Undo/Redo & Clear Formatting */}
      <div className="flex items-center gap-0.5 ml-auto">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.clearNodes().unsetAllMarks().run())}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
          title="Clear Formatting on Selected Text"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
