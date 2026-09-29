import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'e' | 'w' | 's';

// Tracks the document position of an image node currently being dragged inside the editor
let activeDraggedImagePos: number | null = null;

export function setDraggedImageNodePos(pos: number | null): void {
  activeDraggedImagePos = pos;
}

export function getDraggedImageNodePos(): number | null {
  return activeDraggedImagePos;
}

export const ResizableImageNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [liveDimensions, setLiveDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const isEditable = editor.isEditable;
  const active = selected || isSelected || isResizing;

  const { src, alt, title, width, height } = node.attrs;

  // Close local selection when clicking outside
  useEffect(() => {
    if (!isSelected) return;
    const handleOutsideMouseDown = (e: MouseEvent) => {
      if (imgRef.current && !imgRef.current.parentElement?.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [isSelected]);

  const startResize = (e: React.MouseEvent, direction: ResizeDirection) => {
    if (!isEditable || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedImageNodePos(null);

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const aspectRatio = startHeight > 0 ? startWidth / startHeight : 1;

    setIsResizing(true);
    setLiveDimensions({
      width: Math.round(startWidth),
      height: Math.round(startHeight),
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === 'e') {
        newWidth = Math.max(40, startWidth + deltaX);
        newHeight = startHeight;
      } else if (direction === 'w') {
        newWidth = Math.max(40, startWidth - deltaX);
        newHeight = startHeight;
      } else if (direction === 's') {
        newWidth = startWidth;
        newHeight = Math.max(30, startHeight + deltaY);
      } else {
        // Corner handles: preserve aspect ratio unless Shift is held
        const signedDeltaX =
          direction === 'nw' || direction === 'sw' ? -deltaX : deltaX;
        newWidth = Math.max(40, startWidth + signedDeltaX);

        if (moveEvent.shiftKey) {
          const signedDeltaY =
            direction === 'nw' || direction === 'ne' ? -deltaY : deltaY;
          newHeight = Math.max(30, startHeight + signedDeltaY);
        } else {
          newHeight = Math.max(24, Math.round(newWidth / aspectRatio));
        }
      }

      setLiveDimensions({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;

      let finalWidth = startWidth;
      let finalHeight = startHeight;

      if (direction === 'e') {
        finalWidth = Math.max(40, startWidth + deltaX);
        finalHeight = startHeight;
      } else if (direction === 'w') {
        finalWidth = Math.max(40, startWidth - deltaX);
        finalHeight = startHeight;
      } else if (direction === 's') {
        finalWidth = startWidth;
        finalHeight = Math.max(30, startHeight + deltaY);
      } else {
        const signedDeltaX =
          direction === 'nw' || direction === 'sw' ? -deltaX : deltaX;
        finalWidth = Math.max(40, startWidth + signedDeltaX);

        if (upEvent.shiftKey) {
          const signedDeltaY =
            direction === 'nw' || direction === 'ne' ? -deltaY : deltaY;
          finalHeight = Math.max(30, startHeight + signedDeltaY);
        } else {
          finalHeight = Math.max(24, Math.round(finalWidth / aspectRatio));
        }
      }

      setIsResizing(false);
      setLiveDimensions(null);

      updateAttributes({
        width: `${Math.round(finalWidth)}px`,
        height: `${Math.round(finalHeight)}px`,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Record this image node's document position when the user starts dragging it
  const handleDragStartCapture = () => {
    if (!isEditable) return;
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (typeof pos === 'number') {
      setDraggedImageNodePos(pos);
      const cleanup = () => {
        setDraggedImageNodePos(null);
        document.removeEventListener('dragend', cleanup);
        document.removeEventListener('drop', cleanup);
      };
      document.addEventListener('dragend', cleanup, { once: true });
    }
  };

  // Compute current style for the img tag
  const displayWidth = liveDimensions
    ? `${liveDimensions.width}px`
    : width
    ? typeof width === 'number'
      ? `${width}px`
      : width
    : undefined;

  const displayHeight = liveDimensions
    ? `${liveDimensions.height}px`
    : height
    ? typeof height === 'number'
      ? `${height}px`
      : height
    : undefined;

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      data-drag-handle
      onDragStartCapture={handleDragStartCapture}
      onDragEnd={() => setDraggedImageNodePos(null)}
      className="inline-block relative align-bottom my-1 max-w-full group select-none"
      onClick={(e: React.MouseEvent) => {
        if (!isEditable) return;
        e.stopPropagation();
        setIsSelected(true);
      }}
    >
      {/* Image Element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        title={title || ''}
        draggable={isEditable}
        data-drag-handle
        style={{
          width: displayWidth,
          height: displayHeight || 'auto',
          maxWidth: '100%',
        }}
        className={`block rounded transition-shadow ${
          isEditable
            ? active
              ? 'ring-2 ring-magenta-600 shadow-md cursor-grab active:cursor-grabbing'
              : 'hover:ring-2 hover:ring-magenta-400/60 cursor-grab active:cursor-grabbing'
            : ''
        }`}
      />

      {/* Interactive Drag-to-Resize Handles */}
      {isEditable && active && (
        <>
          {/* Top-Left Corner (Proportional) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-magenta-600 rounded-full cursor-nwse-resize z-30 shadow-xs hover:scale-125 transition-transform"
          />

          {/* Top-Right Corner (Proportional) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-magenta-600 rounded-full cursor-nesw-resize z-30 shadow-xs hover:scale-125 transition-transform"
          />

          {/* Bottom-Left Corner (Proportional) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-magenta-600 rounded-full cursor-nesw-resize z-30 shadow-xs hover:scale-125 transition-transform"
          />

          {/* Bottom-Right Corner (Proportional) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-magenta-600 border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-md hover:scale-125 transition-transform"
          />

          {/* Right Edge Handle (Width only) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 'e')}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 bg-white border-2 border-magenta-600 rounded-full cursor-ew-resize z-30 shadow-xs hover:scale-110 transition-transform"
          />

          {/* Bottom Edge Handle (Height only) */}
          <span
            data-resize-handle
            contentEditable={false}
            onMouseDown={(e) => startResize(e, 's')}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border-2 border-magenta-600 rounded-full cursor-ns-resize z-30 shadow-xs hover:scale-110 transition-transform"
          />
        </>
      )}

      {/* Live Dimensions Readout while Resizing */}
      {isEditable && isResizing && liveDimensions && (
        <span
          contentEditable={false}
          className="absolute bottom-1.5 right-1.5 z-30 bg-slate-900/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
        >
          {liveDimensions.width} × {liveDimensions.height} px
        </span>
      )}
    </NodeViewWrapper>
  );
};
