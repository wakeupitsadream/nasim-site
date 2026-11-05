/** Window event that opens the assistant widget; `detail.prompt` pre-fills the message field. */
export const ASSISTANT_OPEN_EVENT = 'brigada:assistant-open';

export type AssistantOpenDetail = { prompt?: string };
