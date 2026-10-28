import React from 'react';

interface Props {
  clue: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ClueModal: React.FC<Props> = ({ clue, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        data-testid="panel-ipucu"
        className="w-full sm:max-w-md bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-4 text-[var(--murekkep)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            HAZIR İPUCU
          </span>
          <button
            onClick={onClose}
            className="text-[var(--soluk)] hover:text-[var(--murekkep)] text-[16px] px-1 font-mono-code cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="bg-[var(--kagit)] border border-[var(--cizgi)] p-3 rounded-[4px] mb-4">
          <p className="text-[15px] leading-relaxed italic text-[var(--murekkep)]">
            "{clue}"
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full h-11 bg-[var(--tukenmez)] text-white font-medium rounded-[4px] cursor-pointer"
        >
          Anladım, Kapat
        </button>
      </div>
    </div>
  );
};
