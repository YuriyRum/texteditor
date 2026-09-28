import { Editor } from '@tiptap/react';
import {
  BorderLineStyle,
  BorderSidesPreset,
  TableBorderConfig,
  TablePreset,
} from '../types';

export const BORDER_WIDTH_OPTIONS: { value: string; label: string; shortLabel: string }[] = [
  { value: '0px', label: '0px (Invisible)', shortLabel: '0px' },
  { value: '0.5px', label: '0.5px (Hairline)', shortLabel: '0.5px' },
  { value: '1px', label: '1px (Thin - Default)', shortLabel: '1px' },
  { value: '1.5px', label: '1.5px (Regular)', shortLabel: '1.5px' },
  { value: '2px', label: '2px (Medium)', shortLabel: '2px' },
  { value: '3px', label: '3px (Thick)', shortLabel: '3px' },
  { value: '4px', label: '4px (Extra Thick)', shortLabel: '4px' },
  { value: '6px', label: '6px (Heavy)', shortLabel: '6px' },
];

export const BORDER_STYLE_OPTIONS: { value: BorderLineStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
  { value: 'none', label: 'Invisible (None)' },
];

export const BORDER_COLOR_PALETTE: { label: string; color: string }[] = [
  { label: 'Light Slate (Default)', color: '#cbd5e1' },
  { label: 'Soft Gray', color: '#e2e8f0' },
  { label: 'Medium Slate', color: '#64748b' },
  { label: 'Dark Slate', color: '#334155' },
  { label: 'Black', color: '#0f172a' },
  { label: 'Brand Magenta', color: '#e20074' },
  { label: 'Deep Magenta', color: '#9d174d' },
  { label: 'Soft Pink', color: '#f472b6' },
  { label: 'Outlook Blue', color: '#0078d4' },
  { label: 'Emerald Green', color: '#107c41' },
  { label: 'Amber Gold', color: '#d97706' },
  { label: 'Crimson Red', color: '#e11d48' },
];

export const BORDER_SIDES_OPTIONS: {
  value: BorderSidesPreset;
  label: string;
  desc: string;
}[] = [
  { value: 'all', label: 'All Borders', desc: 'Grid borders on all 4 sides' },
  { value: 'none', label: 'Invisible (No Borders)', desc: 'Hide all borders completely' },
  { value: 'outer', label: 'Outside Borders Only', desc: 'Outer box frame only, no inner lines' },
  { value: 'inner', label: 'Inside Gridlines Only', desc: 'Inner dividers only, no outer box' },
  { value: 'horizontal', label: 'Horizontal Lines Only', desc: 'Top & bottom row borders only' },
  { value: 'vertical', label: 'Vertical Lines Only', desc: 'Left & right column borders only' },
  { value: 'bottom', label: 'Bottom Border Only', desc: 'Single underline on bottom edge' },
  { value: 'top', label: 'Top Border Only', desc: 'Single overline on top edge' },
  { value: 'left', label: 'Left Border Only', desc: 'Left edge border only' },
  { value: 'right', label: 'Right Border Only', desc: 'Right edge border only' },
];

const BORDER_CSS_PROPS = new Set([
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-width',
  'border-style',
  'border-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
]);

/**
 * Extracts any border-* CSS rules from an inline style string
 */
export function extractBorderCssFromStyle(styleStr: string | null | undefined): string | null {
  if (!styleStr) return null;
  const borderParts: string[] = [];

  styleStr.split(';').forEach((raw) => {
    const part = raw.trim();
    if (!part) return;
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) return;
    const propName = part.slice(0, colonIdx).trim().toLowerCase();
    if (BORDER_CSS_PROPS.has(propName)) {
      borderParts.push(part);
    }
  });

  if (borderParts.length === 0) return null;
  return `${borderParts.join('; ')};`;
}

/**
 * Strips background-color and/or border-* properties from an inline style string
 * so managed attributes do not conflict with raw style strings.
 */
export function stripManagedStyleProps(
  styleStr: string | null | undefined,
  stripBackground: boolean,
  stripBorder: boolean
): string | null {
  if (!styleStr) return null;
  const kept: string[] = [];

  styleStr.split(';').forEach((raw) => {
    const part = raw.trim();
    if (!part) return;
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) return;
    const propName = part.slice(0, colonIdx).trim().toLowerCase();

    if (stripBackground && propName === 'background-color') return;
    if (stripBorder && BORDER_CSS_PROPS.has(propName)) return;

    kept.push(part);
  });

  if (kept.length === 0) return null;
  return `${kept.join('; ')};`;
}

