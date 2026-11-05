import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

// The default merge config treats unknown text-* values as colours and drops our size tokens.
describe('cn with design tokens', () => {
  it('keeps a size token next to a colour', () => {
    expect(cn('h-tap gap-2 px-5 text-body', 'bg-primary text-primary-foreground')).toBe(
      'h-tap gap-2 px-5 text-body bg-primary text-primary-foreground',
    );
  });

  it('lets a later size token win', () => {
    expect(cn('text-sm', 'text-body')).toBe('text-body');
    expect(cn('text-body text-primary', 'text-h1')).toBe('text-primary text-h1');
  });

  it('resolves spacing, container and shadow tokens', () => {
    expect(cn('h-8', 'h-tap')).toBe('h-tap');
    expect(cn('px-3', 'px-gutter')).toBe('px-gutter');
    expect(cn('max-w-sm', 'max-w-page')).toBe('max-w-page');
    expect(cn('shadow-sm', 'shadow-card')).toBe('shadow-card');
  });

  it('resolves the phase 3a tokens', () => {
    expect(cn('py-16', 'py-section')).toBe('py-section');
    expect(cn('mb-8', 'mb-stack')).toBe('mb-stack');
    expect(cn('text-h1', 'text-display')).toBe('text-display');
    expect(cn('text-small text-muted-foreground', 'text-eyebrow')).toBe(
      'text-muted-foreground text-eyebrow',
    );
    expect(cn('shadow-card', 'shadow-lift')).toBe('shadow-lift');
    expect(cn('rounded-xl', 'rounded-card')).toBe('rounded-card');
    expect(cn('rounded-card', 'rounded-panel')).toBe('rounded-panel');
    expect(cn('ease-out', 'ease-brand')).toBe('ease-brand');
  });
});
