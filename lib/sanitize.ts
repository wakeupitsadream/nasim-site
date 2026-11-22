import sanitizeHtml from 'sanitize-html';

// Editor HTML (seed today, Tiptap in the admin later) always passes through here before render
// (CLAUDE.md rule 9). Server-only: the package never reaches the client bundle.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'ul',
    'ol',
    'li',
    'a',
    'h2',
    'h3',
    'blockquote',
  ],
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) =>
      attribs.target === '_blank'
        ? { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }
        : { tagName, attribs },
  },
};

export function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** One line of text with emphasis only (a list item with a bold lead-in): no blocks, no links. */
export function sanitizeInlineHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: ['strong', 'b', 'em', 'i'], allowedAttributes: {} });
}

/** The text of editor HTML, for places that take no markup (the assistant's catalogue). */
export function plainText(html: string): string {
  return sanitizeHtml(html.replace(/<\/(p|li|h2|h3)>/g, ' '), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
