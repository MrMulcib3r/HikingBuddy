import type { DragEvent } from 'react';

/** Minimal native HTML5 drag & drop wiring — no extra dependency needed for the simple
 * "drag this row onto that row to reorder" interaction used for gearlists, categories,
 * and items within a list. `onReorder` receives (draggedId, droppedOnId). */
export function makeDragHandlers(id: string, onReorder: (sourceId: string, targetId: string) => void) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== id) onReorder(sourceId, id);
    },
  };
}
