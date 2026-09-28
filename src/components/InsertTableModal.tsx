import React, { useState } from 'react';
import { Table, X, Check, Grid3X3 } from 'lucide-react';
import {
  BorderLineStyle,
  BorderSidesPreset,
  TableBorderConfig,
  TablePreset,
} from '../types';
import {
  BORDER_COLOR_PALETTE,
  BORDER_SIDES_OPTIONS,
  BORDER_STYLE_OPTIONS,
  BORDER_WIDTH_OPTIONS,
} from '../utils/tableBorderUtils';

interface InsertTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: {
    rows: number;
    cols: number;
    withHeaderRow: boolean;
    preset: TablePreset;
    borderConfig: TableBorderConfig;
  }) => void;
}

export const InsertTableModal: React.FC<InsertTableModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [hoverRows, setHoverRows] = useState(3);
  const [hoverCols, setHoverCols] = useState(3);
  const [selectedRows, setSelectedRows] = useState(3);
  const [selectedCols, setSelectedCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const [preset, setPreset] = useState<TablePreset>('standard');

  // Initial border configuration state
  const [borderWidth, setBorderWidth] = useState<string>('1px');
  const [borderStyle, setBorderStyle] = useState<BorderLineStyle>('solid');
  const [borderColor, setBorderColor] = useState<string>('#cbd5e1');
  const [borderSides, setBorderSides] = useState<BorderSidesPreset>('all');

  if (!isOpen) return null;

  const handleGridClick = (r: number, c: number) => {
    setSelectedRows(r);
    setSelectedCols(c);
  };

  const handleSelectPreset = (nextPreset: TablePreset) => {
    setPreset(nextPreset);
    if (nextPreset === 'standard' || nextPreset === 'striped') {
      setBorderWidth('1px');
      setBorderStyle('solid');
      setBorderColor('#cbd5e1');
      setBorderSides('all');
    } else if (nextPreset === 'accent-header') {
      setBorderWidth('1px');
      setBorderStyle('solid');
      setBorderColor('#f472b6');
      setBorderSides('all');
    } else if (nextPreset === 'minimal') {
      setBorderWidth('1px');
      setBorderStyle('solid');
      setBorderColor('#e2e8f0');
      setBorderSides('horizontal');
    } else if (nextPreset === 'borderless') {
      setBorderWidth('0px');
      setBorderStyle('none');
      setBorderSides('none');
    } else if (nextPreset === 'thick-accent') {
      setBorderWidth('2px');
      setBorderStyle('solid');
      setBorderColor('#e20074');
      setBorderSides('all');
    }
  };

  const handleConfirm = () => {
    onInsert({
      rows: selectedRows,
      cols: selectedCols,
      withHeaderRow,
      preset,
      borderConfig: {
        width: borderWidth,
        style: borderStyle,
        color: borderColor,
        sides: borderSides,
        scope: 'table',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <Table className="w-5 h-5 text-magenta-600" />
            <span>Insert Table for Email</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Grid Selector */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
              <span>Grid Dimension ({hoverRows} × {hoverCols})</span>
              <span className="text-magenta-600 font-bold">
                {selectedRows} Rows, {selectedCols} Columns selected
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 inline-block">
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: 6 }).map((_, rIdx) =>
                  Array.from({ length: 8 }).map((_, cIdx) => {
                    const r = rIdx + 1;
                    const c = cIdx + 1;
                    const isHovered = r <= hoverRows && c <= hoverCols;
                    const isSelected = r <= selectedRows && c <= selectedCols;

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        onMouseEnter={() => {
                          setHoverRows(r);
                          setHoverCols(c);
                        }}
                        onClick={() => handleGridClick(r, c)}
                        className={`w-6 h-6 rounded-xs border transition cursor-pointer ${
                          isSelected
                            ? 'bg-magenta-500 border-magenta-600'
                            : isHovered
                            ? 'bg-magenta-100 border-magenta-300'
                            : 'bg-white border-slate-300 hover:border-slate-400'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Preset Styles */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Outlook Table Style Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', name: 'Clean Standard', desc: 'Thin slate borders, subtle header' },
                { id: 'borderless', name: 'Invisible Borders', desc: 'Completely borderless layout' },
                { id: 'accent-header', name: 'Magenta Accent', desc: 'Brand accent header & borders' },
                { id: 'thick-accent', name: 'Thick Accent Borders', desc: '2px bold magenta gridlines' },
                { id: 'striped', name: 'Alternating Rows', desc: 'Easy scan row shading' },
                { id: 'minimal', name: 'Horizontal Only', desc: 'Top & bottom row dividers only' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectPreset(style.id as TablePreset)}
                  className={`p-2 text-left rounded-lg border transition cursor-pointer ${
                    preset === style.id
                      ? 'border-magenta-600 bg-magenta-50/70 text-magenta-900 ring-2 ring-magenta-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span>{style.name}</span>
                    {preset === style.id && <Check className="w-3.5 h-3.5 text-magenta-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Border Customization Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-magenta-600" />
                Customize Table Borders
              </span>
              <span className="text-[11px] font-mono text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded border border-magenta-200 font-semibold">
                {borderSides === 'none' || borderStyle === 'none' || borderWidth === '0px'
                  ? 'Invisible (No Borders)'
                  : `${borderWidth} ${borderStyle}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Width / Thickness */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Thickness
                </label>
                <select
                  value={borderWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBorderWidth(val);
                    if (val === '0px') {
                      setBorderStyle('none');
                      setBorderSides('none');
                    } else {
                      if (borderStyle === 'none') setBorderStyle('solid');
                      if (borderSides === 'none') setBorderSides('all');
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  {BORDER_WIDTH_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Style */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Line Style
                </label>
                <select
                  value={borderStyle}
                  onChange={(e) => {
                    const val = e.target.value as BorderLineStyle;
                    setBorderStyle(val);
                    if (val === 'none') {
                      setBorderWidth('0px');
                      setBorderSides('none');
                    } else {
                      if (borderWidth === '0px') setBorderWidth('1px');
                      if (borderSides === 'none') setBorderSides('all');
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  {BORDER_STYLE_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Border Sides */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sides / Layout
                </label>
                <select
                  value={borderSides}
                  onChange={(e) => {
                    const val = e.target.value as BorderSidesPreset;
                    setBorderSides(val);
                    if (val === 'none') {
                      setBorderStyle('none');
                      setBorderWidth('0px');
                    } else {
                      if (borderStyle === 'none') setBorderStyle('solid');
                      if (borderWidth === '0px') setBorderWidth('1px');
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  {BORDER_SIDES_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Border Color Swatches */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Border Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {BORDER_COLOR_PALETTE.slice(0, 8).map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      setBorderColor(c.color);
                      if (borderStyle === 'none') setBorderStyle('solid');
                      if (borderWidth === '0px') setBorderWidth('1px');
                      if (borderSides === 'none') setBorderSides('all');
                    }}
                    className={`w-6 h-6 rounded-md border transition hover:scale-110 cursor-pointer ${
                      borderColor.toLowerCase() === c.color.toLowerCase()
                        ? 'ring-2 ring-magenta-600 border-white'
                        : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
                <input
                  type="color"
                  value={borderColor.startsWith('#') ? borderColor : '#cbd5e1'}
                  onChange={(e) => {
                    setBorderColor(e.target.value);
                    if (borderStyle === 'none') setBorderStyle('solid');
                    if (borderWidth === '0px') setBorderWidth('1px');
                    if (borderSides === 'none') setBorderSides('all');
                  }}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 ml-1"
                  title="Custom Border Color"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              type="checkbox"
              id="headerRow"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              className="w-4 h-4 text-magenta-600 rounded border-slate-300 focus:ring-magenta-500 cursor-pointer"
            />
            <label htmlFor="headerRow" className="text-xs font-medium text-slate-700 cursor-pointer">
              Include styled Header Row
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-magenta-600 hover:bg-magenta-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};
