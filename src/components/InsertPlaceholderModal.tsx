import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { formatPlaceholderToken } from '../utils/placeholderEngine';

interface InsertPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (token: string, id: string) => void;
  targetName?: string; // 'editor' | 'subject' | 'template'
}

export const InsertPlaceholderModal: React.FC<InsertPlaceholderModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  targetName = 'email',
}) => {
  const [placeholderId, setPlaceholderId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPlaceholderId('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clean formatted preview token: &id&
  const cleanKey = placeholderId.replace(/^[{&\s]+|[{&\s]+$/g, '').trim();
  const previewToken = cleanKey ? `&${cleanKey}&` : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanKey) {
      setError('Please provide a placeholder ID.');
      inputRef.current?.focus();
      return;
    }

    const token = formatPlaceholderToken(cleanKey);
    onInsert(token, cleanKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-magenta-100 flex items-center justify-center text-magenta-600">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Insert Placeholder</h3>
              <p className="text-xs text-slate-500">
                Provide the placeholder ID manually
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Placeholder ID / Variable Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono font-bold text-magenta-600 text-sm select-none">
                &amp;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={placeholderId}
                onChange={(e) => {
                  setPlaceholderId(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. recipient_name, due_date, client_id"
                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500 font-mono text-slate-900 bg-white"
              />
              <span className="absolute right-3 font-mono font-bold text-magenta-600 text-sm select-none">
                &amp;
              </span>
            </div>
            {error ? (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-500">
                Type the variable name (e.g. <code>customer_name</code>). Delimiters <code>&amp;&amp;</code> are added automatically.
              </p>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Format in {targetName}:</span>
              <span className="text-[10px] text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full border border-magenta-200 font-semibold">
                Single &amp;&amp; format
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-magenta-700 bg-white px-3 py-1.5 rounded-lg border border-magenta-200 truncate">
              {previewToken ? previewToken : <span className="text-slate-400 font-normal italic">&amp;placeholder_id&amp;</span>}
            </div>
          </div>

          {/* Notice: No {{}} */}
          <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Placeholders in editor are formatted as <code>&amp;id&amp;</code>, replacing legacy <code>{"{{id}}"}</code>.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!cleanKey}
              className="px-4 py-1.5 text-xs font-bold text-white bg-magenta-600 hover:bg-magenta-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Insert Placeholder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
