import { ViewTransition } from 'react';
import type { ReactNode } from 'react';

// Classes come from styles/motion.css. Links tag forward/back moves with `transitionTypes`;
// everything else (header nav, browser back) gets the short page fade.
const BY_TYPE = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'page-fade',
} as const;

/**
 * Page-level view transition (DECISIONS №49). Goes in `page.tsx`, never in a layout: layouts
 * persist across navigations, so their enter/exit would never fire. One plain <div> child, because
 * the browser snapshots a box (a fragment or `display: contents` has none).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
