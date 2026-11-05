import { createNavigation } from 'next-intl/navigation';
import { createElement, type ComponentProps } from 'react';
import { routing } from './routing';

// Locale-aware wrappers around Next.js navigation APIs.
const nav = createNavigation(routing);
export const { redirect, usePathname, useRouter, getPathname } = nav;

type LinkProps = ComponentProps<typeof nav.Link>;

/**
 * next-intl's Link with a default view-transition type. Every link navigation is tagged —
 * `nav-page`, or the caller's `nav-forward` / `nav-back` — so the red page curtain in
 * styles/motion.css runs on link navigations only, never on in-page transitions (wizard steps,
 * the diagnosis card). Plain function: `ref` is an ordinary prop in React 19.
 */
export function Link({ transitionTypes = ['nav-page'], ...props }: LinkProps) {
  return createElement(nav.Link, { ...props, transitionTypes });
}
