import React, { useState } from 'react';
import { Table, X, Check } from 'lucide-react';
import { TablePreset } from '../types';

interface InsertTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: {
    rows: number;
    cols: number;
    withHeaderRow: boolean;
    preset: TablePreset;
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

  if (!isOpen) return null;

  const handleGridClick = (r: number, c: number) => {
    setSelectedRows(r);
    setSelectedCols(c);
  };

  const handleConfirm = () => {
    onInsert({
      rows: selectedRows,
      cols: selectedCols,
      withHeaderRow,
      preset,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <Table className="w-5 h-5 text-magenta-600" />
            <span>Insert Table for Email</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Grid Selector */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
              <span>Grid Dimension ({hoverRows} × {hoverCols})</span>
              <span className="text-magenta-600 font-bold">{selectedRows} Rows, {selectedCols} Columns selected</span>
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
                        className={`w-6 h-6 rounded-xs border transition ${
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
              Outlook Table Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', name: 'Clean Standard', desc: 'Light gray borders, subtle header' },
                { id: 'accent-header', name: 'Magenta Accent Header', desc: 'Brand accent header theme' },
                { id: 'striped', name: 'Alternating Rows', desc: 'Easy scan row shading' },
                { id: 'minimal', name: 'Minimal Borderless', desc: 'Bottom underline borders only' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setPreset(style.id as TablePreset)}
                  className={`p-2.5 text-left rounded-lg border transition ${
                    preset === style.id
                      ? 'border-magenta-600 bg-magenta-50/70 text-magenta-900 ring-2 ring-magenta-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium text-xs">
                    <span>{style.name}</span>
                    {preset === style.id && <Check className="w-3.5 h-3.5 text-magenta-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              type="checkbox"
              id="headerRow"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              className="w-4 h-4 text-magenta-600 rounded border-slate-300 focus:ring-magenta-500"
            />
            <label htmlFor="headerRow" className="text-xs font-medium text-slate-700 cursor-pointer">
              Include styled Header Row
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-magenta-600 hover:bg-magenta-700 rounded-lg shadow-xs transition"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};

