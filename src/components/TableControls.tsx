import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Rows3,
  Columns3,
  Plus,
  Trash2,
  Table as TableIcon,
  Combine,
  PaintBucket,
  Split,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  ArrowLeftRight,
  AlertCircle,
} from 'lucide-react';
import { COLOR_PALETTE } from '../utils/outlookFormatter';

interface TableControlsProps {
  editor: Editor | null;
  onOpenTableModal?: () => void;
  onOpenLinkModal?: () => void;
  onToggleMainToolbar?: () => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  editor,
  onToggleMainToolbar,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);

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

  if (!editor || !editor.isActive('table')) {
    return null;
  }

  const showNoSelectionWarning = () => {
    setSelectionNotice('Select cell text first to format');
    setTimeout(() => {
      setSelectionNotice(null);
    }, 2500);
  };

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

    const chain = editor.chain().focus().setTextSelection(targetRange);
    action(chain);
  };

  const handleCellBgColor = (color: string) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
  };

  const setTextColor = (color: string) => {
    runOnSelection((chain) => {
      chain.setColor(color).run();
    });
    setShowColorPicker(false);
  };

  return (
    <div className="relative bg-white border-b border-magenta-200 p-2 flex flex-wrap items-center gap-2 text-slate-700 select-none shadow-2xs">
      {/* Selection warning toast inside TableControls */}
      {selectionNotice && (
        <div className="absolute top-full left-4 mt-2 z-50 bg-amber-950 text-amber-100 text-xs px-3 py-1.5 rounded-lg shadow-lg border border-amber-800 flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{selectionNotice}</span>
        </div>
      )}

      {/* Table Editor Header Badge */}
      <div className="flex items-center gap-1.5 bg-magenta-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs">
        <TableIcon className="w-3.5 h-3.5" />
        <span>Table Editor Toolbar</span>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto" />

      {/* Basic Text Formatting within Table Cell */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.toggleBold().run())}
          className={`p-1.5 rounded hover:bg-magenta-50 ${
            editor.isActive('bold') ? 'bg-magenta-100 text-magenta-700 font-bold' : ''
          }`}
          title="Bold Cell Text (Applies to selection)"
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
          title="Italic Cell Text (Applies to selection)"
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
          title="Underline Cell Text (Applies to selection)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runOnSelection((chain) => chain.setTextAlign('left').run())}
          className={`p-1.5 rounded hover:bg-slate-100 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-magenta-100 text-magenta-700' : ''
          }`}
          title="Align Left"
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
          title="Align Center"
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
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Font Color */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1.5 rounded hover:bg-slate-100 flex items-center gap-1"
          title="Cell Text Color"
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
              Text Color
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
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto" />

      {/* Row Operations */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="p-1.5 hover:bg-magenta-50 rounded text-slate-700 flex items-center gap-1 text-xs font-medium"
          title="Add Row Above"
        >
          <Rows3 className="w-4 h-4 text-magenta-600" />
          <Plus className="w-3 h-3 text-magenta-600 -ml-1" />
          <span className="hidden lg:inline">Row Above</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="p-1.5 hover:bg-magenta-50 rounded text-slate-700 flex items-center gap-1 text-xs font-medium"
          title="Add Row Below"
        >
          <Rows3 className="w-4 h-4 text-magenta-600" />
          <Plus className="w-3 h-3 text-magenta-600 -ml-1" />
          <span className="hidden lg:inline">Row Below</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="p-1.5 hover:bg-rose-50 rounded text-rose-600"
          title="Delete Current Row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto" />

      {/* Column Operations */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="p-1.5 hover:bg-magenta-50 rounded text-slate-700 flex items-center gap-1 text-xs font-medium"
          title="Add Column Left"
        >
          <Columns3 className="w-4 h-4 text-magenta-600" />
          <Plus className="w-3 h-3 text-magenta-600 -ml-1" />
          <span className="hidden lg:inline">Col Left</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="p-1.5 hover:bg-magenta-50 rounded text-slate-700 flex items-center gap-1 text-xs font-medium"
          title="Add Column Right"
        >
          <Columns3 className="w-4 h-4 text-magenta-600" />
          <Plus className="w-3 h-3 text-magenta-600 -ml-1" />
          <span className="hidden lg:inline">Col Right</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="p-1.5 hover:bg-rose-50 rounded text-rose-600"
          title="Delete Current Column"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto" />

      {/* Cell Operations */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="px-2 py-1 hover:bg-magenta-50 rounded text-xs font-semibold text-magenta-800 flex items-center gap-1"
          title="Merge Selected Cells"
        >
          <Combine className="w-3.5 h-3.5" />
          <span>Merge</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().splitCell().run()}
          className="px-2 py-1 hover:bg-magenta-50 rounded text-xs font-semibold text-magenta-800 flex items-center gap-1"
          title="Split Merged Cell"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 my-auto" />

      {/* Cell Background Shading */}
      <div className="flex items-center gap-1.5" title="Cell Background Color">
        <PaintBucket className="w-4 h-4 text-magenta-600" />
        <div className="flex items-center gap-1">
          {['#ffffff', '#fdf2f8', '#fce7f3', '#f8fafc', '#fff4ce', '#f1f5f9'].map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleCellBgColor(c)}
              className="w-4 h-4 rounded-xs border border-slate-300 hover:scale-110 transition shrink-0"
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            onChange={(e) => handleCellBgColor(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer border border-slate-300 p-0"
            title="Custom Shading Color"
          />
        </div>
      </div>

      {/* Right-aligned actions */}
      <div className="flex items-center gap-2 ml-auto">
        {onToggleMainToolbar && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleMainToolbar}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 transition"
            title="Switch to Standard Rich Text Toolbar"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Text Toolbar</span>
          </button>
        )}

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 flex items-center gap-1 text-xs transition"
          title="Delete Entire Table"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Table</span>
        </button>
      </div>
    </div>
  );
};
