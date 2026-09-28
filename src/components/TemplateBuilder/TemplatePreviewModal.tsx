import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Eye,
  Code2,
  RefreshCw,
  Sparkles,
  FileArchive,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { extractPlaceholders, fillPlaceholders } from '../../utils/placeholderEngine';
import { DEFAULT_PLACEHOLDERS } from '../../data/defaultPlaceholders';
import { TemplateImageObject } from '../../types';
import {
  extractImagesFromHtmlToCid,
  generateOutlookMhtDocument,
  resolveCidImagesInHtml,
} from '../../utils/outlookTemplateSerializer';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName?: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  templateImages?: TemplateImageObject[];
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  templateName = 'email-template',
  subjectTemplate,
  bodyHtmlTemplate,
  templateImages = [],
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'mht'>('preview');
  const [copied, setCopied] = useState(false);

  // Extract all placeholders from both subject and body
  const detectedKeys = useMemo(() => {
    const fromSubject = extractPlaceholders(subjectTemplate);
    const fromBody = extractPlaceholders(bodyHtmlTemplate);
    const set = new Set([...fromSubject, ...fromBody]);
    return Array.from(set);
  }, [subjectTemplate, bodyHtmlTemplate]);

  // Initial sample values
  const defaultValuesMap = useMemo(() => {
    const map: Record<string, string> = {};
    detectedKeys.forEach((key) => {
      const match = DEFAULT_PLACEHOLDERS.find(
        (p) =>
          p.key.toLowerCase() === key.toLowerCase() ||
          p.label.toLowerCase() === key.toLowerCase()
      );
      map[key] = match ? match.sampleValue : `[${key}]`;
    });
    return map;
  }, [detectedKeys]);

  const [values, setValues] = useState<Record<string, string>>(defaultValuesMap);

  // Re-sync if keys change
  React.useEffect(() => {
    setValues(defaultValuesMap);
  }, [defaultValuesMap]);

  if (!isOpen) return null;

  const handleValueChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetToSamples = () => {
    setValues(defaultValuesMap);
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    detectedKeys.forEach((k) => (cleared[k] = ''));
    setValues(cleared);
  };

  // 1. Separate inline images into CID objects + Outlook CID-referenced HTML
  const { cidHtml: rawCidBodyHtml, images: extractedImages } = extractImagesFromHtmlToCid(
    bodyHtmlTemplate,
    templateImages
  );

  // 2. Fill placeholders in Subject and in CID-referenced HTML
  const renderedSubject = fillPlaceholders(subjectTemplate, values);
  const filledCidHtml = fillPlaceholders(rawCidBodyHtml, values);

  // 3. Resolve cid: back to data: URIs strictly for visual browser preview
  const visualPreviewHtml = resolveCidImagesInHtml(filledCidHtml, extractedImages);

  // 4. Generate complete Outlook .MHT document (multipart/related with separate image parts)
  const { mhtContent } = generateOutlookMhtDocument({
    subject: renderedSubject,
    bodyHtml: filledCidHtml,
    images: extractedImages,
  });

  const handleCopyOutput = async () => {
    try {
      const textToCopy = activeTab === 'mht' ? mhtContent : filledCidHtml;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy output:', err);
    }
  };

  const handleDownloadMht = () => {
    const blob = new Blob([mhtContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.mht`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleImage = (img: TemplateImageObject) => {
    const dataUrl = `data:${img.contentType};base64,${img.base64Data}`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = img.filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-magenta-100 flex items-center justify-center text-magenta-600">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Outlook Template Preview &amp; CID Resource Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Images are saved separately and referenced via <code>cid:</code> like in Outlook <code>.mht</code> files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Email View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'html'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Outlook HTML (CID)</span>
                {extractedImages.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-magenta-100 text-magenta-700 font-bold">
                    {extractedImages.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mht')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'mht'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>MHT File</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Test Data Sidebar + Live Rendered Email / CID Inspector */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Panel: Fill Placeholders */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 min-h-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-magenta-600" />
                  Test Variables ({detectedKeys.length})
                </span>
                <p className="text-[11px] text-slate-500">
                  Type sample data to test replacement
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetToSamples}
                  title="Reset to sample values"
                  className="p-1 text-slate-500 hover:text-magenta-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {detectedKeys.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No placeholders detected in subject or body. Add <code>&amp;Variable&amp;</code> tokens to customize.
                </div>
              ) : (
                detectedKeys.map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                      <span className="truncate">{key}</span>
                      <code className="text-[10px] text-magenta-600 font-mono font-bold">
                        {`&${key}&`}
                      </code>
                    </label>
                    <input
                      type="text"
                      value={values[key] || ''}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      placeholder={`Enter ${key}...`}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-magenta-500 focus:ring-1 focus:ring-magenta-100"
                    />
                  </div>
                ))
              )}
            </div>

            {detectedKeys.length > 0 && (
              <div className="p-2 border-t border-slate-200 bg-white flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  type="button"
                  onClick={handleResetToSamples}
                  className="flex-1 py-1 text-[11px] font-semibold text-magenta-600 hover:bg-magenta-50 rounded transition-colors cursor-pointer"
                >
                  Fill Samples
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Rendered View / CID HTML / MHT */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-100 overflow-hidden">
            {/* Outlook Header Simulator */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700">Subject:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {renderedSubject || (
                    <span className="text-slate-400 italic font-normal">No subject defined</span>
                  )}
                </span>
              </div>

              {extractedImages.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-magenta-50 text-magenta-700 border border-magenta-200">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    {extractedImages.length} separate image {extractedImages.length === 1 ? 'object' : 'objects'} referenced via <code>cid:</code>
                  </span>
                </span>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeTab === 'preview' && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-6 max-w-3xl mx-auto min-h-full">
                  <div
                    dangerouslySetInnerHTML={{ __html: visualPreviewHtml }}
                    className="email-rendered-content text-sm leading-relaxed"
                  />
                </div>
              )}

              {activeTab === 'html' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {/* Separate Image Objects Panel */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-magenta-600" />
                        Separate Image Objects ({extractedImages.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Referenced in HTML body via <code>src=&quot;cid:...&quot;</code>
                      </span>
                    </div>

                    {extractedImages.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400 italic text-center">
                        No images in this template. Drag &amp; drop an image in the builder to see its separate CID object here.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {extractedImages.map((img) => (
                          <div
                            key={img.cid}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-10 rounded border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                {img.base64Data && (
                                  <img
                                    src={`data:${img.contentType};base64,${img.base64Data}`}
                                    alt={img.filename}
                                    className="max-h-8 w-auto object-contain"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800">
                                    {img.filename}
                                  </span>
                                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-magenta-50 text-magenta-700 border border-magenta-200 font-mono">
                                    cid:{img.cid}
                                  </code>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {img.contentType} • {img.encoding} • {(img.sizeBytes / 1024).toFixed(1)} KB
                                  {img.width ? ` • ${img.width}` : ''}
                                  {img.height ? ` × ${img.height}` : ''}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingleImage(img)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-magenta-700 bg-white hover:bg-magenta-50 border border-slate-200 hover:border-magenta-200 rounded-lg flex items-center gap-1 shrink-0 transition cursor-pointer"
                              title={`Download ${img.filename}`}
                            >
                              <Download className="w-3 h-3" />
                              <span>Save Image</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CID-Referenced HTML Code */}
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto shadow-inner">
                    <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400 mb-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                      <span>Outlook Email Body HTML (with cid: references)</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all select-all">
                      {filledCidHtml}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'mht' && (
                <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-amber-300 leading-relaxed overflow-x-auto shadow-inner max-w-4xl mx-auto">
                  <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400 mb-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                    <span>RFC 2557 Multipart/Related Outlook .MHT Archive</span>
                    <span>{extractedImages.length} embedded MIME image part(s)</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all select-all">
                    {mhtContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="text-slate-500 font-medium flex items-center gap-2">
            <span>{detectedKeys.length} dynamic placeholders</span>
            <span>•</span>
            <span>{extractedImages.length} separate CID image object(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyOutput}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{activeTab === 'mht' ? 'Copy .MHT Source' : 'Copy Outlook CID HTML'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMht}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-magenta-600 hover:bg-magenta-700 text-white rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Download as Outlook .MHT file with separate MIME image parts"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save as Outlook .MHT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
