'use client';

import { useEffect } from 'react';

const MAX_DEG = 5;
const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/**
 * Pointer tilt for `[data-tilt]` panels (DECISIONS №52): one delegated listener sets `--tx`/`--ty`
 * on the panel under the pointer; `.tilt` turns them into a small 3D rotation (styles/motion.css).
 * Mouse and trackpad only — touch and reduced-motion users never see it. Renders nothing.
 */
export function TiltLayer() {
  useEffect(() => {
    if (!window.matchMedia(QUERY).matches) return;
    let current: HTMLElement | null = null;
    let pending: PointerEvent | null = null;
    let frame = 0;

    const reset = () => {
      current?.style.removeProperty('--tx');
      current?.style.removeProperty('--ty');
      current = null;
    };
    const apply = () => {
      frame = 0;
      const event = pending;
      if (!event) return;
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-tilt]') : null;
      if (target !== current) {
        reset();
        current = target;
      }
      if (!current) return;
      const box = current.getBoundingClientRect();
      const dx = (event.clientX - box.x) / box.width - 0.5;
      const dy = (event.clientY - box.y) / box.height - 0.5;
      current.style.setProperty('--tx', `${(dx * 2 * MAX_DEG).toFixed(2)}deg`);
      current.style.setProperty('--ty', `${(-dy * 2 * MAX_DEG).toFixed(2)}deg`);
    };
    const onMove = (event: PointerEvent) => {
      pending = event;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pending = null;
      reset();
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      reset();
    };
  }, []);

  return null;
}
