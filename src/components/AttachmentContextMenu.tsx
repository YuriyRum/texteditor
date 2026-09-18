import React, { useEffect, useRef } from 'react';
import {
  Paperclip,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Rows3,
  Columns3,
  Trash2,
  Table as TableIcon,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { EmailAttachment } from '../types';

interface AttachmentContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  editor?: Editor | null;
  isInTable?: boolean;
  attachments: EmailAttachment[];
  onSelect: (attachment: EmailAttachment) => void;
  onClose: () => void;
}

export const AttachmentContextMenu: React.FC<AttachmentContextMenuProps> = ({
  isOpen,
  x,
  y,
  editor,
  isInTable = false,
  attachments,
  onSelect,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Ensure menu stays inside window viewport boundaries
  const menuWidth = 260;
  const menuHeight = isInTable ? 380 : Math.min(320, attachments.length * 48 + 60);

  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 12);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 12);

  const getFileIcon = (type?: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (type === 'pdf' || ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (type === 'doc' || ext === 'docx' || ext === 'doc') return <FileText className="w-4 h-4 text-blue-500" />;
    if (type === 'spreadsheet' || ext === 'xlsx' || ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (type === 'image' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="w-4 h-4 text-purple-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 py-1.5 animate-in fade-in zoom-in-95 duration-100 select-none overflow-hidden text-xs"
    >
      {/* Context Table Operations if right clicked inside a table */}
      {isInTable && editor && (
        <div className="border-b border-slate-100 pb-1 mb-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-magenta-700 bg-magenta-50/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" /> Table Actions
            </span>
          </div>

          <div className="py-0.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().addRowBefore().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-magenta-50 flex items-center gap-2 text-slate-700 transition"
            >
              <Rows3 className="w-3.5 h-3.5 text-magenta-600 shrink-0" />
              <span>Insert Row Above</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().addRowAfter().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-magenta-50 flex items-center gap-2 text-slate-700 transition"
            >
              <Rows3 className="w-3.5 h-3.5 text-magenta-600 shrink-0" />
              <span>Insert Row Below</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().deleteRow().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Delete Row</span>
            </button>

            <div className="h-[1px] bg-slate-100 my-1" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().addColumnBefore().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-magenta-50 flex items-center gap-2 text-slate-700 transition"
            >
              <Columns3 className="w-3.5 h-3.5 text-magenta-600 shrink-0" />
              <span>Insert Column Left</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-magenta-50 flex items-center gap-2 text-slate-700 transition"
            >
              <Columns3 className="w-3.5 h-3.5 text-magenta-600 shrink-0" />
              <span>Insert Column Right</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().deleteColumn().run();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Delete Column</span>
            </button>

            <div className="h-[1px] bg-slate-100 my-1" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                if (editor.isEmpty) {
                  editor.commands.setContent('<p></p>');
                  editor.commands.focus('start');
                }
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-rose-100 flex items-center gap-2 text-rose-700 font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Delete Entire Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Attachment Tag Header */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-magenta-600" />
          <span>Insert Attachment Tag</span>
        </div>
        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded font-mono">
          [filename]
        </span>
      </div>

      <div className="max-h-60 overflow-y-auto py-1">
        {attachments.length === 0 ? (
          <div className="px-3 py-3 text-xs text-slate-400 italic text-center">
            No attachments available
          </div>
        ) : (
          attachments.map((att) => (
            <button
              key={att.id}
              type="button"
              onClick={() => {
                onSelect(att);
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-magenta-50 hover:text-magenta-900 flex items-center justify-between group transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate pr-2">
                <div className="shrink-0 p-1 rounded bg-slate-100 group-hover:bg-white transition">
                  {getFileIcon(att.type, att.name)}
                </div>
                <div className="truncate">
                  <div className="font-medium truncate group-hover:text-magenta-800">
                    [{att.name}]
                  </div>
                  {att.size && (
                    <div className="text-[10px] text-slate-400 group-hover:text-magenta-600">
                      {att.size}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
