import { createCn } from 'cn/config';

/**
 * Class merging aware of our design tokens (styles/design-tokens.css). The default config treats
 * unknown `text-*` values as colours, so `cn('text-body', 'text-primary-foreground')` would drop
 * `text-body`. Every component, including shadcn ones in components/ui, imports `cn` from here.
 */
export const cn = createCn({
  extend: {
    theme: {
      spacing: ['tap', 'gutter', 'gutter-lg', 'sticky-bar', 'header'],
      container: ['page'],
    },
    classGroups: {
      'font-size': [{ text: ['small', 'body', 'lead', 'h1', 'h2', 'h3'] }],
      shadow: [{ shadow: ['card', 'float'] }],
    },
  },
});
