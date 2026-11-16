// When the assistant stops answering and offers a person instead (DECISIONS №84). Pure and
// client-safe: the window counts its own model answers, the server keeps the real quotas
// (lib/diagnose/guard.ts) — these numbers only decide when the hand-over is offered.

/** After this many model answers in one conversation, the answer comes with "a technician can take it from here". */
export const NUDGE_AFTER_TURNS = 3;
/** From this many on, a new question is not sent to the model: the window hands over instead. */
export const MAX_MODEL_TURNS = 8;

/** The longest quote of the visitor's own words in the WhatsApp message. */
export const HANDOFF_QUOTE_MAX = 280;

/** The visitor's question as it is quoted to the technician: one line, cut at a word. */
export function quoteForHandoff(text: string, max = HANDOFF_QUOTE_MAX): string {
  const line = text.replace(/\s+/g, ' ').trim();
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export type HandoffTurn =
  { role: 'user'; text: string } | { role: 'assistant'; service?: string | null };

/**
 * What to pass on for the entry at `index`: the last thing the visitor wrote up to that point and
 * the service the assistant suggested in answer to it — never one from an earlier question.
 */
export function handoffContext(
  turns: HandoffTurn[],
  index: number,
): { question: string; service: string | null } {
  let question = '';
  let service: string | null = null;
  for (const turn of turns.slice(0, index + 1)) {
    if (turn.role === 'user') {
      if (turn.text.trim()) question = quoteForHandoff(turn.text);
      service = null;
    } else if (turn.service) {
      service = turn.service;
    }
  }
  return { question, service };
}
