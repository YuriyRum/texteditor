import React, { useRef, useState, useMemo } from 'react';
import { Tag, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { extractPlaceholders } from '../../utils/placeholderEngine';
import { InsertPlaceholderModal } from '../InsertPlaceholderModal';

const MAX_SUBJECT_LENGTH = 255;

interface SubjectBuilderProps {
  subject: string;
  onChangeSubject: (newSubject: string) => void;
  onInsertPlaceholderIntoSubject?: (key: string) => void;
}

export const SubjectBuilder: React.FC<SubjectBuilderProps> = React.memo(({
  subject,
  onChangeSubject,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract detected placeholders in subject (&key&)
  const detectedPlaceholders = useMemo(() => extractPlaceholders(subject), [subject]);

  const handleInsertPlaceholder = (token: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }

    if (!inputRef.current) {
      const updated = subject ? `${subject} ${token}` : token;
      onChangeSubject(updated.slice(0, MAX_SUBJECT_LENGTH));
      return;
    }

    const input = inputRef.current;
    const start = input.selectionStart ?? subject.length;
    const end = input.selectionEnd ?? subject.length;
    const prefix = start > 0 && subject[start - 1] !== ' ' && subject[start - 1] !== '[' ? ' ' : '';
    const suffix = end < subject.length && subject[end] !== ' ' ? ' ' : '';
    const newText = (
      subject.substring(0, start) +
      prefix +
      token +
      suffix +
      subject.substring(end)
    ).slice(0, MAX_SUBJECT_LENGTH);
    onChangeSubject(newText);

    setTimeout(() => {
      input.focus();
      const cursor = Math.min(start + prefix.length + token.length, MAX_SUBJECT_LENGTH);
      input.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const handleExpandAndFocus = () => {
    setIsCollapsed(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
  };

  const charLength = subject.length;
  const isOptimalLength = charLength > 0 && charLength < MAX_SUBJECT_LENGTH;
  const isAtLimit = charLength >= MAX_SUBJECT_LENGTH;

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-1.5 shrink-0 transition-all">
      {isCollapsed ? (
        /* Collapsed Slim Bar */
        <div className="flex items-center justify-between gap-2 min-h-[28px]">
          <button
            type="button"
            onClick={handleExpandAndFocus}
            className="flex items-center gap-2 text-left flex-1 min-w-0 group cursor-pointer py-0.5"
            title="Click to expand and edit subject line"
          >
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-magenta-700 uppercase tracking-wider shrink-0">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-magenta-600 transition-transform" />
              <Tag className="w-3.5 h-3.5 text-magenta-600" />
              <span>Subject:</span>
            </span>

            {subject ? (
              <span className="text-xs font-mono text-slate-800 truncate bg-slate-50 group-hover:bg-magenta-50/50 px-2 py-0.5 rounded border border-slate-200/80 group-hover:border-magenta-200 transition-colors flex-1 min-w-0">
                {subject}
              </span>
            ) : (
              <span className="text-xs italic text-slate-400 truncate">
                No subject set — click to edit...
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {detectedPlaceholders.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-magenta-50 text-magenta-700 border border-magenta-200">
                {detectedPlaceholders.length} {detectedPlaceholders.length === 1 ? 'var' : 'vars'}
              </span>
            )}

            <span
              className={`text-[11px] font-medium tabular-nums ${
                isAtLimit
                  ? 'text-amber-600 font-bold'
                  : isOptimalLength
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              {charLength}/{MAX_SUBJECT_LENGTH}
            </span>

            <button
              type="button"
              onClick={handleExpandAndFocus}
              className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-magenta-700 bg-slate-100 hover:bg-magenta-50 rounded border border-slate-200 hover:border-magenta-200 transition-colors cursor-pointer"
            >
              Expand
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Compact Subject Editor */
        <div className="flex flex-col gap-1.5 py-0.5">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Collapse Toggle & Label */}
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-magenta-700 uppercase tracking-wider shrink-0 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-100 transition-colors"
              title="Collapse subject line editor"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              <Tag className="w-3.5 h-3.5 text-magenta-600" />
              <span>Subject</span>
            </button>

            {/* Main Subject Line Input */}
            <div className="relative flex items-center flex-1 min-w-[200px]">
              <input
                ref={inputRef}
                type="text"
                maxLength={MAX_SUBJECT_LENGTH}
                value={subject}
                onChange={(e) => onChangeSubject(e.target.value.slice(0, MAX_SUBJECT_LENGTH))}
                placeholder="e.g. Project Update &Project Name& - Milestone Review &Due Date&"
                className="w-full pl-2.5 pr-16 py-1.5 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500 transition-all font-mono"
              />

              {/* Character Counter inside Input */}
              <div className="absolute right-2.5 flex items-center pointer-events-none">
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    isAtLimit
                      ? 'text-amber-600 font-bold'
                      : isOptimalLength
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {charLength}/{MAX_SUBJECT_LENGTH}
                </span>
              </div>
            </div>

            {/* Right Actions: Insert Placeholder & Collapse */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsInsertModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-magenta-700 bg-magenta-50 hover:bg-magenta-100 rounded-lg border border-magenta-200 shadow-2xs transition-colors cursor-pointer"
                title="Insert dynamic placeholder into subject line"
              >
                <Tag className="w-3.5 h-3.5 text-magenta-600" />
                <span>+ Placeholder</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                title="Collapse Subject Line"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Detected Placeholders Badges (Compact single line if present) */}
          {detectedPlaceholders.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pl-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Subject Vars:
              </span>
              {detectedPlaceholders.map((ph) => (
                <span
                  key={ph}
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-magenta-50 text-magenta-700 border border-magenta-200"
                >
                  &amp;{ph}&amp;
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insert Placeholder Modal with Manual ID Input */}
      <InsertPlaceholderModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        targetName="subject line"
        onInsert={(token) => handleInsertPlaceholder(token)}
      />
    </div>
  );
});
