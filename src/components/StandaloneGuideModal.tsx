import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Terminal,
  Code2,
  Package,
  Layers,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface StandaloneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
}

export const StandaloneGuideModal: React.FC<StandaloneGuideModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'install' | 'code'>('build');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast?.(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const buildCommand = `npm run build:standalone`;

  const installCommand = `# Option 1: Install from local build path
npm install ../path-to-editor/dist/standalone

# Option 2: Pack as a tarball archive
npm pack
npm install ./rich-text-email-editor-0.0.0.tgz`;

  const codeExample = `import React, { useState } from 'react';
import { 
  RichTextEmailEditor, 
  RichTextEmailEditorChangeData 
} from 'rich-text-email-editor';

// Import bundled styles (Tailwind, ProseMirror, tables, resizable images)
import 'rich-text-email-editor/style.css';

export function EmailComposer() {
  const [editorData, setEditorData] = useState<RichTextEmailEditorChangeData | null>(null);

  return (
    <div style={{ maxWidth: 840, margin: '20px auto', height: 600 }}>
      <RichTextEmailEditor
        placeholder="Compose your email..."
        // Pass existing CID HTML + images to reconstruct visual view:
        value={editorData?.cidHtml}
        images={editorData?.images}
        onChange={(data) => {
          // data.html -> Visual HTML with inline images
          // data.cidHtml -> Outlook-ready HTML with src="cid:..."
          // data.images -> Separate image files for MIME attachment
          // data.text -> Plain text body
          // data.outlookHtml -> Complete MSO email document
          setEditorData(data);
        }}
      />
    </div>
  );
}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-magenta-50 text-magenta-600 rounded-xl border border-magenta-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Standalone RichTextEmailEditor
              </h3>
              <p className="text-xs text-slate-500">
                Build &amp; embed the editor into any React, Next.js, or Vite application
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/70 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('build')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'build'
                ? 'border-magenta-600 text-magenta-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. Build Option</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'border-magenta-600 text-magenta-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Add to Other App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-magenta-600 text-magenta-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Usage Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'build' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-magenta-600" />
                    Build Command
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(buildCommand, 'build-cmd', 'build command')}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-magenta-600 cursor-pointer"
                  >
                    {copiedKey === 'build-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                  {buildCommand}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Output Artifacts in <code>dist/standalone/</code>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="font-bold text-slate-900">rich-text-email-editor.js</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      ES Module bundle for Vite, Next.js, and modern bundlers.
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="font-bold text-slate-900">rich-text-email-editor.cjs</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      CommonJS bundle for Node &amp; classic bundlers.
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="font-bold text-slate-900">rich-text-email-editor.css</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Extracted CSS: ProseMirror canvas, table borders, resize handles.
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="font-bold text-slate-900">types/ (TypeScript .d.ts)</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Full TypeScript declarations with autocompletion.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-magenta-600" />
                    Installation Options
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(installCommand, 'install-cmd', 'install command')}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-magenta-600 cursor-pointer"
                  >
                    {copiedKey === 'install-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
                  {installCommand}
                </pre>
              </div>

              <div className="bg-magenta-50/60 border border-magenta-200/70 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-magenta-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Peer Dependencies</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  The standalone bundle externalizes <code>react</code> and <code>react-dom</code> so your parent application provides its own React instance without duplicate bundle weight.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-magenta-600" />
                    React / Next.js Component Example
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(codeExample, 'code-example', 'code example')}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-magenta-600 cursor-pointer"
                  >
                    {copiedKey === 'code-example' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[300px]">
                  {codeExample}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            Check <code className="font-semibold text-slate-700">STANDALONE_BUILD_GUIDE.md</code> for complete details.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
