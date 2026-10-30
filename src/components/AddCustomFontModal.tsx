import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Globe,
  Sparkles,
  Info,
  Type,
  Search,
  ExternalLink,
} from 'lucide-react';
import { FontOption } from '../types';
import {
  PRESET_POPULAR_GOOGLE_FONTS,
  loadWebFont,
} from '../utils/outlookFormatter';

interface AddCustomFontModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFonts: FontOption[];
  onAddFont: (font: FontOption) => void;
  onRemoveFont: (fontFamily: string) => void;
}

export const AddCustomFontModal: React.FC<AddCustomFontModalProps> = ({
  isOpen,
  onClose,
  customFonts,
  onAddFont,
  onRemoveFont,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom font form state
  const [fontName, setFontName] = useState('');
  const [category, setCategory] = useState<'sans-serif' | 'serif' | 'monospace' | 'cursive'>('sans-serif');
  const [fallbackPreset, setFallbackPreset] = useState('Arial, sans-serif');
  const [customWebFontUrl, setCustomWebFontUrl] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load web fonts for presets when modal is opened so previews render nicely
  useEffect(() => {
    if (isOpen) {
      PRESET_POPULAR_GOOGLE_FONTS.forEach((preset) => {
        if (preset.webFontUrl) {
          loadWebFont(preset.webFontUrl);
        }
      });
      customFonts.forEach((f) => {
        if (f.webFontUrl) {
          loadWebFont(f.webFontUrl);
        }
      });
    }
  }, [isOpen, customFonts]);

  // When customWebFontUrl is typed or generated, load it dynamically for live preview
  useEffect(() => {
    if (customWebFontUrl) {
      loadWebFont(customWebFontUrl);
    }
  }, [customWebFontUrl]);

  if (!isOpen) return null;

  const isFontAdded = (family: string) => {
    return customFonts.some((f) => f.family.toLowerCase() === family.toLowerCase());
  };

  const filteredPresets = PRESET_POPULAR_GOOGLE_FONTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateGoogleFontUrl = () => {
    const cleanName = fontName.trim();
    if (!cleanName) {
      setErrorNotice('Enter a font name first');
      return;
    }
    const formattedQuery = cleanName.replace(/\s+/g, '+');
    const url = `https://fonts.googleapis.com/css2?family=${formattedQuery}:wght@400;600;700&display=swap`;
    setCustomWebFontUrl(url);
    loadWebFont(url);
    setErrorNotice(null);
  };

  const handleCreateCustomFont = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fontName.trim();
    if (!cleanName) {
      setErrorNotice('Please provide a font name');
      return;
    }

    // Construct family string with fallback
    const family = `'${cleanName}', ${fallbackPreset}`;

    if (isFontAdded(family)) {
      setErrorNotice(`Font "${cleanName}" is already in your font list`);
      return;
    }

    const newFont: FontOption = {
      name: cleanName,
      family,
      category,
      isCustom: true,
      webFontUrl: customWebFontUrl.trim() || undefined,
    };

    onAddFont(newFont);
    setSuccessNotice(`Added "${cleanName}" to font dropdown!`);
    setFontName('');
    setCustomWebFontUrl('');
    setErrorNotice(null);

    setTimeout(() => {
      setSuccessNotice(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-magenta-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta-600/10 text-magenta-600 flex items-center justify-center border border-magenta-200">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Custom Font Manager</h2>
              <p className="text-xs text-slate-500">
                Add web fonts or corporate typefaces to your email editor with safe Outlook fallbacks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 gap-4 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-magenta-600 text-magenta-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Popular Google Fonts</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-magenta-600 text-magenta-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Add Any Custom Font</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {errorNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
              <span>{errorNotice}</span>
              <button onClick={() => setErrorNotice(null)} className="font-bold">×</button>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {activeTab === 'presets' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search popular email-safe fonts (e.g. Poppins, Roboto, Serif)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500"
                />
              </div>

              {/* Grid of Preset Fonts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPresets.map((preset) => {
                  const added = isFontAdded(preset.family);
                  return (
                    <div
                      key={preset.name}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-magenta-300 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm text-slate-800">
                            {preset.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {preset.category}
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-600 py-2 border-y border-slate-100 line-clamp-2"
                          style={{ fontFamily: preset.family }}
                        >
                          The quick brown fox jumps over the lazy dog. 12345
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {preset.family}
                        </span>
                        {added ? (
                          <button
                            type="button"
                            onClick={() => onRemoveFont(preset.family)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors group/btn"
                            title="Click to remove"
                          >
                            <Check className="w-3.5 h-3.5 group-hover/btn:hidden" />
                            <Trash2 className="w-3.5 h-3.5 hidden group-hover/btn:inline" />
                            <span className="group-hover/btn:hidden">Active</span>
                            <span className="hidden group-hover/btn:inline">Remove</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onAddFont(preset);
                              setSuccessNotice(`Added ${preset.name} to fonts!`);
                              setTimeout(() => setSuccessNotice(null), 2500);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-magenta-50 text-magenta-700 border border-magenta-200 hover:bg-magenta-600 hover:text-white transition-all flex items-center gap-1 font-medium"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Font Manual Input Tab */
            <form onSubmit={handleCreateCustomFont} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Font Family Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Space Grotesk, Outfit, Corporate Sans"
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Font Classification
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500"
                  >
                    <option value="sans-serif">Sans-serif (Modern, clean)</option>
                    <option value="serif">Serif (Traditional, editorial)</option>
                    <option value="monospace">Monospace (Code, tabular)</option>
                    <option value="cursive">Cursive / Script (Signature)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outlook Safe Fallback Stack
                </label>
                <select
                  value={fallbackPreset}
                  onChange={(e) => setFallbackPreset(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500"
                >
                  <option value="Arial, sans-serif">Arial, sans-serif (Universal Sans-serif)</option>
                  <option value="Calibri, sans-serif">Calibri, sans-serif (Outlook Default)</option>
                  <option value="'Segoe UI', Tahoma, Geneva, sans-serif">Segoe UI, Tahoma, Geneva, sans-serif (Windows Default)</option>
                  <option value="Georgia, serif">Georgia, serif (Universal Serif)</option>
                  <option value="'Times New Roman', Times, serif">Times New Roman, Times, serif (Classic Serif)</option>
                  <option value="'Courier New', Courier, monospace">Courier New, Courier, monospace (Standard Monospace)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Outlook Windows will automatically fall back to this font if the custom web font is not installed on the recipient machine.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Web Font Stylesheet URL (Optional)
                  </label>
                  {fontName.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateGoogleFontUrl}
                      className="text-[11px] text-magenta-600 hover:text-magenta-800 font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate Google Fonts URL
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="e.g. https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap"
                  value={customWebFontUrl}
                  onChange={(e) => setCustomWebFontUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-magenta-500/20 focus:border-magenta-500 font-mono"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">
                  Live Rendering Preview
                </div>
                <div
                  className="space-y-1 p-3 bg-white rounded-lg border border-slate-200"
                  style={{
                    fontFamily: fontName ? `'${fontName}', ${fallbackPreset}` : fallbackPreset,
                  }}
                >
                  <div className="text-base font-bold text-slate-900">
                    {fontName || 'Your Custom Font Title'}
                  </div>
                  <div className="text-xs text-slate-600">
                    This email is styled with custom typography. Fast, crisp, and fully readable in every inbox.
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-magenta-600 hover:bg-magenta-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Editor Fonts</span>
                </button>
              </div>
            </form>
          )}

          {/* Currently Configured Custom Fonts List */}
          {customFonts.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Active Custom Fonts in Editor ({customFonts.length})</span>
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {customFonts.map((font) => (
                  <div
                    key={font.family}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-800" style={{ fontFamily: font.family }}>
                        {font.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                        ({font.family})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFont(font.family)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove custom font"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outlook / Email Client Info Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-semibold block">Email Typography Compatibility Note:</span>
              <span>
                Webmail, iOS Mail, and Apple Mail render custom Google Fonts directly. Microsoft Outlook desktop uses the Word engine and falls back to your specified fallback font (such as Arial or Georgia) so layouts remain pristine.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Custom fonts are saved to your browser and included when copying or saving templates.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
