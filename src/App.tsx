import React, { useState, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Upload } from 'lucide-react';

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
    <p style="font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5; color: #475569;">
      💡 <b>Text & Outlook .MHT Support:</b> If text is provided as an input, it is automatically wrapped in semantic HTML paragraphs (<code>&lt;p&gt;...&lt;/p&gt;</code>) and shown editable. You can also drag and drop <code>.mht</code> or <code>.txt</code> files directly onto the editor canvas.
    </p>
  `;

  // State holding current content emitted by the reusable editor callbacks
  const [currentContent, setCurrentContent] = useState<{ html: string; text: string }>({
    html: defaultInitialContent,
    text: 'Welcome to the Rich Text Email Editor\nUse the rich toolbar above to format text...',
  });

  const [, setEditorInstance] = useState<Editor | null>(null);

  // Word & character stats
  const wordCount = useMemo(() => {
    const trimmed = currentContent.text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [currentContent.text]);

  const charCount = currentContent.text.length;

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-800 flex flex-col p-2 sm:p-3 overflow-hidden">
      {/* Main Workspace Layout consuming Reusable Editor */}
      <main className="flex-1 w-full mx-auto flex flex-col gap-2 min-h-0">
        {/* Reusable RichTextEmailEditor Component with Text Wrapping & MHT support */}
        <RichTextEmailEditor
          defaultValue={defaultInitialContent}
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
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-medium shadow-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>{wordCount} words</span>
            <span className="text-slate-300">•</span>
            <span>{charCount} characters</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Upload className="w-3.5 h-3.5 text-magenta-500" />
            <span>Tip: Drag & drop <code>.mht</code>, <code>.mhtml</code>, or <code>.txt</code> files directly onto the editor</span>
          </div>
        </div>
      </main>
    </div>
  );
}




