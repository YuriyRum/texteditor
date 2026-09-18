import React, { useState } from 'react';
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
} from 'lucide-react';

interface TableControlsProps {
  editor: Editor | null;
  onCloseTableToolbar?: () => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  editor,
}) => {
  const [showShadingPicker, setShowShadingPicker] = useState(false);

  if (!editor || !editor.isActive('table')) {
    return null;
  }

  const handleCellBgColor = (color: string) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setShowShadingPicker(false);
  };

  const handleDeleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
    if (editor.isEmpty) {
      editor.commands.setContent('<p></p>');
      editor.commands.focus('start');
    }
  };

  return (
    <div className="bg-gradient-to-r from-magenta-50/90 via-pink-50/40 to-slate-50 border-b border-magenta-200 px-3 py-1.5 flex flex-wrap items-center gap-2 text-slate-700 select-none shadow-xs text-xs animate-in fade-in duration-100">
      {/* Table Editor Header Badge */}
      <div className="flex items-center gap-1.5 bg-magenta-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-xs">
        <TableIcon className="w-3.5 h-3.5" />
        <span>Table Selected</span>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Row Operations */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-slate-500 mr-0.5">Rows:</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Add Row Above"
        >
          <Rows3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Above</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Add Row Below"
        >
          <Rows3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Below</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded text-rose-600 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Delete Current Row"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Row</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Column Operations */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-slate-500 mr-0.5">Cols:</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Add Column Left"
        >
          <Columns3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Left</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Add Column Right"
        >
          <Columns3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Right</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded text-rose-600 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Delete Current Column"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Col</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Cell Operations */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Merge Selected Cells"
        >
          <Combine className="w-3.5 h-3.5 text-magenta-600" />
          <span>Merge</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().splitCell().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs"
          title="Split Merged Cell"
        >
          <Split className="w-3.5 h-3.5 text-magenta-600" />
          <span>Split</span>
        </button>

        {/* Cell Shading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowShadingPicker(!showShadingPicker)}
            className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1.5 transition shadow-2xs"
            title="Cell Background Color / Shading"
          >
            <PaintBucket className="w-3.5 h-3.5 text-magenta-600" />
            <span>Shading</span>
          </button>

          {showShadingPicker && (
            <div className="absolute left-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-44 animate-in fade-in duration-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Cell Shading
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { label: 'White', color: '#ffffff' },
                  { label: 'Light Magenta', color: '#fdf2f8' },
                  { label: 'Medium Magenta', color: '#fce7f3' },
                  { label: 'Slate', color: '#f8fafc' },
                  { label: 'Light Yellow', color: '#fff4ce' },
                  { label: 'Light Blue', color: '#eff6fc' },
                  { label: 'Light Green', color: '#e6f2ed' },
                  { label: 'Dark Gray', color: '#334155' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCellBgColor(item.color)}
                    className="w-8 h-8 rounded border border-slate-300 hover:scale-110 transition shadow-2xs"
                    style={{ backgroundColor: item.color }}
                    title={item.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-600">Custom:</span>
                <input
                  type="color"
                  onChange={(e) => handleCellBgColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                  title="Choose custom background color"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Table Action (Clear & Prominent in Red) */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="hidden xl:inline text-[11px] text-slate-500 italic">
          Tip: Tab to move cell, Shift+Tab previous
        </span>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDeleteTable}
          className="px-3 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-semibold rounded-md border border-rose-300 hover:border-rose-600 flex items-center gap-1.5 text-xs transition shadow-2xs cursor-pointer"
          title="Remove Entire Table from Document"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          <span>Delete Table</span>
        </button>
      </div>
    </div>
  );
};
