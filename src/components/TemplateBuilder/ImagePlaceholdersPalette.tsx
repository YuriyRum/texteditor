import React, { useState } from 'react';
import { ImageIcon, Plus, Check, Sliders, Link, Upload, Eye } from 'lucide-react';
import { ImagePlaceholderPreset } from '../../types';
import { DEFAULT_IMAGE_PRESETS } from '../../data/defaultPlaceholders';
import { generateSvgPlaceholder } from '../../utils/placeholderEngine';

interface ImagePlaceholdersPaletteProps {
  onInsertImage: (src: string, alt?: string) => void;
}

export const ImagePlaceholdersPalette: React.FC<ImagePlaceholdersPaletteProps> = ({
  onInsertImage,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'url'>('presets');
  const [insertedPresetId, setInsertedPresetId] = useState<string | null>(null);

  // Custom placeholder generator states
  const [customTitle, setCustomTitle] = useState('Featured Graphic');
  const [customSubtitle, setCustomSubtitle] = useState('High Resolution Visual');
  const [customWidth, setCustomWidth] = useState(500);
  const [customHeight, setCustomHeight] = useState(200);
  const [customTheme, setCustomTheme] = useState<'magenta' | 'slate' | 'blue' | 'emerald'>('magenta');

  // External URL states
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const themes = {
    magenta: { bg: '#fdf2f8', text: '#9d174d', accent: '#e20074' },
    slate: { bg: '#f8fafc', text: '#0f172a', accent: '#475569' },
    blue: { bg: '#f0f9ff', text: '#0369a1', accent: '#0284c7' },
    emerald: { bg: '#f0fdf4', text: '#15803d', accent: '#16a34a' },
  };

  const handleInsertPreset = (preset: ImagePlaceholderPreset) => {
    const theme = themes[customTheme];
    const svgData = generateSvgPlaceholder(preset.width, preset.height, preset.label, `${preset.width} × ${preset.height} px`, {
      bgColor: theme.bg,
      textColor: theme.text,
      accentColor: theme.accent,
      icon: preset.type,
    });

    onInsertImage(svgData, preset.name);
    setInsertedPresetId(preset.id);
    setTimeout(() => setInsertedPresetId(null), 1500);
  };

  const handleInsertCustomSvg = () => {
    const theme = themes[customTheme];
    const svgData = generateSvgPlaceholder(customWidth, customHeight, customTitle, customSubtitle, {
      bgColor: theme.bg,
      textColor: theme.text,
      accentColor: theme.accent,
      icon: 'image',
    });

    onInsertImage(svgData, customTitle);
  };

  const handleInsertExternalUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    onInsertImage(imageUrl.trim(), imageAlt.trim() || 'Email Graphic');
    setImageUrl('');
    setImageAlt('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onInsertImage(dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 border-r border-slate-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1.5 mb-1">
          <ImageIcon className="w-4 h-4 text-magenta-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Image Placeholders & Media
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-2">
          Insert email-ready SVG image placeholders or web graphics into the template.
        </p>

        {/* Tab switch */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'presets' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'custom' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Custom SVG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'url' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            URL / Upload
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            {DEFAULT_IMAGE_PRESETS.map((preset) => {
              const isInserted = insertedPresetId === preset.id;
              const previewSvg = generateSvgPlaceholder(preset.width, preset.height, preset.label, `${preset.width}×${preset.height}`, {
                bgColor: themes[customTheme].bg,
                textColor: themes[customTheme].text,
                accentColor: themes[customTheme].accent,
                icon: preset.type,
              });

              return (
                <div
                  key={preset.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.clearData();
                    e.dataTransfer.setData('application/x-image-url', previewSvg);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-magenta-300 transition-all flex flex-col gap-2 cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">{preset.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {preset.width} × {preset.height} px
                    </span>
                  </div>

                  {/* Thumbnail Preview with Drag Handle */}
                  <div className="w-full bg-slate-100 rounded-lg p-1.5 flex flex-col items-center justify-center overflow-hidden border border-slate-200/60 max-h-28 relative pointer-events-none">
                    <img
                      src={previewSvg}
                      alt={preset.name}
                      draggable={false}
                      className="max-h-20 w-auto object-contain rounded pointer-events-none"
                    />
                    <div className="mt-1 text-[10px] font-medium text-magenta-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-magenta-200 shadow-2xs">
                      🖐️ Drag into email anywhere
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {preset.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleInsertPreset(preset)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isInserted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-magenta-600 text-slate-700 hover:text-white border border-slate-200 hover:border-transparent shadow-2xs'
                    }`}
                  >
                    {isInserted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Inserted!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert at Cursor</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CUSTOM SVG */}
        {activeTab === 'custom' && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
              <Sliders className="w-3.5 h-3.5 text-magenta-600" />
              <span>Configure Custom Placeholder</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Image Title / Label
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Subtitle / Description
              </label>
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="80"
                  max="1200"
                  step="10"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value) || 300)}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="40"
                  max="800"
                  step="10"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value) || 150)}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['magenta', 'slate', 'blue', 'emerald'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomTheme(t)}
                    className={`py-1 text-[11px] capitalize rounded border cursor-pointer font-medium ${
                      customTheme === t
                        ? 'border-magenta-600 bg-magenta-50 text-magenta-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview of Custom */}
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 self-start">
                <Eye className="w-3 h-3" /> Live Graphic Preview:
              </span>
              <img
                src={generateSvgPlaceholder(customWidth, customHeight, customTitle, customSubtitle, {
                  bgColor: themes[customTheme].bg,
                  textColor: themes[customTheme].text,
                  accentColor: themes[customTheme].accent,
                  icon: 'image',
                })}
                alt="Custom placeholder preview"
                className="max-h-28 max-w-full object-contain rounded"
              />
            </div>

            <button
              type="button"
              onClick={handleInsertCustomSvg}
              className="w-full py-2 bg-magenta-600 hover:bg-magenta-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Custom Placeholder</span>
            </button>
          </div>
        )}

        {/* TAB 3: URL / UPLOAD */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            {/* By URL */}
            <form onSubmit={handleInsertExternalUrl} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                <Link className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert from Image URL</span>
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
              />
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Alt description (e.g. Company Logo)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-magenta-500"
              />
              <button
                type="submit"
                disabled={!imageUrl.trim()}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Insert Web Image
              </button>
            </form>

            {/* By File Upload */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Local Image File</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Converts image to embedded base64 data to embed directly into the email template.
              </p>
              <label className="w-full border-2 border-dashed border-slate-200 hover:border-magenta-400 rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-700">Choose PNG, JPG, or SVG</span>
                <span className="text-[10px] text-slate-400">Max size 2MB recommended</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
