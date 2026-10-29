import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileArchive,
  ImageIcon,
  Code2,
  FileText,
  BookmarkPlus,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  extractImagesFromHtmlToCid,
  wrapInOutlookDocument,
  generateOutlookMhtDocument,
  createOutlookZipBundle,
  downloadBlob,
  downloadImageFile,
  saveImageObjectsToStore,
} from '../utils/outlookTemplateSerializer';
import { TemplateImageObject, EmailTemplate } from '../types';

interface SaveForOutlookModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  images?: TemplateImageObject[];
  defaultSubject?: string;
  onToast?: (msg: string) => void;
}

type ModalTab = 'images' | 'html' | 'code';
type HtmlViewMode = 'full' | 'fragment';

export const SaveForOutlookModal: React.FC<SaveForOutlookModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
  images: initialImages = [],
  defaultSubject = 'Outlook Email',
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('images');
  const [htmlMode, setHtmlMode] = useState<HtmlViewMode>('full');
  const [subjectTitle, setSubjectTitle] = useState(defaultSubject);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);

  // Extract separate CID images and CID-referenced HTML
  const { cidHtml, images } = useMemo(() => {
    if (!isOpen) return { cidHtml: '', images: [] };
    return extractImagesFromHtmlToCid(htmlContent, initialImages);
  }, [htmlContent, initialImages, isOpen]);

  // Full standalone Outlook HTML document
  const fullDocumentHtml = useMemo(() => {
    return wrapInOutlookDocument({
      subject: subjectTitle || 'Outlook Email',
      bodyHtml: cidHtml,
    });
  }, [subjectTitle, cidHtml]);

  if (!isOpen) return null;

  const totalImageBytes = images.reduce((acc, img) => acc + (img.sizeBytes || 0), 0);
  const formattedTotalImageSize =
    totalImageBytes > 1024 * 1024
      ? `${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(totalImageBytes / 1024)} KB`;

  const safeFilenameBase = (subjectTitle || 'outlook-email')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'outlook-email';

  const showFeedback = (msg: string) => {
    onToast?.(msg);
  };

  const handleCopy = async (text: string, typeKey: string, toastLabel: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(typeKey);
      showFeedback(toastLabel);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Download complete ZIP package
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await createOutlookZipBundle({
        subject: subjectTitle || 'Outlook Email',
        cidHtml,
        images,
      });
      downloadBlob(zipBlob, `${safeFilenameBase}-package.zip`);
      showFeedback(`Downloaded ZIP bundle with ${images.length} separate image${images.length === 1 ? '' : 's'}`);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      showFeedback('Failed to generate ZIP package');
    } finally {
      setIsZipping(false);
    }
  };

  // Download Outlook .MHT file
  const handleDownloadMht = () => {
    try {
      const { mhtContent } = generateOutlookMhtDocument({
        subject: subjectTitle,
        bodyHtml: cidHtml,
        images,
      });
      const blob = new Blob([mhtContent], { type: 'message/rfc822' });
      downloadBlob(blob, `${safeFilenameBase}.mht`);
      showFeedback(`Downloaded Outlook .MHT file (${images.length} CID images packaged)`);
    } catch (err) {
      console.error('Failed to export MHT:', err);
      showFeedback('Failed to export MHT document');
    }
  };

  // Download standalone HTML file with CID tags
  const handleDownloadHtmlFile = (asFullDoc = true) => {
    const content = asFullDoc ? fullDocumentHtml : cidHtml;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${safeFilenameBase}-cid.html`);
    showFeedback('Downloaded HTML file with CID image references');
  };

  // Save directly to the Email Templates library in localStorage
  const handleSaveToTemplatesLibrary = () => {
    try {
      const savedRaw = localStorage.getItem('email_templates');
      let templatesList: EmailTemplate[] = [];
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed)) templatesList = parsed;
        } catch {
          // fallback
        }
      }

      // Save images in global repository store
      if (images.length > 0) {
        saveImageObjectsToStore(images);
      }

      const newTemplateId = `template-${Date.now()}`;
      const newTemplateName = subjectTitle.trim() || 'Outlook Email Template';

      const newTemplate: EmailTemplate = {
        id: newTemplateId,
        name: newTemplateName,
        subject: subjectTitle,
        bodyHtml: cidHtml,
        images,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const updated = [newTemplate, ...templatesList];
      localStorage.setItem('email_templates', JSON.stringify(updated));

      setIsSavedToLibrary(true);
      showFeedback(`Saved to Template Builder library with ${images.length} separate CID images!`);
      setTimeout(() => setIsSavedToLibrary(false), 3000);
    } catch (err) {
      console.error('Failed to save to template library:', err);
      showFeedback('Failed to save template to library');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-magenta-50/30 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Save HTML &amp; Embedded Images for Outlook
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-magenta-100 text-magenta-800 rounded-full border border-magenta-200">
                  Outlook CID Compatibility
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Extracts inline base64/data images into separate image files and replaces image tags with{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-magenta-700 font-semibold font-mono text-[11px]">
                  src="cid:..."
                </code>{' '}
                references so images display reliably in Outlook Word rendering engine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar (Subject Title & Quick Stats) */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <label htmlFor="outlook-subject-input" className="font-bold text-slate-700 shrink-0">
              Email Subject / Title:
            </label>
            <input
              id="outlook-subject-input"
              type="text"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              placeholder="e.g. Monthly Newsletter"
              className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-magenta-500 focus:ring-1 focus:ring-magenta-500 w-full max-w-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
              <ImageIcon className="w-3.5 h-3.5 text-magenta-600" />
              <span>
                <strong className="text-slate-900 font-bold">{images.length}</strong> separate CID{' '}
                {images.length === 1 ? 'image' : 'images'}
              </span>
              {images.length > 0 && (
                <span className="text-slate-400 font-mono">({formattedTotalImageSize})</span>
              )}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong className="text-slate-900 font-bold">{cidHtml.length}</strong> HTML chars
              </span>
            </span>
          </div>
        </div>

        {/* Action Header Banner: Recommended One-Click Actions */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action: Download ZIP with HTML + Images */}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 bg-magenta-600 hover:bg-magenta-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Download ZIP package containing email.html with CID references, images/ folder, and manifest"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download ZIP Bundle (HTML + Images)'}</span>
            </button>

            {/* Standalone Outlook .MHT File */}
            <button
              type="button"
              onClick={handleDownloadMht}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download single .MHT Outlook template file with separate MIME parts for each image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MHT (Outlook Template)</span>
            </button>

            {/* HTML File Only with CID tags */}
            <button
              type="button"
              onClick={() => handleDownloadHtmlFile(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Download standalone .html file with CID image references"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .HTML (with CID)</span>
            </button>
          </div>

          {/* Save directly to Template Builder Library */}
          <button
            type="button"
            onClick={handleSaveToTemplatesLibrary}
            className="flex items-center gap-1.5 px-3 py-2 bg-magenta-50 hover:bg-magenta-100 text-magenta-700 border border-magenta-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Save this email with separate CID images into the Template Builder library"
          >
            {isSavedToLibrary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Saved to Templates!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-magenta-600" />
                <span>Save to Template Library</span>
              </>
            )}
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'images'
                  ? 'border-magenta-600 text-magenta-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Extracted Images ({images.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'html'
                  ? 'border-magenta-600 text-magenta-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>CID HTML Source</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'code'
                  ? 'border-magenta-600 text-magenta-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Outlook &amp; Script Integration</span>
            </button>
          </div>

          {activeTab === 'html' && (
            <div className="flex items-center gap-1.5 py-1">
              <span className="text-[11px] text-slate-500 font-medium">Mode:</span>
              <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setHtmlMode('full')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    htmlMode === 'full' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Full Document
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlMode('fragment')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    htmlMode === 'fragment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Body Fragment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px] p-5 bg-slate-100/60">
          {/* TAB 1: Extracted Images */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Informational Callout */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ℹ️
                </div>
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold text-amber-950">Why separate images with CID references?</p>
                  <p className="mt-0.5 text-amber-800">
                    Microsoft Outlook on Windows uses the Microsoft Word rendering engine which strictly does not
                    display embedded <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono">data:image/...;base64</code>{' '}
                    URIs. By extracting images into separate files referenced with unique Content-ID headers (
                    <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono">cid:filename@...</code>),
                    images display immediately and inline without broken image crosses or security blocks.
                  </p>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Embedded Images Detected</h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    This email currently has no inline images. You can still download the clean Outlook-compatible
                    HTML or .MHT file. To embed images, simply drag &amp; drop or paste images into the editor.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadHtmlFile(true)}
                    className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Download Clean Outlook HTML
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                    <span>
                      {images.length} Image {images.length === 1 ? 'Object' : 'Objects'} Extracted &amp; Linked with CID:
                    </span>
                    <span className="text-slate-400 font-normal">
                      Click "Download Image" to save individual files, or download all in the ZIP bundle
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {images.map((img, idx) => {
                      const dataUri = `data:${img.contentType};base64,${img.base64Data}`;
                      const formattedSize =
                        img.sizeBytes > 1024 * 1024
                          ? `${(img.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                          : `${Math.round(img.sizeBytes / 1024)} KB`;

                      return (
                        <div
                          key={img.cid || idx}
                          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-magenta-300 transition-all flex items-start gap-3.5"
                        >
                          {/* Image Thumbnail */}
                          <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={dataUri}
                              alt={img.filename}
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          </div>

                          {/* Image Metadata */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 truncate" title={img.filename}>
                                {img.filename}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                {formattedSize}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span className="font-mono bg-magenta-50 text-magenta-700 px-1 rounded truncate">
                                cid:{img.cid}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>Format: {img.contentType.split('/')[1]?.toUpperCase() || 'IMAGE'}</span>
                              <span>•</span>
                              <span>
                                Dims: {img.width || 'auto'} × {img.height || 'auto'}
                              </span>
                            </div>

                            {/* Actions for this image */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => downloadImageFile(img)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-magenta-600 hover:text-magenta-800 hover:underline cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download File</span>
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(`cid:${img.cid}`, img.cid, `Copied CID: cid:${img.cid}`)}
                                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                {copiedType === img.cid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied CID</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy CID Tag</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CID HTML Code View */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {htmlMode === 'full' ? 'Complete Standalone Document' : 'Body HTML Fragment'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>All images use Outlook-compatible <code>cid:</code> references</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        htmlMode === 'full' ? fullDocumentHtml : cidHtml,
                        'html_code',
                        'Copied CID HTML to clipboard!'
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-magenta-50 hover:bg-magenta-100 text-magenta-700 border border-magenta-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedType === 'html_code' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy HTML</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadHtmlFile(htmlMode === 'full')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .html</span>
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-auto max-h-[380px] leading-relaxed select-all">
                <pre className="whitespace-pre-wrap break-all font-mono">
                  {htmlMode === 'full' ? fullDocumentHtml : cidHtml}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Outlook & Script Integration */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-magenta-600" />
                    Outlook Desktop (VBA Macro / Add-in)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `Sub SendOutlookEmailWithCidImages()
    Dim olApp As Object, olMail As Object, olAttach As Object, fso As Object
    Set olApp = CreateObject("Outlook.Application")
    Set olMail = olApp.CreateItem(0)
    Set fso = CreateObject("Scripting.FileSystemObject")
    olMail.Subject = "${subjectTitle}"
    olMail.HTMLBody = fso.OpenTextFile(ThisWorkbook.Path & "\\email.html", 1).ReadAll
    ${images.map((img) => `Set olAttach = olMail.Attachments.Add(ThisWorkbook.Path & "\\images\\${img.filename}")\n    olAttach.PropertyAccessor.SetProperty "http://schemas.microsoft.com/mapi/proptag/0x3712001F", "${img.cid}"`).join('\n    ')}
    olMail.Display
End Sub`,
                        'vba',
                        'Copied VBA code!'
                      )
                    }
                    className="text-[11px] font-semibold text-magenta-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy VBA</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <span className="text-purple-400">Dim</span> olAttach <span className="text-purple-400">As Object</span><br />
                  <span className="text-slate-400">' Attach each file and assign its Content-ID:</span><br />
                  {images.length > 0 ? (
                    images.map((img) => (
                      <div key={img.cid}>
                        <span className="text-yellow-300">Set</span> olAttach = olMail.Attachments.Add(ThisWorkbook.Path &amp; <span className="text-emerald-300">"\images\{img.filename}"</span>)<br />
                        olAttach.PropertyAccessor.SetProperty <span className="text-emerald-300">"http://schemas.microsoft.com/mapi/proptag/0x3712001F"</span>, <span className="text-emerald-300">"{img.cid}"</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400">' No images in email</span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    Python (smtplib &amp; email.mime)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

msg = MIMEMultipart('related')
msg['Subject'] = "${subjectTitle}"
with open('email.html', 'r', encoding='utf-8') as f:
    msg.attach(MIMEText(f.read(), 'html', 'utf-8'))

${images.map((img) => `with open('images/${img.filename}', 'rb') as f:
    img_part = MIMEImage(f.read())
    img_part.add_header('Content-ID', '<${img.cid}>')
    img_part.add_header('Content-Disposition', 'inline', filename='${img.filename}')
    msg.attach(img_part)`).join('\n\n')}`,
                        'python',
                        'Copied Python code!'
                      )
                    }
                    className="text-[11px] font-semibold text-magenta-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Python</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <span className="text-slate-400"># Attach CID inline images to email</span><br />
                  {images.map((img) => (
                    <div key={img.cid} className="my-1">
                      <span className="text-yellow-300">with</span> open(<span className="text-emerald-300">'images/{img.filename}'</span>, <span className="text-emerald-300">'rb'</span>) <span className="text-yellow-300">as</span> f:<br />
                      &nbsp;&nbsp;img = MIMEImage(f.read())<br />
                      &nbsp;&nbsp;img.add_header(<span className="text-emerald-300">'Content-ID'</span>, <span className="text-emerald-300">'&lt;{img.cid}&gt;'</span>)<br />
                      &nbsp;&nbsp;msg.attach(img)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-magenta-600 shrink-0" />
            <span>Ready for Outlook 2016/2019/2021/365, New Outlook, Web, and Mobile.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-1.5 bg-magenta-600 hover:bg-magenta-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Download ZIP Package</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
