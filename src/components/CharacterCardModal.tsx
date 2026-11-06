import React, { useEffect } from 'react';
import { getKarakter } from '../utils/engine.js';
import { Portre } from './Portre.js';

interface Props {
  kisiId: string;
  onClose: () => void;
}

export const CharacterCardModal: React.FC<Props> = ({ kisiId, onClose }) => {
  const karakter = getKarakter(kisiId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <div
        data-testid={`kart-${kisiId}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-5 shadow-none"
      >
        <div className="flex items-start justify-between pb-3 border-b border-[var(--cizgi)] mb-3">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            PERSONEL KİMLİK KARTI
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-[var(--soluk)] hover:text-[var(--murekkep)] cursor-pointer text-[18px] focus:outline-none"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Portre kisiId={kisiId} boy={96} />
          <div className="flex-1 min-w-0">
            <h3 className="font-sans text-[18px] font-semibold text-[var(--murekkep)] leading-snug">
              {karakter.ad}
            </h3>
            <div className="font-mono-code text-[12px] text-[var(--soluk)] font-medium uppercase tracking-wider mt-1">
              {karakter.gorev}
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px] text-[var(--murekkep)] leading-relaxed">
          {karakter.tanim}
        </div>

        <div className="mt-4 pt-2 border-t border-dashed border-[var(--cizgi)] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-mono-code text-[var(--murekkep)] border border-[var(--murekkep)] bg-[var(--fis)] hover:bg-[var(--kagit)] rounded-[2px] cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
