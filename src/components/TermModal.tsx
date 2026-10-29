import React, { useEffect } from 'react';
import { Terim } from '../types/game.js';

interface Props {
  term: Terim | null;
  onClose: () => void;
}

export const TermModal: React.FC<Props> = ({ term, onClose }) => {
  useEffect(() => {
    if (!term) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [term, onClose]);

  if (!term) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        data-testid="balon-terim"
        className="w-full max-w-sm bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 text-[var(--murekkep)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--cizgi)] pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              TERİM SÖZLÜĞÜ
            </span>
            <span className="font-mono-code text-[14px] font-bold text-[var(--tukenmez)]">
              {term.terim}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--soluk)] hover:text-[var(--murekkep)] text-[16px] font-mono-code cursor-pointer -mr-2 -my-2"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <p className="text-[14px] leading-relaxed text-[var(--murekkep)]">
          {term.tanim}
        </p>
        <div className="mt-3 pt-2 tear-line flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-mono-code text-[var(--soluk)] hover:text-[var(--murekkep)] px-3 py-1.5 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)] cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
