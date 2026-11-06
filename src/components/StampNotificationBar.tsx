import React, { useState, useEffect } from 'react';
import { RubberStamp } from './RubberStamp.js';
import { StampNotificationPayload } from '../utils/stampNotification.js';

export const StampNotificationBar: React.FC = () => {
  const [current, setCurrent] = useState<StampNotificationPayload | null>(null);

  useEffect(() => {
    let timer: any = null;

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<StampNotificationPayload>;
      if (!customEvent.detail) return;

      setCurrent(customEvent.detail);

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setCurrent(null);
      }, 3000);
    };

    window.addEventListener('se-primer-stamp', handler);
    return () => {
      window.removeEventListener('se-primer-stamp', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!current) return null;

  return (
    <div className="fixed top-3 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        data-testid="bildirim-damga"
        onClick={() => setCurrent(null)}
        role="button"
        tabIndex={0}
        className="pointer-events-auto max-w-lg w-full bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] px-3.5 py-2.5 flex items-center gap-3 cursor-pointer select-none transition-transform"
      >
        <RubberStamp text={current.text} type={current.type} bas={true} />
        <span className="font-mono-code text-[12px] text-[var(--murekkep)] font-medium truncate">
          {current.description}
        </span>
      </div>
    </div>
  );
};
