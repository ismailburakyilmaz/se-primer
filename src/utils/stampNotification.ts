import { StampType } from '../components/RubberStamp.js';

export interface StampNotificationPayload {
  text: string;
  type?: StampType;
  description: string;
  isYonetmen?: boolean;
}

export function triggerStamp(payload: StampNotificationPayload) {
  if (typeof window === 'undefined') return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(payload.isYonetmen ? [60, 40, 60] : 120);
    } catch {
      // Ignore errors if vibrate not permitted
    }
  }

  window.dispatchEvent(
    new CustomEvent<StampNotificationPayload>('se-primer-stamp', {
      detail: payload,
    })
  );
}
