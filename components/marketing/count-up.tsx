'use client';

import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';

type Props = {
  from: number;
  to: number;
  locale: Locale;
  fractionDigits?: number;
  /** Appended as-is, e.g. " °C". */
  suffix?: string;
  durationMs?: number;
  className?: string;
};

/**
 * A number that counts from `from` to `to` the first time it scrolls into view. Server HTML holds
 * the final value (no layout shift, nothing hidden); the count runs once, only without
 * prefers-reduced-motion, and formats every frame through lib/i18n/format (rule 3).
 */
export function CountUp({
  from,
  to,
  locale,
  fractionDigits = 0,
  suffix = '',
  durationMs = 1400,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - (1 - progress) ** 3;
          setValue(from + (to - from) * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [from, to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(value, locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}
      {suffix}
    </span>
  );
}
