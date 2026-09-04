import { useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { useFinePointer } from '@/hooks/useFinePointer';

/** Soft settle — enough give to feel tactile, not enough to bounce. */
const settle = { type: 'spring', stiffness: 320, damping: 28, mass: 0.55 } as const;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/**
 * Pointer velocity has to be known the instant a card is entered, so it is
 * sampled window-wide and shared by every card on the page.
 */
const pointer = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
let listeners = 0;

function handleWindowPointerMove(event: globalThis.PointerEvent) {
  pointer.velocityX = event.clientX - pointer.x;
  pointer.velocityY = event.clientY - pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
}

function trackPointer() {
  if (listeners === 0) {
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
  }

  listeners += 1;

  return () => {
    listeners -= 1;

    if (listeners === 0) {
      window.removeEventListener('pointermove', handleWindowPointerMove);
    }
  };
}

/**
 * Nudges a card in the direction the pointer was travelling when it arrived,
 * then settles back. Keep strength/spin low on dense rows so cards don't dance.
 */
export function useMomentumHover({
  strength = 0.45,
  spin = 0.18,
  maxOffset = 8,
  maxSpin = 2.5,
} = {}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);

  const finePointer = useFinePointer();
  const prefersReducedMotion = useReducedMotion();
  const enabled = finePointer && !prefersReducedMotion;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return trackPointer();
  }, [enabled]);

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - (bounds.left + bounds.width / 2);
      const offsetY = event.clientY - (bounds.top + bounds.height / 2);
      const lever = Math.hypot(offsetX, offsetY) || 1;
      const torque = (offsetX * pointer.velocityY - offsetY * pointer.velocityX) / lever;

      x.set(clamp(pointer.velocityX * strength, maxOffset));
      y.set(clamp(pointer.velocityY * strength, maxOffset));
      rotate.set(clamp(torque * spin, maxSpin));

      animate(x, 0, settle);
      animate(y, 0, settle);
      animate(rotate, 0, settle);
    },
    [enabled, maxOffset, maxSpin, rotate, spin, strength, x, y],
  );

  return {
    style: enabled ? { x, y, rotate } : undefined,
    handlers: enabled ? { onPointerEnter } : {},
  };
}
