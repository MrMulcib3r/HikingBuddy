import type { DragEvent } from 'react';

/**
 * What is being dragged. Each kind travels under its own data type, so a drop target only
 * reacts to its own kind — e.g. a gear item dragged from Gear Vault over a gearlist row
 * isn't mistaken for a gearlist row being reordered, and dragging a Vault item doesn't
 * also drag the category group it sits in.
 */
export type DragKind = 'gear' | 'category' | 'list-category' | 'list-item' | 'gearlist';

export function dragMime(kind: DragKind): string {
  return `application/x-hikingbuddy-${kind}`;
}

/** True while the drag in progress carries the given kind (usable in dragover, where the
 * data itself can't be read yet — only its types). */
export function isDragging(e: DragEvent, kind: DragKind): boolean {
  return Array.from(e.dataTransfer.types).includes(dragMime(kind));
}

/** Minimal native HTML5 drag & drop wiring — no extra dependency needed for the simple
 * "drag this row onto that row to reorder" interaction used for gearlists, categories,
 * and items within a list. `onReorder` receives (draggedId, droppedOnId). A gear item
 * ('gear') can additionally be dropped onto a gearlist to add it there (GearListDetail). */
export function makeDragHandlers(id: string, onReorder: (sourceId: string, targetId: string, after?: boolean) => void, kind: DragKind) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.stopPropagation(); // don't let a parent (e.g. the category group) start its own drag
      e.dataTransfer.setData(dragMime(kind), id);
      e.dataTransfer.effectAllowed = kind === 'gear' ? 'copyMove' : 'move';
    },
    onDragOver: (e: DragEvent) => {
      if (!isDragging(e, kind)) return; // not ours — let a parent drop target handle it
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: DragEvent) => {
      if (!isDragging(e, kind)) return;
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData(dragMime(kind));
      // Category groups sit in a "slot" (card + gap below). Dropped in the gap below a card →
      // after that group; anywhere else the dragged item takes the target's place.
      let after: boolean | undefined;
      if (kind === 'category' || kind === 'list-category') {
        const card = (e.currentTarget as HTMLElement).firstElementChild;
        if (card && e.clientY > card.getBoundingClientRect().bottom) after = true;
      }
      if (sourceId && sourceId !== id) onReorder(sourceId, id, after);
    },
  };
}
