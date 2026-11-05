'use client';

import { useEffect, useRef } from 'react';
import { Van } from '@/components/marketing/van';
import { cn } from '@/lib/utils';

/**
 * The van on its scroll-driven view timeline (`.van-drive`, styles/motion.css). Browsers without
 * scroll-driven animations (Safari before 26, Firefox) would show it parked: there an
 * IntersectionObserver marks the moment it scrolls into view and a time-based copy of the same
 * keyframes plays once (`[data-driven]`, DECISIONS №56). Reduced motion stays static in both.
 */
export function VanDrive({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const van = ref.current;
    if (!van || CSS.supports('animation-timeline', 'view()')) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        van.setAttribute('data-driven', '');
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(van);
    return () => observer.disconnect();
  }, []);

  return <Van ref={ref} className={cn('van-drive w-full', className)} />;
}
