import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Rows3,
  Columns3,
  Plus,
  Minus,
  Trash2,
  Table as TableIcon,
  Combine,
  PaintBucket,
  Split,
  EyeOff,
  Eye,
  Grid3X3,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  BorderLineStyle,
  BorderScope,
  BorderSidesPreset,
  TableBorderConfig,
} from '../types';
import {
  BORDER_COLOR_PALETTE,
  BORDER_SIDES_OPTIONS,
  BORDER_STYLE_OPTIONS,
  BORDER_WIDTH_OPTIONS,
  applyTableBorderConfig,
  buildCellBorderCss,
  detectCurrentTableBorderConfig,
  stepBorderWidth,
  syncNewTableCellsBorder,
} from '../utils/tableBorderUtils';

interface TableControlsProps {
  editor: Editor | null;
  onCloseTableToolbar?: () => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  editor,
}) => {
  const [showShadingPicker, setShowShadingPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [borderScope, setBorderScope] = useState<BorderScope>('table');

  const shadingRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shadingRef.current && !shadingRef.current.contains(e.target as Node)) {
        setShowShadingPicker(false);
      }
      if (borderRef.current && !borderRef.current.contains(e.target as Node)) {
        setShowBorderPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor || !editor.isActive('table')) {
    return null;
  }

  // Detect active cell/table border config
  const activeBorder = detectCurrentTableBorderConfig(editor);
  const isInvisible =
    activeBorder.sides === 'none' ||
    activeBorder.style === 'none' ||
    activeBorder.width === '0px';

  const currentCellBorderCss = buildCellBorderCss(activeBorder);

  const handleCellBgColor = (color: string) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setShowShadingPicker(false);
  };

  const handleApplyBorderUpdate = (partial: Partial<TableBorderConfig>) => {
    const nextConfig: TableBorderConfig = {
      ...activeBorder,
      ...partial,
      scope: partial.scope ?? borderScope,
    };

    // If user selects a visible width/color/sides while style was 'none', restore 'solid'
    if (
      partial.width &&
      partial.width !== '0px' &&
      nextConfig.style === 'none'
    ) {
      nextConfig.style = 'solid';
      if (nextConfig.sides === 'none') nextConfig.sides = 'all';
    }
    if (
      partial.sides &&
      partial.sides !== 'none' &&
      (nextConfig.style === 'none' || nextConfig.width === '0px')
    ) {
      nextConfig.style = 'solid';
      nextConfig.width = '1px';
    }
    if (
      partial.style &&
      partial.style !== 'none' &&
      (nextConfig.width === '0px' || nextConfig.sides === 'none')
    ) {
      if (nextConfig.width === '0px') nextConfig.width = '1px';
      if (nextConfig.sides === 'none') nextConfig.sides = 'all';
    }
    if (partial.color && (nextConfig.style === 'none' || nextConfig.width === '0px' || nextConfig.sides === 'none')) {
      if (nextConfig.style === 'none') nextConfig.style = 'solid';
      if (nextConfig.width === '0px') nextConfig.width = '1px';
      if (nextConfig.sides === 'none') nextConfig.sides = 'all';
    }

    applyTableBorderConfig(editor, nextConfig);
  };

  const handleToggleInvisibleBorders = () => {
    if (isInvisible) {
      applyTableBorderConfig(editor, {
        width: '1px',
        style: 'solid',
        color: activeBorder.color || '#cbd5e1',
        sides: 'all',
        scope: borderScope,
      });
    } else {
      applyTableBorderConfig(editor, {
        width: '0px',
        style: 'none',
        color: activeBorder.color || '#cbd5e1',
        sides: 'none',
        scope: borderScope,
      });
    }
  };

  const handleStepThickness = (direction: 'thinner' | 'thicker') => {
    const nextWidth = stepBorderWidth(activeBorder.width, direction);
    if (nextWidth === '0px') {
      applyTableBorderConfig(editor, {
        ...activeBorder,
        width: '0px',
        style: 'none',
        sides: 'none',
        scope: borderScope,
      });
    } else {
      applyTableBorderConfig(editor, {
        ...activeBorder,
        width: nextWidth,
        style: activeBorder.style === 'none' ? 'solid' : activeBorder.style,
        sides: activeBorder.sides === 'none' ? 'all' : activeBorder.sides,
        scope: borderScope,
      });
    }
  };

  const handleAddRowBefore = () => {
    editor.chain().focus().addRowBefore().run();
    syncNewTableCellsBorder(editor, currentCellBorderCss);
  };

  const handleAddRowAfter = () => {
    editor.chain().focus().addRowAfter().run();
    syncNewTableCellsBorder(editor, currentCellBorderCss);
  };

  const handleAddColBefore = () => {
    editor.chain().focus().addColumnBefore().run();
    syncNewTableCellsBorder(editor, currentCellBorderCss);
  };

  const handleAddColAfter = () => {
    editor.chain().focus().addColumnAfter().run();
    syncNewTableCellsBorder(editor, currentCellBorderCss);
  };

  const handleDeleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
    if (editor.isEmpty) {
      editor.commands.setContent('<p></p>');
      editor.commands.focus('start');
    }
  };

  return (
    <div className="bg-gradient-to-r from-magenta-50/90 via-pink-50/40 to-slate-50 border-b border-magenta-200 px-3 py-1.5 flex flex-wrap items-center gap-2 text-slate-700 select-none shadow-xs text-xs animate-in fade-in duration-100">
      {/* Table Editor Header Badge */}
      <div className="flex items-center gap-1.5 bg-magenta-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-xs">
        <TableIcon className="w-3.5 h-3.5" />
        <span>Table</span>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Row Operations */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-slate-500 mr-0.5">Rows:</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddRowBefore}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Add Row Above"
        >
          <Rows3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Above</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddRowAfter}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Add Row Below"
        >
          <Rows3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Below</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded text-rose-600 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Delete Current Row"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Row</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Column Operations */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-slate-500 mr-0.5">Cols:</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddColBefore}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Add Column Left"
        >
          <Columns3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Left</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddColAfter}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Add Column Right"
        >
          <Columns3 className="w-3.5 h-3.5 text-magenta-600" />
          <Plus className="w-2.5 h-2.5 text-magenta-600 -ml-0.5" />
          <span>Right</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded text-rose-600 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Delete Current Column"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Col</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Table Borders Customization Section */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-slate-500 mr-0.5">Borders:</span>

        {/* Main Borders Customizer Popover Button */}
        <div className="relative" ref={borderRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowBorderPicker(!showBorderPicker);
              setShowShadingPicker(false);
            }}
            className={`px-2.5 py-1 border rounded font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
              showBorderPicker
                ? 'bg-magenta-600 text-white border-magenta-700'
                : 'bg-white hover:bg-magenta-100/70 border-slate-200 hover:border-magenta-300 text-slate-700'
            }`}
            title="Customize Table Borders (Visibility, Thickness, Style, Color, Sides)"
          >
            <Grid3X3 className={`w-3.5 h-3.5 ${showBorderPicker ? 'text-white' : 'text-magenta-600'}`} />
            <span>Customize</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
              style={{
                backgroundColor: isInvisible ? 'transparent' : activeBorder.color,
                borderStyle: isInvisible ? 'dashed' : 'solid',
              }}
            />
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showBorderPicker && (
            <div className="absolute left-0 mt-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 w-80 animate-in fade-in zoom-in-95 duration-100 space-y-3.5 text-slate-700">
              {/* Header & Scope Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5 text-magenta-600" />
                  Table Border Settings
                </span>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setBorderScope('table')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      borderScope === 'table'
                        ? 'bg-white text-magenta-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Apply border changes to the entire table"
                  >
                    Entire Table
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setBorderScope('cells')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      borderScope === 'cells'
                        ? 'bg-white text-magenta-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Apply border changes only to selected cell(s)"
                  >
                    Selected Cells
                  </button>
                </div>
              </div>

              {/* 1. Border Sides / Visibility Presets */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Border Visibility &amp; Sides
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {BORDER_SIDES_OPTIONS.map((opt) => {
                    const isSelected = activeBorder.sides === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handleApplyBorderUpdate({
                            sides: opt.value as BorderSidesPreset,
                            style: opt.value === 'none' ? 'none' : activeBorder.style === 'none' ? 'solid' : activeBorder.style,
                            width: opt.value === 'none' ? '0px' : activeBorder.width === '0px' ? '1px' : activeBorder.width,
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'border-magenta-600 bg-magenta-50 text-magenta-900 font-semibold'
                            : 'border-slate-200 hover:border-magenta-300 bg-slate-50/60 hover:bg-white text-slate-700'
                        }`}
                        title={opt.desc}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-magenta-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Border Thickness (Thinner / Thicker) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  <span>Thickness (Thinner / Thicker)</span>
                  <span className="text-magenta-600 font-mono">{activeBorder.width}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {BORDER_WIDTH_OPTIONS.map((w) => {
                    const isSelected = activeBorder.width === w.value;
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handleApplyBorderUpdate({
                            width: w.value,
                            style: w.value === '0px' ? 'none' : activeBorder.style === 'none' ? 'solid' : activeBorder.style,
                            sides: w.value === '0px' ? 'none' : activeBorder.sides === 'none' ? 'all' : activeBorder.sides,
                          })
                        }
                        className={`py-1.5 px-1.5 rounded-lg border text-center text-[11px] font-mono transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'border-magenta-600 bg-magenta-50 text-magenta-900 font-bold ring-1 ring-magenta-500/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                        title={w.label}
                      >
                        <span>{w.shortLabel}</span>
                        <span
                          className="w-full rounded-full"
                          style={{
                            height: w.value === '0px' ? '1px' : w.value,
                            backgroundColor: w.value === '0px' ? 'transparent' : activeBorder.color,
                            borderTop: w.value === '0px' ? '1px dashed #cbd5e1' : 'none',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Border Line Style */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Line Style
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {BORDER_STYLE_OPTIONS.map((st) => {
                    const isSelected = activeBorder.style === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handleApplyBorderUpdate({
                            style: st.value as BorderLineStyle,
                            width: st.value === 'none' ? '0px' : activeBorder.width === '0px' ? '1px' : activeBorder.width,
                            sides: st.value === 'none' ? 'none' : activeBorder.sides === 'none' ? 'all' : activeBorder.sides,
                          })
                        }
                        className={`py-1.5 px-1 rounded-lg border text-[10px] font-medium transition cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-magenta-600 bg-magenta-50 text-magenta-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                        title={st.label}
                      >
                        <span>{st.value === 'none' ? 'None' : st.label}</span>
                        <span
                          className="w-8"
                          style={{
                            borderBottomWidth: st.value === 'double' ? '3px' : '2px',
                            borderBottomStyle: st.value === 'none' ? 'none' : st.value,
                            borderBottomColor: activeBorder.color,
                            height: st.value === 'none' ? '2px' : undefined,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Border Color */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Border Color
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {BORDER_COLOR_PALETTE.map((item) => {
                    const isSelected =
                      !isInvisible &&
                      activeBorder.color.toLowerCase() === item.color.toLowerCase();
                    return (
                      <button
                        key={item.color}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleApplyBorderUpdate({ color: item.color })}
                        className={`w-8 h-7 rounded-md border transition hover:scale-105 cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-magenta-600 border-white'
                            : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.label}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              item.color === '#ffffff' || item.color === '#e2e8f0' || item.color === '#cbd5e1'
                                ? 'text-slate-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">Custom Color:</span>
                    <input
                      type="color"
                      value={activeBorder.color.startsWith('#') ? activeBorder.color : '#cbd5e1'}
                      onChange={(e) => handleApplyBorderUpdate({ color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                      title="Pick custom border color"
                    />
                  </div>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      applyTableBorderConfig(editor, {
                        width: '1px',
                        style: 'solid',
                        color: '#cbd5e1',
                        sides: 'all',
                        scope: borderScope,
                      })
                    }
                    className="text-[11px] text-slate-500 hover:text-magenta-700 font-medium hover:underline cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick 1-Click Invisible Toggle Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleInvisibleBorders}
          className={`px-2 py-1 border rounded font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer ${
            isInvisible
              ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
              : 'bg-white hover:bg-magenta-100/70 border-slate-200 hover:border-magenta-300 text-slate-700'
          }`}
          title={isInvisible ? 'Borders are Invisible — Click to show borders' : 'Make table borders Invisible'}
        >
          {isInvisible ? (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Show</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Invisible</span>
            </>
          )}
        </button>

        {/* Quick Thinner / Thicker Stepper */}
        <div
          className="flex items-center bg-white border border-slate-200 rounded shadow-2xs overflow-hidden"
          title="Make table borders thinner or thicker"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepThickness('thinner')}
            disabled={isInvisible}
            className="px-1.5 py-1 hover:bg-magenta-50 text-slate-600 hover:text-magenta-700 disabled:opacity-40 transition cursor-pointer"
            title="Make Borders Thinner"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="px-1.5 text-[11px] font-mono font-semibold text-slate-700 border-x border-slate-100 min-w-[34px] text-center">
            {isInvisible ? '0px' : activeBorder.width}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepThickness('thicker')}
            className="px-1.5 py-1 hover:bg-magenta-50 text-slate-600 hover:text-magenta-700 transition cursor-pointer"
            title="Make Borders Thicker"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-magenta-200 my-auto" />

      {/* Cell Operations */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Merge Selected Cells"
        >
          <Combine className="w-3.5 h-3.5 text-magenta-600" />
          <span>Merge</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().splitCell().run()}
          className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
          title="Split Merged Cell"
        >
          <Split className="w-3.5 h-3.5 text-magenta-600" />
          <span>Split</span>
        </button>

        {/* Cell Shading Dropdown */}
        <div className="relative" ref={shadingRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowShadingPicker(!showShadingPicker);
              setShowBorderPicker(false);
            }}
            className="px-2 py-1 bg-white hover:bg-magenta-100/70 border border-slate-200 hover:border-magenta-300 rounded text-slate-700 font-medium flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Cell Background Color / Shading"
          >
            <PaintBucket className="w-3.5 h-3.5 text-magenta-600" />
            <span>Shading</span>
          </button>

          {showShadingPicker && (
            <div className="absolute left-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-44 animate-in fade-in duration-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Cell Shading
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { label: 'White', color: '#ffffff' },
                  { label: 'Light Magenta', color: '#fdf2f8' },
                  { label: 'Medium Magenta', color: '#fce7f3' },
                  { label: 'Slate', color: '#f8fafc' },
                  { label: 'Light Yellow', color: '#fff4ce' },
                  { label: 'Light Blue', color: '#eff6fc' },
                  { label: 'Light Green', color: '#e6f2ed' },
                  { label: 'Dark Gray', color: '#334155' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCellBgColor(item.color)}
                    className="w-8 h-8 rounded border border-slate-300 hover:scale-110 transition shadow-2xs cursor-pointer"
                    style={{ backgroundColor: item.color }}
                    title={item.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-600">Custom:</span>
                <input
                  type="color"
                  onChange={(e) => handleCellBgColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                  title="Choose custom background color"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Table Action */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDeleteTable}
          className="px-3 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-semibold rounded-md border border-rose-300 hover:border-rose-600 flex items-center gap-1.5 text-xs transition shadow-2xs cursor-pointer"
          title="Remove Entire Table from Document"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          <span>Delete Table</span>
        </button>
      </div>
    </div>
  );
};
