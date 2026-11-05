'use client';

import type { ReactNode } from 'react';
import { ASSISTANT_OPEN_EVENT } from '@/components/assistant/events';

type Props = { children: ReactNode; className?: string; prompt?: string };

/**
 * Any element on a page that should open the assistant: fires the window event the widget
 * listens for (the widget lives in the layout, so no prop can reach it). Optional `prompt`
 * pre-fills the message field.
 */
export function AssistantTrigger({ children, className, prompt }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT, { detail: { prompt } }))
      }
    >
      {children}
    </button>
  );
}