/**
 * Builds the inline CSS border declaration for a table cell given a TableBorderConfig
 */
export function buildCellBorderCss(
  config: TableBorderConfig,
  cellPos?: {
    rowIdx: number;
    totalRows: number;
    colIdx: number;
    totalCols: number;
  }
): string {
  if (config.sides === 'none' || config.style === 'none' || config.width === '0px') {
    return 'border: none;';
  }

  const lineStyle = config.style;
  const activeBorder = `${config.width} ${lineStyle} ${config.color}`;

  switch (config.sides) {
    case 'all':
      return `border: ${activeBorder};`;

    case 'horizontal':
      return `border-top: ${activeBorder}; border-bottom: ${activeBorder}; border-left: none; border-right: none;`;

    case 'vertical':
      return `border-left: ${activeBorder}; border-right: ${activeBorder}; border-top: none; border-bottom: none;`;

    case 'bottom':
      return `border-top: none; border-right: none; border-bottom: ${activeBorder}; border-left: none;`;

    case 'top':
      return `border-top: ${activeBorder}; border-right: none; border-bottom: none; border-left: none;`;

    case 'left':
      return `border-top: none; border-right: none; border-bottom: none; border-left: ${activeBorder};`;

    case 'right':
      return `border-top: none; border-right: ${activeBorder}; border-bottom: none; border-left: none;`;

    case 'outer': {
      if (!cellPos) {
        return `border: ${activeBorder};`;
      }
      const top = cellPos.rowIdx === 0 ? activeBorder : 'none';
      const bottom = cellPos.rowIdx === cellPos.totalRows - 1 ? activeBorder : 'none';
      const left = cellPos.colIdx === 0 ? activeBorder : 'none';
      const right = cellPos.colIdx === cellPos.totalCols - 1 ? activeBorder : 'none';
      return `border-top: ${top}; border-right: ${right}; border-bottom: ${bottom}; border-left: ${left};`;
    }

    case 'inner': {
      if (!cellPos) {
        return `border: ${activeBorder};`;
      }
      const top = cellPos.rowIdx > 0 ? activeBorder : 'none';
      const bottom = cellPos.rowIdx < cellPos.totalRows - 1 ? activeBorder : 'none';
      const left = cellPos.colIdx > 0 ? activeBorder : 'none';
      const right = cellPos.colIdx < cellPos.totalCols - 1 ? activeBorder : 'none';
      return `border-top: ${top}; border-right: ${right}; border-bottom: ${bottom}; border-left: ${left};`;
    }

    default:
      return `border: ${activeBorder};`;
  }
}

/**
 * Inspects the currently focused cell in the editor and parses its active TableBorderConfig
 */
