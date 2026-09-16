import React, { useState, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles } from 'lucide-react';

import { RichTextEmailEditor } from './components/RichTextEmailEditor';
import { PredefinedText, EmailAttachment } from './types';
import { DEFAULT_PREDEFINED_TEXTS } from './data/defaultPredefinedTexts';
import { DEFAULT_ATTACHMENTS } from './data/defaultAttachments';

export default function App() {
  const [predefinedTextsList] = useState<PredefinedText[]>(DEFAULT_PREDEFINED_TEXTS);
  const [attachmentsList] = useState<EmailAttachment[]>(DEFAULT_ATTACHMENTS);

  const defaultInitialContent = `
    <h2 style="color: #e20074; font-family: Calibri, 'Segoe UI', sans-serif;">Welcome to the Rich Text Email Editor</h2>
    <p style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5;">
      Use the rich toolbar above to format text, change fonts and sizes, apply custom colors, insert hyperlinks, or generate styled email tables.
    </p>
  `;

  // State holding current content emitted by the reusable editor callbacks
  const [currentContent, setCurrentContent] = useState<{ html: string; text: string }>({
    html: defaultInitialContent,
    text: 'Welcome to the Rich Text Email Editor\nUse the rich toolbar above to format text...',
  });

  const [, setEditorInstance] = useState<Editor | null>(null);

  // Toast notifications
  const [toastMessage] = useState<string | null>(null);

  // Word & character stats
  const wordCount = useMemo(() => {
    const trimmed = currentContent.text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [currentContent.text]);

  const charCount = currentContent.text.length;

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-800 flex flex-col p-3 sm:p-4 overflow-hidden">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles className="w-4 h-4 text-magenta-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout consuming Reusable Editor */}
      <main className="flex-1 w-full mx-auto flex flex-col gap-3 min-h-0">
        {/* Reusable RichTextEmailEditor Component */}
        <RichTextEmailEditor
          value={defaultInitialContent}
          predefinedTexts={predefinedTextsList}
          attachments={attachmentsList}
          minHeight="100%"
          onChange={(data) => {
            setCurrentContent(data);
          }}
          onEditorReady={(editor) => {
            setEditorInstance(editor);
          }}
          className="flex-1 min-h-0 h-full"
        />

        {/* Word & Character Statistics Bar */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-2.5 flex items-center justify-start text-xs text-slate-500 font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <span>{wordCount} words</span>
            <span className="text-slate-300">•</span>
            <span>{charCount} characters</span>
          </div>
        </div>
      </main>
    </div>
  );
}


