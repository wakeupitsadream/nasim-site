import { describe, expect, it } from 'vitest';
import { hasSelection, initialState, reducer, type BookingState } from '@/lib/booking/state';

const acClean = { slug: 'ac-cleaning', defaults: { ac_clean: 1 } };
const acDeep = { slug: 'ac-deep-cleaning', defaults: { ac_deep: 1 } };
const clock = { date: '2026-11-05', minutes: 570, weekday: 4 };

const run = (state: BookingState, ...actions: Parameters<typeof reducer>[1][]) =>
  actions.reduce(reducer, state);

describe('initialState', () => {
  it('starts at the category step with nothing chosen', () => {
    expect(initialState()).toMatchObject({ step: 'category', category: null, selection: {} });
  });

  it('starts at details when a service page preselects one', () => {
    expect(initialState({ category: 'ac', service: acDeep })).toMatchObject({
      step: 'details',
      category: 'ac',
      acService: 'ac-deep-cleaning',
      selection: { ac_deep: 1 },
    });
  });
});

describe('reducer', () => {
  it('chooses a category with its default service and keeps the selection on re-entry', () => {
    const s1 = run(initialState(), { type: 'chooseCategory', category: 'ac', service: acClean });
    expect(s1).toMatchObject({
      step: 'details',
      acService: 'ac-cleaning',
      selection: { ac_clean: 1 },
    });
    const s2 = run(
      s1,
      { type: 'setQty', lineId: 'ac_clean', qty: 3 },
      { type: 'back' },
      {
        type: 'chooseCategory',
        category: 'ac',
        service: acClean,
      },
    );
    expect(s2.selection).toEqual({ ac_clean: 3 });
    const s3 = run(s2, { type: 'chooseCategory', category: 'upholstery' });
    expect(s3).toMatchObject({ category: 'upholstery', acService: null, selection: {} });
  });

  it('replaces the AC lines when another AC service is chosen', () => {
    const s = run(
      initialState({ category: 'ac', service: acClean }),
      { type: 'setQty', lineId: 'ac_clean', qty: 4 },
      { type: 'chooseAcService', service: acDeep },
    );
    expect(s.selection).toEqual({ ac_deep: 1 });
  });

  it('removes a line at zero and merges added lines', () => {
    const s = run(
      initialState({ category: 'upholstery' }),
      { type: 'setQty', lineId: 'sofa_seat', qty: 3 },
      { type: 'setQty', lineId: 'armchair', qty: 1 },
      { type: 'setQty', lineId: 'armchair', qty: 0 },
      { type: 'addLines', add: { ac_clean: 3 } },
    );
    expect(s.selection).toEqual({ sofa_seat: 3, ac_clean: 3 });
  });

  it('refuses to leave details with an empty selection', () => {
    const s = run(initialState({ category: 'upholstery' }), { type: 'next', clock });
    expect(s).toMatchObject({ step: 'details', error: 'emptySelection' });
    expect(hasSelection(s.selection)).toBe(false);
    expect(run(s, { type: 'setQty', lineId: 'sofa_seat', qty: 3 }).error).toBeNull();
  });

  it('moves to time with the clock and a default day, then to send', () => {
    const s = run(initialState({ category: 'ac', service: acClean }), {
      type: 'next',
      clock,
      defaultDay: '2026-11-05',
    });
    expect(s).toMatchObject({ step: 'time', clock, day: '2026-11-05', window: 'any' });
    const t = run(
      s,
      { type: 'chooseDay', day: '2026-11-06' },
      { type: 'chooseWindow', window: 'afternoon' },
    );
    expect(t).toMatchObject({ day: '2026-11-06', window: 'afternoon' });
    expect(run(t, { type: 'next' }).step).toBe('send');
  });

  it('resets the window when the day changes', () => {
    const s = run(
      initialState({ category: 'ac', service: acClean }),
      { type: 'next', clock, defaultDay: '2026-11-05' },
      { type: 'chooseWindow', window: 'evening' },
      { type: 'chooseDay', day: '2026-11-07' },
    );
    expect(s.window).toBe('any');
  });

  it('goes back, jumps to a step and resets', () => {
    const start = initialState({ category: 'ac', service: acClean });
    const s = run(start, { type: 'next', clock, defaultDay: '2026-11-05' }, { type: 'next' });
    expect(s.step).toBe('send');
    expect(run(s, { type: 'back' }).step).toBe('time');
    expect(run(s, { type: 'goTo', step: 'details' }).step).toBe('details');
    expect(run(initialState(), { type: 'back' }).step).toBe('category');
    expect(run(s, { type: 'reset', initial: start })).toEqual(start);
  });
});