export function detectCurrentTableBorderConfig(editor: Editor | null): TableBorderConfig {
  const defaultConfig: TableBorderConfig = {
    width: '1px',
    style: 'solid',
    color: '#cbd5e1',
    sides: 'all',
    scope: 'table',
  };

  if (!editor || !editor.isActive('table')) {
    return defaultConfig;
  }

  const cellAttrs = editor.isActive('tableHeader')
    ? editor.getAttributes('tableHeader')
    : editor.getAttributes('tableCell');

  const rawBorderCss: string | null =
    cellAttrs?.borderCss || extractBorderCssFromStyle(cellAttrs?.style);

  if (!rawBorderCss) {
    return defaultConfig;
  }

  const normalized = rawBorderCss.toLowerCase().trim();
  if (normalized === 'border: none;' || normalized === 'border: none' || normalized === 'border: 0px;' || normalized === 'border: 0;') {
    return {
      width: '0px',
      style: 'none',
      color: '#cbd5e1',
      sides: 'none',
      scope: 'table',
    };
  }

  // Extract width (e.g., 0.5px, 1px, 1.5px, 2px, 3px, 4px, 6px)
  const widthMatch = rawBorderCss.match(/(\d+(?:\.\d+)?px)/i);
  const width = widthMatch ? widthMatch[1].toLowerCase() : '1px';

  // Extract line style
  let style: BorderLineStyle = 'solid';
  if (/\bdashed\b/i.test(rawBorderCss)) style = 'dashed';
  else if (/\bdotted\b/i.test(rawBorderCss)) style = 'dotted';
  else if (/\bdouble\b/i.test(rawBorderCss)) style = 'double';

  // Extract color (#hex or rgb)
  const hexMatch = rawBorderCss.match(/(#[0-9a-fA-F]{3,8})/);
  const rgbMatch = rawBorderCss.match(/(rgba?\([^)]+\))/i);
  const color = hexMatch ? hexMatch[1] : rgbMatch ? rgbMatch[1] : '#cbd5e1';

  // Detect sides preset
  let sides: BorderSidesPreset = 'all';
  const hasTopNone = /border-top:\s*none/i.test(rawBorderCss);
  const hasBottomNone = /border-bottom:\s*none/i.test(rawBorderCss);
  const hasLeftNone = /border-left:\s*none/i.test(rawBorderCss);
  const hasRightNone = /border-right:\s*none/i.test(rawBorderCss);

  if (!hasTopNone && !hasBottomNone && hasLeftNone && hasRightNone) {
    sides = 'horizontal';
  } else if (hasTopNone && hasBottomNone && !hasLeftNone && !hasRightNone) {
    sides = 'vertical';
  } else if (hasTopNone && !hasBottomNone && hasLeftNone && hasRightNone) {
    sides = 'bottom';
  } else if (!hasTopNone && hasBottomNone && hasLeftNone && hasRightNone) {
    sides = 'top';
  } else if (hasTopNone && hasBottomNone && !hasLeftNone && hasRightNone) {
    sides = 'left';
  } else if (hasTopNone && hasBottomNone && hasLeftNone && !hasRightNone) {
    sides = 'right';
  }

  return {
    width,
    style,
    color,
    sides,
    scope: 'table',
  };
}

/**
 * Applies a TableBorderConfig to either the entire active table or only the selected cell(s)
 */
export function applyTableBorderConfig(editor: Editor, config: TableBorderConfig): void {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Find enclosing table node
  let tableDepth = -1;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tableDepth = d;
      break;
    }
  }

  if (tableDepth === -1) return;

  const tableNode = $from.node(tableDepth);
  const tablePos = $from.before(tableDepth);

  if (config.scope === 'cells') {
    // Clean any conflicting outer border on the table node first
    const cleanedTableStyle = stripManagedStyleProps(tableNode.attrs.style, false, true);
    const tr = state.tr.setNodeMarkup(tablePos, undefined, {
      ...tableNode.attrs,
      style: cleanedTableStyle,
    });
    editor.view.dispatch(tr);

    // Then apply borderCss to the selected cell(s) via Tiptap's setCellAttribute
    const cellBorderCss = buildCellBorderCss(config);
    editor.chain().focus().setCellAttribute('borderCss', cellBorderCss).run();
    return;
  }

  // Apply to Entire Table
  const tr = state.tr;
  const cleanedTableStyle = stripManagedStyleProps(tableNode.attrs.style, false, true);
  tr.setNodeMarkup(tablePos, undefined, {
    ...tableNode.attrs,
    style: cleanedTableStyle,
  });

  const totalRows = tableNode.childCount;
  let currentOffset = 0;

  for (let rIdx = 0; rIdx < totalRows; rIdx++) {
    const rowNode = tableNode.child(rIdx);
    const totalCols = rowNode.childCount;
    let cellOffsetInRow = 0;

    for (let cIdx = 0; cIdx < totalCols; cIdx++) {
      const cellNode = rowNode.child(cIdx);
      const cellPos = tablePos + 1 + currentOffset + 1 + cellOffsetInRow;

      const cellBorderCss = buildCellBorderCss(config, {
        rowIdx: rIdx,
        totalRows,
        colIdx: cIdx,
        totalCols,
      });

      const cleanedCellStyle = stripManagedStyleProps(cellNode.attrs.style, false, true);

      tr.setNodeMarkup(cellPos, undefined, {
        ...cellNode.attrs,
        style: cleanedCellStyle,
        borderCss: cellBorderCss,
      });

      cellOffsetInRow += cellNode.nodeSize;
    }

    currentOffset += rowNode.nodeSize;
  }

  editor.view.dispatch(tr);
}

/**
 * Applies a full table preset (shading + borders) to the currently active table
 */
