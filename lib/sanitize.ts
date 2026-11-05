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
