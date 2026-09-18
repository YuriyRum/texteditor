import React, { useState } from 'react';
import { X, Type, Code2, ArrowRight, Sparkles } from 'lucide-react';
import { wrapPlainTextInHtml } from '../utils/textToHtml';
import { SAMPLE_PLAIN_TEXT_EMAIL } from '../data/samplePlainTextEmail';

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
}

export const TextInputModal: React.FC<TextInputModalProps> = ({
  isOpen,
  onClose,
  onApplyText,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_PLAIN_TEXT_EMAIL);
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const wrappedHtml = wrapPlainTextInHtml(inputText);

  const handleApply = () => {
    onApplyText(inputText);
    onClose();
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_PLAIN_TEXT_EMAIL);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-magenta-100 flex items-center justify-center text-magenta-600">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Provide Text as Input</h3>
              <p className="text-xs text-slate-500">
                Input raw plain text to see it automatically wrapped in semantic HTML
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

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
                activeTab === 'input'
                  ? 'border-magenta-600 text-magenta-600 bg-magenta-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Raw Text Input
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-magenta-600 text-magenta-600 bg-magenta-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Wrapped HTML Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs font-medium text-magenta-600 hover:text-magenta-700 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Load Sample Text</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-auto">
          {activeTab === 'input' ? (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type raw plain text here..."
              rows={12}
              className="w-full h-full min-h-[260px] p-3 text-xs font-mono text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500 resize-none leading-relaxed"
            />
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl min-h-[260px] font-mono text-xs text-emerald-400 overflow-auto">
              <pre className="whitespace-pre-wrap break-all select-all font-mono leading-relaxed">
                {wrappedHtml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {inputText.length} chars • {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-magenta-600 hover:bg-magenta-700 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span>Apply as Input Value</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
