// Site navigation. Labels come from messages `Nav.{key}`; hrefs are locale-less pathnames
// for the next-intl Link (lib/i18n/navigation). No active-state highlighting in phase 1.
export const MAIN_NAV = [
  { key: 'services', href: '/services' },
  { key: 'pricing', href: '/pricing' },
  { key: 'annualContracts', href: '/annual-contracts' },
  { key: 'areas', href: '/areas' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
] as const;

export const LEGAL_NAV = [
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
] as const;

export type NavItem = (typeof MAIN_NAV)[number] | (typeof LEGAL_NAV)[number];
