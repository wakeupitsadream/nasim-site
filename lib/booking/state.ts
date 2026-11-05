// Booking-request wizard state: a pure reducer, so it is unit-tested without React and the
// client component stays thin. The clock enters only through `next` (read in an event handler).
import type { Selection } from '@/lib/pricing';
import type { DubaiClock, WindowKey } from '@/lib/booking/time';

export type Category = 'ac' | 'upholstery';
export type Step = 'category' | 'details' | 'time' | 'send';
export const STEPS: readonly Step[] = ['category', 'details', 'time', 'send'];

export type BookingState = {
  step: Step;
  category: Category | null;
  /** Selected AC service slug (AC is one service at a time; upholstery mixes lines). */
  acService: string | null;
  selection: Selection;
  clock: DubaiClock | null;
  day: string | null;
  window: WindowKey | null;
  area: string | null;
  error: 'emptySelection' | null;
};

export type ServiceChoice = { slug: string; defaults: Selection };

export type BookingAction =
  | { type: 'chooseCategory'; category: Category; service?: ServiceChoice }
  | { type: 'chooseAcService'; service: ServiceChoice }
  | { type: 'setQty'; lineId: string; qty: number }
  | { type: 'addLines'; add: Selection }
  | { type: 'next'; clock?: DubaiClock; defaultDay?: string | null }
  | { type: 'back' }
  | { type: 'goTo'; step: Step }
  | { type: 'chooseDay'; day: string }
  | { type: 'chooseWindow'; window: WindowKey }
  | { type: 'chooseArea'; area: string | null }
  | { type: 'reset'; initial: BookingState };

export type InitialBooking = { category: Category; service?: ServiceChoice };

/** Default quantities when a service is chosen: its minimum charge per line (1 for estimates). */
export function defaultSelection(
  lines: { id: string; unit: string; minQty: number }[],
  lineIds: string[],
): Selection {
  const defaults: Selection = {};
  for (const id of lineIds) {
    const line = lines.find((l) => l.id === id);
    if (line) defaults[id] = line.unit === 'from' ? 1 : line.minQty;
  }
  return defaults;
}

export function initialState(init?: InitialBooking): BookingState {
  const base: BookingState = {
    step: 'category',
    category: null,
    acService: null,
    selection: {},
    clock: null,
    day: null,
    window: null,
    area: null,
    error: null,
  };
  if (!init) return base;
  return {
    ...base,
    step: 'details',
    category: init.category,
    acService: init.service?.slug ?? null,
    selection: init.service ? { ...init.service.defaults } : {},
  };
}

export const hasSelection = (selection: Selection): boolean =>
  Object.values(selection).some((qty) => qty > 0);

export function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'chooseCategory': {
      const same = state.category === action.category;
      return {
        ...state,
        step: 'details',
        category: action.category,
        acService: same ? state.acService : (action.service?.slug ?? null),
        selection: same ? state.selection : action.service ? { ...action.service.defaults } : {},
        error: null,
      };
    }
    case 'chooseAcService':
      return {
        ...state,
        acService: action.service.slug,
        selection: { ...action.service.defaults },
        error: null,
      };
    case 'setQty': {
      const selection = { ...state.selection };
      if (action.qty > 0) selection[action.lineId] = action.qty;
      else delete selection[action.lineId];
      return { ...state, selection, error: null };
    }
    case 'addLines': {
      const selection = { ...state.selection };
      for (const [id, qty] of Object.entries(action.add))
        selection[id] = (selection[id] ?? 0) + qty;
      return { ...state, selection, error: null };
    }
    case 'next': {
      if (state.step === 'category') return state.category ? { ...state, step: 'details' } : state;
      if (state.step === 'details') {
        if (!hasSelection(state.selection)) return { ...state, error: 'emptySelection' };
        const clock = action.clock ?? state.clock;
        const day = action.defaultDay === undefined ? state.day : action.defaultDay;
        return { ...state, step: 'time', clock, day, window: state.window ?? 'any', error: null };
      }
      if (state.step === 'time') return { ...state, step: 'send' };
      return state;
    }
    case 'back': {
      const index = STEPS.indexOf(state.step);
      return index > 0 ? { ...state, step: STEPS[index - 1]!, error: null } : state;
    }
    case 'goTo':
      return { ...state, step: action.step, error: null };
    case 'chooseDay':
      return { ...state, day: action.day, window: 'any' };
    case 'chooseWindow':
      return { ...state, window: action.window };
    case 'chooseArea':
      return { ...state, area: action.area };
    case 'reset':
      return action.initial;
  }
}
