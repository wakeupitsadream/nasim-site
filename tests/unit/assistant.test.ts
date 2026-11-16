import { describe, expect, it } from 'vitest';
import {
  handoffContext,
  HANDOFF_QUOTE_MAX,
  MAX_MODEL_TURNS,
  NUDGE_AFTER_TURNS,
  quoteForHandoff,
} from '@/lib/assistant/handoff';
import { matchFaq, tokens, type FaqEntry } from '@/lib/assistant/match';
import { callTarget, whatsappTarget } from '@/lib/cta';

const faq = (id: string, question: string): FaqEntry => ({
  id,
  question,
  answerHtml: `<p>${id}</p>`,
  lang: 'en',
});

const FAQS = [
  faq('often', 'How often should I clean my AC in Dubai?'),
  faq('fixed', 'Is the price really fixed?'),
  faq('home', 'Do I need to be at home?'),
  faq('report', 'What is in the WhatsApp report?'),
  faq('ru', 'Как часто чистить кондиционер в Дубае?'),
];

describe('tokens', () => {
  it('stems, lower-cases and drops stop words in three scripts', () => {
    expect(tokens('How often should I clean my AC in Dubai?')).toEqual([
      'ofte',
      'clea',
      'ac',
      'duba',
    ]);
    expect(tokens('Как часто чистить кондиционер в Дубае?')).toEqual([
      'част',
      'чист',
      'конд',
      'дуба',
    ]);
    expect(tokens('هل السعر ثابت فعلاً؟')).toEqual(['السع', 'ثابت', 'فعلا']);
    expect(tokens('?!')).toEqual([]);
  });
});

describe('matchFaq', () => {
  it('answers a question that covers most of a FAQ', () => {
    expect(matchFaq('how often do I clean the AC?', FAQS)?.id).toBe('often');
    expect(matchFaq('Is the price fixed', FAQS)?.id).toBe('fixed');
    expect(matchFaq('как часто чистить кондиционер', FAQS)?.id).toBe('ru');
  });

  it('sends everything else to the AI', () => {
    expect(matchFaq('Water dripping from the indoor unit', FAQS)).toBeNull();
    expect(matchFaq('Musty smell when the AC starts', FAQS)).toBeNull();
    expect(matchFaq('AC', FAQS)).toBeNull(); // one stem is never enough
    expect(matchFaq('', FAQS)).toBeNull();
  });

  it('prefers the FAQ covered best', () => {
    const list = [
      faq('a', 'Do you clean the outdoor unit?'),
      faq('b', 'Do you clean the outdoor unit and the filters?'),
    ];
    expect(matchFaq('do you clean the outdoor unit and the filters', list)?.id).toBe('b');
  });
});

describe('hand-over to a person', () => {
  it('offers a technician before the conversation runs out', () => {
    expect(NUDGE_AFTER_TURNS).toBeLessThan(MAX_MODEL_TURNS);
  });

  it('quotes the question on one line and cuts a long one at a word', () => {
    expect(quoteForHandoff('  Water drips\n from the unit  ')).toBe('Water drips from the unit');
    const long = quoteForHandoff('word '.repeat(200));
    expect(long.length).toBeLessThanOrEqual(HANDOFF_QUOTE_MAX + 1);
    expect(long.endsWith('word…')).toBe(true);
  });

  it('passes on the last question with the service suggested for it, not for an earlier one', () => {
    const turns = [
      { role: 'user', text: 'Musty smell' },
      { role: 'assistant', service: 'Standard Split AC Service' },
      { role: 'user', text: 'And it drips' },
      { role: 'assistant', service: null },
      { role: 'user', text: '' }, // a photo without words keeps the earlier question
      { role: 'assistant' },
    ] as const;
    expect(handoffContext([...turns], 1)).toEqual({
      question: 'Musty smell',
      service: 'Standard Split AC Service',
    });
    expect(handoffContext([...turns], 3)).toEqual({ question: 'And it drips', service: null });
    expect(handoffContext([...turns], 5)).toEqual({ question: 'And it drips', service: null });
    expect(handoffContext([], 0)).toEqual({ question: '', service: null });
  });

  it('builds a WhatsApp link with the message and a plain phone call, or falls back to /contact', () => {
    const contacts = { whatsapp: '+971 50 123 4567', phone: '+971 4 123 4567' };
    expect(whatsappTarget(contacts, 'Hi! “Drips”')).toEqual({
      kind: 'external',
      href: `https://wa.me/971501234567?text=${encodeURIComponent('Hi! “Drips”')}`,
      newTab: true,
    });
    expect(callTarget(contacts)).toEqual({
      kind: 'external',
      href: 'tel:+97141234567',
      newTab: false,
    });
    expect(whatsappTarget({ whatsapp: '' }, 'Hi')).toEqual({ kind: 'internal', href: '/contact' });
    expect(callTarget({ phone: '' })).toEqual({ kind: 'internal', href: '/contact' });
  });
});
