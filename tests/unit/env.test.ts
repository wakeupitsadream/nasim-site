import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasCanonicalDomain, isProductionDeployment, siteUrl } from '@/lib/env';

const clear = () => {
  for (const key of [
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL_ENV',
    'VERCEL_PROJECT_PRODUCTION_URL',
    'VERCEL_BRANCH_URL',
    'VERCEL_URL',
  ]) {
    vi.stubEnv(key, '');
  }
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    clear();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://nasim.ae');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'nasim-site.vercel.app');
    expect(siteUrl().href).toBe('https://nasim.ae/');
    expect(hasCanonicalDomain()).toBe(true);
  });

  it('uses the production URL on production', () => {
    clear();
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'nasim-site.vercel.app');
    vi.stubEnv('VERCEL_URL', 'nasim-site-abc123.vercel.app');
    expect(siteUrl().href).toBe('https://nasim-site.vercel.app/');
    expect(hasCanonicalDomain()).toBe(false);
  });

  it('prefers the branch URL on previews, then the deployment URL', () => {
    clear();
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_BRANCH_URL', 'nasim-site-git-phase-1.vercel.app');
    vi.stubEnv('VERCEL_URL', 'nasim-site-abc123.vercel.app');
    expect(siteUrl().href).toBe('https://nasim-site-git-phase-1.vercel.app/');
    vi.stubEnv('VERCEL_BRANCH_URL', '');
    expect(siteUrl().href).toBe('https://nasim-site-abc123.vercel.app/');
  });

  it('falls back to localhost', () => {
    clear();
    expect(siteUrl().href).toBe('http://localhost:3000/');
  });
});

describe('isProductionDeployment', () => {
  it('follows VERCEL_ENV', () => {
    clear();
    expect(isProductionDeployment()).toBe(false);
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(isProductionDeployment()).toBe(false);
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(isProductionDeployment()).toBe(true);
  });
});
