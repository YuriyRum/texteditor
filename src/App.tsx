import React, { useState, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Upload,
  LayoutTemplate,
  PenTool,
  CheckCircle2,
  Mail,
  Copy,
  Check,
  Code2,
} from 'lucide-react';

import { RichTextEmailEditor } from './components/RichTextEmailEditor';
import { TemplateBuilder } from './components/TemplateBuilder/TemplateBuilder';
import { ViewHtmlModal } from './components/ViewHtmlModal';
import { EmailAttachment, AppMode } from './types';
import { DEFAULT_ATTACHMENTS } from './data/defaultAttachments';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('editor');

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

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [isViewHtmlOpen, setIsViewHtmlOpen] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Word & character stats
  const wordCount = useMemo(() => {
    const trimmed = currentContent.text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [currentContent.text]);

  const charCount = currentContent.text.length;

  // Called when user clicks "Apply to Editor" inside Template Builder
  const handleUseTemplateInEditor = (template: { subject: string; html: string }) => {
    setCurrentContent({
      html: template.html,
      text: template.html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim(),
    });

    if (editorInstance) {
      editorInstance.commands.setContent(template.html);
    }

    setAppMode('editor');
    showToast('Template loaded into editor! You can now customize and review.');
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(currentContent.html);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Top Header Navigation & Mode Switcher */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-magenta-600 flex items-center justify-center text-white shadow-2xs">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              Outlook Email Studio
            </h1>
            <p className="text-[11px] text-slate-500 leading-none">
              {appMode === 'builder' ? 'Template Builder & Placeholder Engine' : 'Rich Text Email Editor'}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher to separate Standard Editor and Build Mode */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setAppMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              appMode === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-magenta-600" />
            <span>Standard Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              appMode === 'builder'
                ? 'bg-magenta-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutTemplate className={`w-3.5 h-3.5 ${appMode === 'builder' ? 'text-white' : 'text-magenta-600'}`} />
            <span>Build Mode</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                appMode === 'builder'
                  ? 'bg-magenta-700/80 text-magenta-100'
                  : 'bg-magenta-100 text-magenta-700'
              }`}
            >
              Templates
            </span>
          </button>
        </div>

        {/* Right Action Tools in Header */}
        <div className="flex items-center gap-2">
          {appMode === 'editor' && (
            <>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Copy Clean Outlook HTML to Clipboard"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Copy HTML</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsViewHtmlOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="View Generated HTML Code"
              >
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Source</span>
              </button>
            </>
          )}

          {appMode === 'builder' && (
            <button
              type="button"
              onClick={() => setAppMode('editor')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <span>Back to Standard Editor</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      {appMode === 'builder' ? (
        <TemplateBuilder
          onUseTemplateInEditor={handleUseTemplateInEditor}
          onBackToEditor={() => setAppMode('editor')}
        />
      ) : (
        <main className="flex-1 w-full mx-auto flex flex-col p-2 sm:p-3 gap-2 min-h-0 overflow-hidden">
          {/* Reusable RichTextEmailEditor Component with Text Wrapping, Toolbar, & MHT support */}
          <RichTextEmailEditor
            value={currentContent.html}
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
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-medium shadow-2xs shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>{wordCount} words</span>
              <span className="text-slate-300">•</span>
              <span>{charCount} characters</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                <Upload className="w-3.5 h-3.5 text-magenta-500" />
                <span>Tip: Drag & drop <code>.mht</code>, <code>.mhtml</code>, or <code>.txt</code> files directly onto the canvas</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* HTML View Modal */}
      <ViewHtmlModal
        isOpen={isViewHtmlOpen}
        onClose={() => setIsViewHtmlOpen(false)}
        htmlContent={currentContent.html}
      />
    </div>
  );
}
