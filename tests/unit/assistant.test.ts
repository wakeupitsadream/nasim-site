import { describe, expect, it } from 'vitest';
import { matchFaq, tokens, type FaqEntry } from '@/lib/assistant/match';

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
