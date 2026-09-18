import React from 'react';
import { Mail, Calendar, User, Send, Paperclip, X, CornerDownRight } from 'lucide-react';
import { ParsedMhtResult } from '../utils/mhtParser';

interface MhtEmailHeaderProps {
  metadata: ParsedMhtResult;
  onInsertIntoBody?: () => void;
  onDismiss?: () => void;
}

export const MhtEmailHeader: React.FC<MhtEmailHeaderProps> = ({
  metadata,
  onInsertIntoBody,
  onDismiss,
}) => {
  const { subject, from, to, date, attachments } = metadata;
  if (!subject && !from && !to && (!attachments || attachments.length === 0)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 via-slate-50/80 to-pink-50/30 border-b border-slate-200/80 px-4 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 shrink-0">
          <Mail className="w-3.5 h-3.5 text-magenta-600" />
          <span className="truncate max-w-[280px] sm:max-w-md font-medium text-sm">
            {subject || 'Outlook Email (Imported)'}
          </span>
        </div>

        {from && (
          <div className="flex items-center gap-1 text-slate-600 truncate max-w-xs">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-400">From:</span>
            <span className="truncate font-medium">{from}</span>
          </div>
        )}

        {to && (
          <div className="hidden md:flex items-center gap-1 text-slate-600 truncate max-w-xs">
            <Send className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-400">To:</span>
            <span className="truncate font-medium">{to}</span>
          </div>
        )}

        {date && (
          <div className="hidden lg:flex items-center gap-1 text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{date}</span>
          </div>
        )}

        {attachments && attachments.length > 0 && (
          <div className="flex items-center gap-1 text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full font-medium text-[11px] border border-magenta-100">
            <Paperclip className="w-3 h-3" />
            <span>{attachments.length} {attachments.length === 1 ? 'asset/image' : 'assets/images'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {onInsertIntoBody && (
          <button
            type="button"
            onClick={onInsertIntoBody}
            className="flex items-center gap-1 text-[11px] text-magenta-700 hover:text-magenta-800 bg-white hover:bg-magenta-50/50 border border-slate-200 px-2 py-1 rounded shadow-2xs font-medium transition-colors cursor-pointer"
            title="Insert Subject and Header metadata into the top of the email body"
          >
            <CornerDownRight className="w-3 h-3 text-magenta-600" />
            <span className="hidden sm:inline">Add to Body</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 transition-colors"
            title="Dismiss Header Info"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