export function applyTablePresetToActiveTable(
  editor: Editor,
  preset: TablePreset,
  customBorderConfig?: TableBorderConfig
): void {
  const { state } = editor;
  const { $from } = state.selection;

  let tableDepth = -1;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tableDepth = d;
      break;
    }
  }

  if (tableDepth === -1) return;

  const tableNode = $from.node(tableDepth);
  const tablePos = $from.before(tableDepth);
  const tr = state.tr;

  const cleanedTableStyle = stripManagedStyleProps(tableNode.attrs.style, false, true);
  tr.setNodeMarkup(tablePos, undefined, {
    ...tableNode.attrs,
    style: cleanedTableStyle,
  });

  const totalRows = tableNode.childCount;
  let currentOffset = 0;

  for (let rIdx = 0; rIdx < totalRows; rIdx++) {
    const rowNode = tableNode.child(rIdx);
    const totalCols = rowNode.childCount;
    let cellOffsetInRow = 0;

    for (let cIdx = 0; cIdx < totalCols; cIdx++) {
      const cellNode = rowNode.child(cIdx);
      const isHeader = cellNode.type.name === 'tableHeader' || (rIdx === 0 && tableNode.firstChild?.firstChild?.type.name === 'tableHeader');
      const cellPos = tablePos + 1 + currentOffset + 1 + cellOffsetInRow;

      let bg: string | null = cellNode.attrs.backgroundColor || null;
      if (preset === 'standard') {
        bg = isHeader ? '#f1f5f9' : '#ffffff';
      } else if (preset === 'accent-header') {
        bg = isHeader ? '#fdf2f8' : '#ffffff';
      } else if (preset === 'striped') {
        bg = isHeader ? '#f1f5f9' : rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
      } else if (preset === 'minimal') {
        bg = isHeader ? '#f8fafc' : '#ffffff';
      } else if (preset === 'borderless') {
        bg = isHeader ? '#f8fafc' : null;
      } else if (preset === 'thick-accent') {
        bg = isHeader ? '#fce7f3' : '#ffffff';
      }

      const borderCfg: TableBorderConfig = customBorderConfig || {
        width:
          preset === 'borderless'
            ? '0px'
            : preset === 'thick-accent'
            ? '2px'
            : '1px',
        style: preset === 'borderless' ? 'none' : 'solid',
        color:
          preset === 'accent-header' || preset === 'thick-accent'
            ? '#e20074'
            : preset === 'minimal'
            ? '#e2e8f0'
            : '#cbd5e1',
        sides:
          preset === 'borderless'
            ? 'none'
            : preset === 'minimal'
            ? 'horizontal'
            : 'all',
        scope: 'table',
      };

      const cellBorderCss = buildCellBorderCss(borderCfg, {
        rowIdx: rIdx,
        totalRows,
        colIdx: cIdx,
        totalCols,
      });

      const cleanedCellStyle = stripManagedStyleProps(cellNode.attrs.style, true, true);

      tr.setNodeMarkup(cellPos, undefined, {
        ...cellNode.attrs,
        style: cleanedCellStyle,
        backgroundColor: bg,
        borderCss: cellBorderCss,
      });

      cellOffsetInRow += cellNode.nodeSize;
    }

    currentOffset += rowNode.nodeSize;
  }

  editor.view.dispatch(tr);
}

/**
 * Steps the border width thinner (-1) or thicker (+1) based on BORDER_WIDTH_OPTIONS
 */
export function stepBorderWidth(currentWidth: string, direction: 'thinner' | 'thicker'): string {
  const idx = BORDER_WIDTH_OPTIONS.findIndex((o) => o.value === currentWidth);
  if (idx === -1) {
    return direction === 'thinner' ? '0.5px' : '2px';
  }
  const nextIdx =
    direction === 'thinner'
      ? Math.max(0, idx - 1)
      : Math.min(BORDER_WIDTH_OPTIONS.length - 1, idx + 1);
  return BORDER_WIDTH_OPTIONS[nextIdx].value;
}

/**
 * Ensures any newly added cells (with null borderCss) in the active table inherit the active borderCss
 */
export function syncNewTableCellsBorder(editor: Editor, referenceBorderCss: string | null): void {
  if (!referenceBorderCss) return;
  const { state } = editor;
  const { $from } = state.selection;

  let tableDepth = -1;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tableDepth = d;
      break;
    }
  }
  if (tableDepth === -1) return;

  const tableNode = $from.node(tableDepth);
  const tablePos = $from.before(tableDepth);
  const tr = state.tr;
  let modified = false;

  tableNode.descendants((child, offset) => {
    if (
      (child.type.name === 'tableCell' || child.type.name === 'tableHeader') &&
      !child.attrs.borderCss
    ) {
      const cellPos = tablePos + 1 + offset;
      tr.setNodeMarkup(cellPos, undefined, {
        ...child.attrs,
        borderCss: referenceBorderCss,
      });
      modified = true;
    }
  });

  if (modified) {
    editor.view.dispatch(tr);
  }
}
