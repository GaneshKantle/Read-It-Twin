import { useEffect, type RefObject } from 'react';

/**
 * Mouse drag for a horizontally scrolling track. Touch already has native
 * momentum, so this only wires up fine pointers, and it swallows the click that
 * follows a real drag so cards do not fire on release.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = element.scrollLeft;
      dragged = false;
      element.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      const delta = event.clientX - startX;

      if (Math.abs(delta) > 4) {
        dragged = true;
        element.setPointerCapture(pointerId);
      }

      if (dragged) {
        element.scrollLeft = startScroll - delta;
      }
    };

    const endDrag = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      if (element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }

      pointerId = null;
      element.style.cursor = '';
    };

    const onClick = (event: MouseEvent) => {
      if (dragged) {
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      }
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
    element.addEventListener('click', onClick, true);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', endDrag);
      element.removeEventListener('pointercancel', endDrag);
      element.removeEventListener('click', onClick, true);
    };
  }, [ref]);
}
