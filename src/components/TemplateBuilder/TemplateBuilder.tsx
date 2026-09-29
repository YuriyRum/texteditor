import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Plus,
  Save,
  Copy,
  Sparkles,
  ImageIcon,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  X,
} from 'lucide-react';

import {
  EmailTemplate,
} from '../../types';
import { DEFAULT_TEMPLATES } from '../../data/defaultTemplates';
import { extractPlaceholders } from '../../utils/placeholderEngine';
import {
  extractImagesFromHtmlToCid,
  normalizeTemplatesWithSeparateImages,
  resolveCidImagesInHtml,
  saveImageObjectsToStore,
} from '../../utils/outlookTemplateSerializer';
import { cleanHtmlForOutlook } from '../../utils/outlookFormatter';
import { isMhtContent, readFileAsMht } from '../../utils/mhtParser';

import { SubjectBuilder } from './SubjectBuilder';
import { RichTextEmailEditor } from '../RichTextEmailEditor';
import { InsertPlaceholderModal } from '../InsertPlaceholderModal';

interface TemplateBuilderProps {
  onUseTemplateInEditor?: (template: { subject: string; html: string }) => void;
  onBackToEditor?: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = () => {
  // Saved templates state (normalized so images are stored separately and referenced via cid:)
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('email_templates');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return [];
          const cleaned = parsed.map((t: EmailTemplate) => ({
            ...t,
            subject: t.subject ? t.subject.replace(/\{\{([^{}\r\n]+)\}\}/g, '&$1&') : '',
            bodyHtml: t.bodyHtml ? t.bodyHtml.replace(/\{\{([^{}\r\n]+)\}\}/g, '&$1&') : '',
          }));
          return normalizeTemplatesWithSeparateImages(cleaned);
        }
      } catch {
        // fallback
      }
    }
    return normalizeTemplatesWithSeparateImages(DEFAULT_TEMPLATES);
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => templates[0]?.id || '');

  // Active template editable fields
  const currentTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0] || null;

  const [templateName, setTemplateName] = useState(() => currentTemplate?.name || '');
  const [subject, setSubject] = useState(() => currentTemplate?.subject || '');
  // Resolve cid: references to data: URIs for visual editing in the canvas
  const [bodyHtml, setBodyHtml] = useState(() =>
    currentTemplate
      ? resolveCidImagesInHtml(currentTemplate.bodyHtml, currentTemplate.images || [])
      : ''
  );

  // Editor instance reference for direct programmatic insertions
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // Collapsible Library sidebar state (Left part contains ONLY library)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');

  // Modal for inserting placeholder into Editor Body
  const [isInsertPlaceholderModalOpen, setIsInsertPlaceholderModalOpen] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // Persist templates to localStorage
  useEffect(() => {
    localStorage.setItem('email_templates', JSON.stringify(templates));
  }, [templates]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // When active template changes, sync inputs and resolve cid: image references for visual editor
  const handleSelectTemplate = (templateId: string, listOverride?: EmailTemplate[]) => {
    const list = listOverride ?? templates;
    const target = list.find((t) => t.id === templateId);
    if (!target) return;
    const visualHtml = resolveCidImagesInHtml(target.bodyHtml, target.images || []);
    setActiveTemplateId(target.id);
    setTemplateName(target.name);
    setSubject(target.subject);
    setBodyHtml(visualHtml);

    if (editorInstance) {
      editorInstance.commands.setContent(visualHtml);
    }
  };

  // Read the freshest HTML directly from the live editor instance when saving/duplicating/exporting
  const getLatestBodyHtml = () => {
    if (editorInstance && !editorInstance.isDestroyed) {
      const rawHtml = editorInstance.getHTML();
      const currentFont =
        editorInstance.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif';
      const cleaned = cleanHtmlForOutlook(rawHtml, currentFont);
      if (cleaned !== bodyHtml) {
        setBodyHtml(cleaned);
      }
      return cleaned;
    }
    return bodyHtml;
  };

  // Save current changes to active template: extract images separately & store cid: references in bodyHtml
  const handleSaveTemplate = () => {
    const latestHtml = getLatestBodyHtml();
    const { cidHtml, images } = extractImagesFromHtmlToCid(
      latestHtml,
      currentTemplate?.images || []
    );

    const effectiveName = templateName.trim() || 'Untitled Email Template';

    if (!currentTemplate || !templates.some((t) => t.id === activeTemplateId)) {
      const newId = `template-${Date.now()}`;
      const newTpl: EmailTemplate = {
        id: newId,
        name: effectiveName,
        subject,
        bodyHtml: cidHtml,
        images,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setTemplates([newTpl]);
      setActiveTemplateId(newId);
      setTemplateName(effectiveName);
    } else {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === activeTemplateId
            ? {
                ...t,
                name: effectiveName,
                subject,
                bodyHtml: cidHtml,
                images,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : t
        )
      );
      if (effectiveName !== templateName) {
        setTemplateName(effectiveName);
      }
    }

    if (images.length > 0) {
      showToast(
        `Saved "${effectiveName}" (${images.length} image object${images.length === 1 ? '' : 's'} stored separately with cid: refs)`
      );
    } else {
      showToast(`Template "${effectiveName}" saved!`);
    }
  };

  // Create new blank template (placeholders in single &&)
  const handleNewTemplate = () => {
    const newId = `template-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id: newId,
      name: 'Untitled Email Template',
      subject: '&Project Name& - &Topic& Update',
      bodyHtml: `
        <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b;">
          <p>Dear <strong>&Recipient Name&</strong>,</p>
          <p>Enter your template body here, using dynamic <code>&amp;Placeholders&amp;</code> where appropriate.</p>
        </div>
      `,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
    setTemplateName(newTemplate.name);
    setSubject(newTemplate.subject);
    setBodyHtml(newTemplate.bodyHtml);

    if (editorInstance) {
      editorInstance.commands.setContent(newTemplate.bodyHtml);
    }
    showToast('Created new template');
  };

  // Duplicate current template (with separate image objects & cid: references)
  const handleDuplicateTemplate = () => {
    const latestHtml = getLatestBodyHtml();
    const { cidHtml, images } = extractImagesFromHtmlToCid(
      latestHtml,
      currentTemplate?.images || []
    );
    const copyId = `template-${Date.now()}`;
    const baseName = templateName.trim() || 'Untitled Email Template';
    const copyTemplate: EmailTemplate = {
      ...(currentTemplate || {}),
      id: copyId,
      name: `${baseName} (Copy)`,
      subject,
      bodyHtml: cidHtml,
      images,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setTemplates((prev) => [copyTemplate, ...prev]);
    setActiveTemplateId(copyId);
    setTemplateName(copyTemplate.name);
    showToast('Duplicated template with CID image references');
  };

  // Delete a template (supports deleting any template, including the last one)
  const handleDeleteTemplate = (idToDelete: string) => {
    const remaining = templates.filter((t) => t.id !== idToDelete);
    setTemplates(remaining);
    if (remaining.length > 0) {
      const nextTarget =
        idToDelete === activeTemplateId
          ? remaining[0]
          : remaining.find((t) => t.id === activeTemplateId) || remaining[0];
      handleSelectTemplate(nextTarget.id, remaining);
      showToast('Template deleted');
    } else {
      setActiveTemplateId('');
      setTemplateName('');
      setSubject('');
      setBodyHtml('');
      if (editorInstance) {
        editorInstance.commands.setContent('');
      }
      showToast('All templates deleted');
    }
  };

  // Delete all templates from the builder library at once
  const handleDeleteAllTemplates = () => {
    setTemplates([]);
    setActiveTemplateId('');
    setTemplateName('');
    setSubject('');
    setBodyHtml('');
    if (editorInstance) {
      editorInstance.commands.setContent('');
    }
    showToast('All templates deleted');
  };

  // Export current template as JSON file (with separate images[] objects and cid: references in bodyHtml)
  const handleExportTemplate = () => {
    const latestHtml = getLatestBodyHtml();
    const { cidHtml, images } = extractImagesFromHtmlToCid(
      latestHtml,
      currentTemplate?.images || []
    );
    const exportName = templateName.trim() || 'email-template';
    const dataToExport = {
      name: exportName,
      subject,
      bodyHtml: cidHtml,
      images,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported JSON (${images.length} separate CID image object${images.length === 1 ? '' : 's'})`);
  };

  // Import template from JSON or Outlook .MHT file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const isMht =
        file.name.toLowerCase().endsWith('.mht') ||
        file.name.toLowerCase().endsWith('.mhtml') ||
        file.name.toLowerCase().endsWith('.eml');

      const rawText = await file.text();

      if (isMht || isMhtContent(rawText)) {
        const parsedMht = await readFileAsMht(file);
        const { cidHtml, images } = extractImagesFromHtmlToCid(parsedMht.html);
        const importedId = `template-${Date.now()}`;
        const importedTemplate: EmailTemplate = {
          id: importedId,
          name: file.name.replace(/\.(mht|mhtml|eml)$/i, ''),
          subject: parsedMht.subject || 'Imported Outlook Template',
          bodyHtml: cidHtml,
          images,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        const nextList = [importedTemplate, ...templates];
        setTemplates(nextList);
        handleSelectTemplate(importedId, nextList);
        showToast(`Imported MHT template (${images.length} CID image object${images.length === 1 ? '' : 's'})`);
      } else {
        const parsed = JSON.parse(rawText);
        if (parsed.name && (parsed.bodyHtml || parsed.subject)) {
          if (Array.isArray(parsed.images) && parsed.images.length > 0) {
            saveImageObjectsToStore(parsed.images);
          }
          const { cidHtml, images } = extractImagesFromHtmlToCid(
            parsed.bodyHtml || '<p>Imported template body</p>',
            Array.isArray(parsed.images) ? parsed.images : []
          );
          const importedId = `template-${Date.now()}`;
          const importedTemplate: EmailTemplate = {
            id: importedId,
            name: parsed.name,
            subject: parsed.subject || 'Imported Subject',
            bodyHtml: cidHtml,
            images,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          const nextList = [importedTemplate, ...templates];
          setTemplates(nextList);
          handleSelectTemplate(importedId, nextList);
          showToast(`Imported template: ${parsed.name}`);
        } else {
          showToast('Invalid template JSON format');
        }
      }
    } catch {
      showToast('Failed to parse template file');
    }

    e.target.value = '';
  };

  // Insert placeholder token (single && format e.g. &name&) into Editor Body
  const handleInsertPlaceholderIntoBody = (token: string) => {
    if (!editorInstance) return;
    editorInstance.chain().focus().insertContent(` ${token} `).run();
    showToast(`Inserted placeholder ${token}`);
  };

  // Filter templates in library
  const filteredTemplates = useMemo(() => {
    const q = librarySearchQuery.toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }, [templates, librarySearchQuery]);

  // Detected placeholders in current active template (memoized)
  const subjectPlaceholders = useMemo(() => extractPlaceholders(subject), [subject]);
  const bodyPlaceholders = useMemo(() => extractPlaceholders(bodyHtml), [bodyHtml]);
  const totalPlaceholders = useMemo(
    () => new Set([...subjectPlaceholders, ...bodyPlaceholders]).size,
    [subjectPlaceholders, bodyPlaceholders]
  );

  // Fast image count for status bar without DOM parsing or localStorage writes on every edit
  const activeImageCount = useMemo(() => {
    if (!bodyHtml) return 0;
    const matches = bodyHtml.match(/<img\b/gi);
    return matches ? matches.length : 0;
  }, [bodyHtml]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100 overflow-hidden font-sans">
      {/* Hidden File Input for JSON / MHT import */}
      <input
        ref={fileImportInputRef}
        type="file"
        accept=".json,.mht,.mhtml,.eml"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Builder Control Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap z-20">
        {/* Left: Template Selector & Renaming */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-slate-600 hover:text-magenta-700 hover:bg-magenta-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title={isSidebarCollapsed ? 'Expand Template Library' : 'Collapse Template Library'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Template Selector Dropdown */}
          <div className="relative">
            <select
              value={activeTemplateId}
              disabled={templates.length === 0}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 disabled:opacity-60 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 pl-3 pr-8 py-1.5 focus:outline-none focus:border-magenta-500 cursor-pointer max-w-[200px] truncate"
            >
              {templates.length === 0 ? (
                <option value="">No templates saved</option>
              ) : (
                templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Editable Template Name */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name..."
              className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-magenta-500 focus:outline-none px-1 py-0.5 transition-colors"
              title="Click to rename template"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={handleNewTemplate}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="New Blank Template"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDuplicateTemplate}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Duplicate Template"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportTemplate}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            {currentTemplate && (
              <button
                type="button"
                onClick={() => handleDeleteTemplate(currentTemplate.id)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Current Template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions (Save) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-magenta-600 hover:bg-magenta-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Save template and separate image objects with cid: references"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT PART: Collapsible & Contains ONLY Library */}
        <aside
          className={`${
            isSidebarCollapsed ? 'w-12' : 'w-full md:w-80'
          } bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 min-h-0 overflow-hidden z-10`}
        >
          {/* Collapsed State View */}
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center py-4 h-full bg-slate-50">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 text-slate-600 hover:text-magenta-700 hover:bg-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Expand Template Library"
              >
                <PanelLeftOpen className="w-5 h-5 text-magenta-600" />
              </button>
              <div
                className="mt-8 text-xs font-bold text-slate-400 tracking-widest uppercase cursor-pointer hover:text-slate-700"
                style={{ writingMode: 'vertical-rl' }}
                onClick={() => setIsSidebarCollapsed(false)}
              >
                Template Library ({templates.length})
              </div>
            </div>
          ) : (
            /* Expanded Library Contents (ONLY LIBRARY) */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Library Header */}
              <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FolderOpen className="w-4 h-4 text-magenta-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
                    Template Library
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full shrink-0">
                    {templates.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {templates.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllTemplates}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded hover:text-rose-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Delete all templates from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNewTemplate}
                    className="p-1 text-magenta-600 hover:bg-magenta-50 rounded hover:text-magenta-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Create New Blank Template"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/60 cursor-pointer"
                    title="Collapse Library"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Filter in Library */}
              <div className="p-2.5 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    placeholder="Search library templates..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-magenta-500 focus:bg-white transition-colors"
                  />
                  {librarySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLibrarySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Saved Templates List Cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-slate-50">
                {templates.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center gap-2.5 text-xs text-slate-500">
                    <p className="text-slate-400">No templates in library.</p>
                    <button
                      type="button"
                      onClick={handleNewTemplate}
                      className="px-3 py-1.5 bg-magenta-600 hover:bg-magenta-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Template</span>
                    </button>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No templates matching "{librarySearchQuery}".
                  </div>
                ) : (
                  filteredTemplates.map((tpl) => {
                    const isActive = tpl.id === activeTemplateId;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1.5 group ${
                          isActive
                            ? 'bg-magenta-50/80 border-magenta-300 ring-1 ring-magenta-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate flex-1">
                            {tpl.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(tpl.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {tpl.subject}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Updated {tpl.updatedAt}</span>
                          {tpl.category && (
                            <span className="bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                              {tpl.category}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Library Bottom Actions */}
              <div className="p-2.5 border-t border-slate-200 bg-white flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => fileImportInputRef.current?.click()}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Import template from JSON or Outlook .MHT file"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportTemplate}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Export template to JSON (HTML with cid: references + separate image objects)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* CENTER / RIGHT: Template Editor Canvas & Elements */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-slate-100">
          {/* Subject Line Builder Bar (No Presets!) */}
          <SubjectBuilder
            subject={subject}
            onChangeSubject={setSubject}
          />

          {/* Builder Insertion Utility Bar (Placeholders) */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Insert Placeholder Button with manual ID */}
              <button
                type="button"
                onClick={() => setIsInsertPlaceholderModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-magenta-700 bg-white hover:bg-magenta-50 border border-magenta-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Insert dynamic placeholder with manual ID"
              >
                <Tag className="w-3.5 h-3.5 text-magenta-600" />
                <span>+ Insert Placeholder</span>
              </button>
            </div>

            {/* Quick helper tag */}
            <div className="text-[11px] text-slate-500 hidden lg:flex items-center gap-1 font-medium">
              <span>💡 Placeholders use</span>
              <code className="text-magenta-700 font-bold bg-magenta-50 px-1 py-0.5 rounded">&amp;id&amp;</code>
            </div>
          </div>

          {/* Rich Body Canvas */}
          <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 overflow-hidden">
            <RichTextEmailEditor
              value={bodyHtml}
              predefinedTexts={[]}
              onChangeHtml={setBodyHtml}
              onEditorReady={setEditorInstance}
              className="flex-1 min-h-0 h-full"
            />
          </div>

          {/* Builder Status Bar */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-magenta-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-magenta-500" />
                {totalPlaceholders} variables detected
              </span>
              <span className="text-slate-300">•</span>
              <span>{subjectPlaceholders.length} in subject</span>
              <span className="text-slate-300">•</span>
              <span>{bodyPlaceholders.length} in body</span>
              <span className="text-slate-300">•</span>
              <span
                className="inline-flex items-center gap-1 text-slate-700 font-semibold"
                title="Images are stored as separate objects and referenced via cid: in saved template HTML and MHT exports"
              >
                <ImageIcon className="w-3 h-3 text-magenta-600" />
                {activeImageCount} CID image {activeImageCount === 1 ? 'object' : 'objects'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 hidden sm:inline">
                Images saved separately with <code>cid:</code> references
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Insert Placeholder Modal with Manual ID Input */}
      <InsertPlaceholderModal
        isOpen={isInsertPlaceholderModalOpen}
        onClose={() => setIsInsertPlaceholderModalOpen(false)}
        targetName="email body"
        onInsert={(token) => handleInsertPlaceholderIntoBody(token)}
      />
    </div>
  );
};
